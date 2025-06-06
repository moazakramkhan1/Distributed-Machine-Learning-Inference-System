from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
import pandas as pd
import io
import os
from tasks import run_inference
from fastapi.middleware.cors import CORSMiddleware
from model.train_model import train_model_from_df

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict/")
async def predict(file: UploadFile):
    df = pd.read_csv(io.StringIO((await file.read()).decode()))
    chunks = [df.iloc[i:i+10].to_dict(orient='records') for i in range(0, len(df), 10)]
    tasks = [run_inference.delay(chunk) for chunk in chunks]
    results = [task.get() for task in tasks]
    return {"predictions": sum(results, [])}

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
