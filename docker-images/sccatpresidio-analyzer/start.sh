#!/bin/bash
set -e

echo "Starting Presidio Analyzer..."
echo "Port: ${PORT:-3000}"
echo "Log Level: ${LOG_LEVEL:-info}"

# Start the analyzer service using our custom app.py
exec uvicorn app:app \
    --host 0.0.0.0 \
    --port ${PORT:-3000} \
    --log-level ${LOG_LEVEL:-info}

# Made with Bob
