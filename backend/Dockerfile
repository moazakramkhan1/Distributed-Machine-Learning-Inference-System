FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy backend code
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Uncomment this line to run as non-root (optional for production)
# USER appuser

# Start FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
