#!/bin/bash
# Production-grade serve script for the Interview Prep Portal SPA.
# Serves the built dist/ directory with SPA history fallback so direct
# URL access (e.g. /applications) doesn't 404.
set -e

PORT="${PORT:-8766}"
DIST_DIR="$(cd "$(dirname "$0")/.." && pwd)/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "❌ dist/ not found. Run: npm run build"
  exit 1
fi

# Try npx serve (preferred — built-in SPA fallback)
if command -v npx >/dev/null 2>&1; then
  echo "Starting Interview Prep Portal on http://localhost:$PORT/"
  echo "(Single-page app, direct URL access works)"
  exec npx --yes serve -s "$DIST_DIR" -l "$PORT" --no-clipboard
fi

# Fallback: a tiny Python SPA server
echo "Falling back to Python SPA server (install 'serve' for production use)"
cd "$DIST_DIR"
exec python3 -c "
import http.server, socketserver, os
from http.server import SimpleHTTPRequestHandler

class SPAHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve file if it exists, otherwise fall back to index.html
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = '/index.html'
        return super().do_GET()

with socketserver.TCPServer(('', $PORT), SPAHandler) as httpd:
    print(f'Interview Prep Portal: http://localhost:{$PORT}/')
    httpd.serve_forever()
"
