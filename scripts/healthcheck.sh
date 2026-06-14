#!/bin/bash
# Health check for Interview Prep Portal
PORT="${PORT:-8766}"

if curl -fs "http://localhost:${PORT}/" >/dev/null 2>&1; then
  echo "OK"
  exit 0
else
  echo "FAIL"
  exit 1
fi
