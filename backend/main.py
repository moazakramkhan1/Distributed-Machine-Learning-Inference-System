from fastapi import FastAPI, UploadFile, Form, HTTPException
import pandas as pd
from tasks import run_inference
import io
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
async def train(file: UploadFile, target_column: str = Form(...)):
    try:
        df = pd.read_csv(io.StringIO((await file.read()).decode()))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {e}")

    if target_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{target_column}' not found in uploaded data.")

    train_model_from_df(df, target_column=target_column)
    return {"message": f"✅ Model trained successfully using '{target_column}' as target."}