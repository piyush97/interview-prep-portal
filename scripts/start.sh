#!/bin/bash
# Production startup script for Interview Prep Portal
# Builds the portal and starts the preview server with health check.
set -e

PORT="${PORT:-8766}"
HOST="${HOST:-0.0.0.0}"

echo "🎯 Interview Prep Portal - Production Startup"
echo "=============================================="

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm ci --omit=dev
fi

echo "🔨 Building production bundle..."
npm run build

echo "🚀 Starting preview server on http://${HOST}:${PORT}"
echo "📍 Health check: http://${HOST}:${PORT}/healthz"

# Start preview server in background
nohup npx vite preview --host "$HOST" --port "$PORT" --strictPort > /tmp/prep-portal.log 2>&1 &
PID=$!
echo "$PID" > /tmp/prep-portal.pid

# Wait for it to come up
for i in {1..30}; do
  if curl -fs "http://localhost:${PORT}" >/dev/null 2>&1; then
    echo "✅ Portal is up (PID $PID)"
    exit 0
  fi
  sleep 1
done

echo "❌ Portal failed to start within 30s"
echo "--- last 20 log lines ---"
tail -20 /tmp/prep-portal.log
exit 1
