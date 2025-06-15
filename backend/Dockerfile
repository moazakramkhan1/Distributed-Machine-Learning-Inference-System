FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install Docker CLI (and required dependencies)
RUN apt-get update && apt-get install -y docker.io docker-compose

# Copy source code
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]