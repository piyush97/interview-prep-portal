#!/bin/bash
# Stop the preview server started by start.sh
PID_FILE="${PID_FILE:-/tmp/prep-portal.pid}"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill "$PID" 2>/dev/null; then
    echo "✅ Stopped portal (PID $PID)"
    rm -f "$PID_FILE"
  else
    echo "⚠️  Process $PID not running, cleaning up"
    rm -f "$PID_FILE"
  fi
else
  echo "ℹ️  No PID file found, killing any vite preview process"
  pkill -f "vite preview" 2>/dev/null || true
fi
