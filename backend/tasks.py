import os
from celery import Celery
import joblib
import pandas as pd

# Load environment variable for broker URL
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

# Create Celery app
app = Celery("tasks", broker=CELERY_BROKER_URL)

# Load model once per worker process (efficient)
MODEL_PATH = os.getenv("MODEL_PATH", "model/model.pkl")
model = joblib.load(MODEL_PATH)

@app.task
def run_inference(data_chunk):
    df = pd.DataFrame(data_chunk)
    predictions = model.predict(df)
    return predictions.tolist()
