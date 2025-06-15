FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install Docker CLI and dependencies
RUN apt-get update && \
    apt-get install -y curl gnupg ca-certificates docker.io && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Docker Compose plugin (v2)
RUN curl -SL https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose && \
    ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Create a non-root user for optional production use
RUN groupadd -r appuser && useradd -m -r -g appuser appuser && \
    chown -R appuser:appuser /app

# Copy backend code
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Uncomment this line to run as non-root (optional for production)
# USER appuser

# Start FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
