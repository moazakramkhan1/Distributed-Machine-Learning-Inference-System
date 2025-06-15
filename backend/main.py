from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
import pandas as pd
import io
import os
from tasks import run_inference
from fastapi.middleware.cors import CORSMiddleware
from model.train_model import train_model_from_df
import uuid
import redis
import subprocess
import shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
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


    
@app.post("/predict/")
async def predict(file: UploadFile):
    # Step 1: Read file
    df = pd.read_csv(io.StringIO((await file.read()).decode()))

    # Step 2: Dynamically scale workers (manual scaling logic)
    num_rows = len(df)
    desired_workers = max(1, min((num_rows // 1000) + 1, 10))  # scale between 1 and 10

    try:
        subprocess.run(["docker-compose", "up", "--scale", f"worker={desired_workers}", "-d"], check=True)  
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Scaling failed: {e}")

    # Step 3: Split into chunks and send to Celery
    chunks = [df.iloc[i:i+10].to_dict(orient='records') for i in range(0, num_rows, 10)]
    tasks = [run_inference.delay(chunk) for chunk in chunks]

    results = []
    for task in tasks:
        task_result = task.get()
        if isinstance(task_result, dict) and "error" in task_result:
            raise HTTPException(status_code=500, detail=task_result["error"])
        elif isinstance(task_result, list):
            results.extend(task_result)
        else:
            raise HTTPException(status_code=500, detail="Unexpected task result format.")

    if len(results) != num_rows:
        raise HTTPException(status_code=500, detail="Mismatch between predictions and input rows.")

    # Step 4: Save CSV with predictions

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

