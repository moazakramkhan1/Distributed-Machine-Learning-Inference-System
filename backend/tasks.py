import os
from celery import Celery
import joblib
import pandas as pd

# Load environment variable for broker URL
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
MODEL_PATH = os.getenv("MODEL_PATH", "model/model.pkl")

# Create Celery app
app = Celery("tasks", broker=CELERY_BROKER_URL)

# Lazy model loading
model = None

def get_model():
    global model
    if model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"❌ Model not found at {MODEL_PATH}")
        model = joblib.load(MODEL_PATH)
        print("✅ Model loaded")
    return model

@app.task
def run_inference(data_chunk):
    df = pd.DataFrame(data_chunk)
    return get_model().predict(df).tolist()