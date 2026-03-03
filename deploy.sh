#!/usr/bin/env bash
# Deploy Dashboard Hub to Netlify
# Usage:
#   ./deploy.sh          # deploy preview
#   ./deploy.sh --prod   # deploy to production
set -euo pipefail

cd "$(dirname "$0")"

# Check if netlify CLI is installed
if ! command -v netlify &>/dev/null; then
  echo "⚠️  Netlify CLI not found. Installing..."
  npm install -g netlify-cli
fi

# Build
echo "🔨 Building..."
npm run build

# Deploy
if [[ "${1:-}" == "--prod" ]]; then
  echo "🚀 Deploying to production..."
  netlify deploy --prod --dir=dist
else
  echo "🔍 Deploying preview..."
  netlify deploy --dir=dist
fi

echo "✅ Done!"
