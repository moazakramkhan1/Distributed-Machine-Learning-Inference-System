from fastapi import FastAPI, UploadFile, Form, HTTPException, File
from fastapi.responses import FileResponse, JSONResponse
import pandas as pd
import io
import os
from fastapi.middleware.cors import CORSMiddleware
from model.train_model import train_model_from_df
from uuid import uuid4
import redis
import shutil
from celery.result import AsyncResult
from celery.app.control import Inspect
from tasks import app as celery_app, run_inference
import time

app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKER_READY_TIMEOUT = 60  # seconds
WORKER_READY_POLL_INTERVAL = 2  # seconds

PREDICTION_DIR = "/app/predictions"
os.makedirs(PREDICTION_DIR, exist_ok=True)

redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

@app.post("/upload-model/")
async def upload_model_file(model_file: UploadFile = File(...)):
    if not model_file.filename.endswith(".pkl"):
        raise HTTPException(status_code=400, detail="Only .pkl files are allowed.")

    model_path = "model/model.pkl"
    os.makedirs("model", exist_ok=True)

    try:
        with open(model_path, "wb") as buffer:
            shutil.copyfileobj(model_file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save model: {e}")

    return {"message": "✅ Model uploaded and saved to model directory."}


    
def get_active_worker_count():
    inspect: Inspect = celery_app.control.inspect()
    active_workers = inspect.ping()  # returns dict of worker names -> pong
    return len(active_workers) if active_workers else 0

def wait_for_workers(expected_count: int, timeout: int = WORKER_READY_TIMEOUT):
    start = time.time()
    while time.time() - start < timeout:
        current = get_active_worker_count()
        print(f"⏳ Waiting for workers... {current}/{expected_count} ready")
        if current >= expected_count:
            print("✅ All workers are ready.")
            return True
        time.sleep(WORKER_READY_POLL_INTERVAL)
    return False

# === Updated Predict Function ===

@app.post("/predict")
async def predict(file: UploadFile):
    try:
        df = pd.read_csv(io.StringIO((await file.read()).decode()))
        num_rows = len(df)

        # Step 1: Compute worker count and trigger scaling
        desired_workers = max(1, min((num_rows // 1000) + 1, 10))
        redis_client.set("scale:worker_count", desired_workers)

        # Step 2: Wait for Celery workers to be ready
        if not wait_for_workers(desired_workers):
            raise HTTPException(status_code=500, detail="❌ Worker startup timeout. Try again later.")

        # Step 3: Split work and dispatch tasks
        chunks = [df.iloc[i:i + 10].to_dict(orient='records') for i in range(0, num_rows, 10)]
        tasks = [run_inference.delay(chunk) for chunk in chunks]

        results = []
        for task in tasks:
            task_result = task.get(timeout=30)
            if isinstance(task_result, dict) and "error" in task_result:
                raise HTTPException(status_code=500, detail=task_result["error"])
            elif isinstance(task_result, list):
                results.extend(task_result)
            else:
                raise HTTPException(status_code=500, detail="Unexpected task result format.")

        if len(results) != num_rows:
            raise HTTPException(status_code=500, detail="Mismatch between predictions and input rows.")

        # Step 4: Save predictions
        output_df = df.copy()
        output_df["prediction"] = results
        file_id = str(uuid4())
        output_path = os.path.join(PREDICTION_DIR, f"{file_id}.csv")
        output_df.to_csv(output_path, index=False)

        return JSONResponse(content={
            "message": "✅ Predictions complete. Ready to download.",
            "prediction_file": file_id,
            "predictions": results[:5]  # Optional preview
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/train/")
async def train(
    file: UploadFile,
    target_column: str = Form(...),
    model_type: str = Form("random_forest")
):
    try:
        df = pd.read_csv(io.StringIO((await file.read()).decode()))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {e}")

    if target_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{target_column}' not found in uploaded data.")

    try:
        train_model_from_df(df, target_column=target_column, model_type=model_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "message": f"✅ Model trained successfully using '{target_column}' as target.",
        "model_type": model_type,
    }

@app.get("/download-model/")
async def download_model():
    model_path = "model/model.pkl"
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model file not found. Train a model first.")
    return FileResponse(path=model_path, filename="trained_model.pkl", media_type="application/octet-stream")

@app.get("/download-predictions/{file_id}")
async def download_predictions(file_id: str):
    file_path = f"predictions/{file_id}.csv"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Prediction file not found.")
    return FileResponse(file_path, filename="predictions.csv", media_type="text/csv")

@app.delete("/cleanup/{file_id}")
async def delete_files(file_id: str):
    pred_file = f"predictions/{file_id}.csv"
    model_file = "model/model.pkl"  # You can make this user-specific if needed

    if os.path.exists(pred_file):
        os.remove(pred_file)
    if os.path.exists(model_file):
        os.remove(model_file)

    return {"message": "🗑️ Model and predictions deleted."}

