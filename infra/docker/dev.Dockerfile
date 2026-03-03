# ──────────────────────────────────────────────────────────
# DGN-DJ / RoboDJ — Development Dockerfile (Backend)
# ──────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /workspace

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt* ./
RUN pip install --no-cache-dir --upgrade pip && \
    if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi && \
    pip install --no-cache-dir \
        fastapi \
        uvicorn[standard] \
        httpx \
        alembic \
        sqlalchemy \
        psycopg2-binary \
        redis \
        python-dotenv

# Copy source (overridden by volume mount in dev)
COPY . .

EXPOSE 8000

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
