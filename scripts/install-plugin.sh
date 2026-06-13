#!/bin/bash
# Install Career Prep Plugin for Hermes Agent
# Run from the repo root: bash scripts/install-plugin.sh
set -e

HERMES_PLUGINS="${HOME}/.hermes/plugins/career-prep"

echo "Installing Career Prep plugin to ${HERMES_PLUGINS}..."
mkdir -p "${HERMES_PLUGINS}"
cp -r plugin/career-prep/* "${HERMES_PLUGINS}/"
echo ""
echo "✓ Plugin installed. Enable it:"
echo "  hermes plugins enable career-prep"
echo ""
echo "Then start a session:"
echo "  hermes"
echo ""
echo "Try: /prep help"
