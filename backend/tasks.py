import os
from celery import Celery
import joblib
import pandas as pd

# Load environment variable for broker URL
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
MODEL_PATH = os.getenv("MODEL_PATH", "model/model.pkl")

# Create Celery app
app = Celery("tasks", broker=CELERY_BROKER_URL,backend=CELERY_BROKER_URL)

# Lazy model cache
_model = None

def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"❌ Model not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
        print("✅ Model loaded by worker")
    return _model

@app.task
def run_inference(data_chunk):
    try:
        df = pd.DataFrame(data_chunk)
        print("📦 Received data chunk:", df.head())  # 👈 Debug
        model = get_model()
        predictions = model.predict(df)
        print("✅ Predictions made:", predictions[:5])  # 👈 Debug
        return predictions.tolist()
    except Exception as e:
        print(f"❌ Inference failed: {e}")
        return {"error": str(e)}
