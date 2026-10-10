FROM python:3.12-slim

# Create a non‑root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Set work directory
WORKDIR /app

# Install OS dependencies (only what's needed for psycopg2 binary)
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the backend source code (ignore frontend, env files, caches etc.)
COPY backend/ ./

# Omit static collection until static files are properly configured
# RUN python manage.py collectstatic --noinput

# Switch to non‑root user
USER appuser

# Expose the default Django port
EXPOSE 8000

# Run the application with gunicorn
CMD ["gunicorn", "lms_project.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]
