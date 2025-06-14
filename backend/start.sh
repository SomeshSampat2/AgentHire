#!/bin/bash
set -e

# Create uploads directory if it doesn't exist
mkdir -p /app/uploads

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} 