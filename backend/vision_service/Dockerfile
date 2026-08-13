# Minimal image for the optional TruFor localisation service.
# TruFor source (`third_party/trufor`) and downloaded weights are NOT baked
# into the image — they are large, license-specific artefacts fetched once
# per the steps in backend/vision_service/README.md — so the image only ships
# the Python runtime; compose should mount both directories as volumes.
FROM python:3.11-slim

# OpenCV runtime deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# App lives under /app/vision_service inside the container
WORKDIR /app/vision_service

# Install Python deps
COPY requirements-cuda.txt ./requirements-cuda.txt
RUN pip install --no-cache-dir -r requirements-cuda.txt

# Copy service code
COPY app.py ./app.py

EXPOSE 8011

# Run the FastAPI app (module is `app` in this workdir)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8011"]
