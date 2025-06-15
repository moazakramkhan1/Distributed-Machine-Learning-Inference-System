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

# Copy backend code
COPY . .

# Copy docker-compose.yml (assumes build context is the parent folder)


# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Start FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]