#!/usr/bin/env bash
set -euo pipefail

if ! command -v flutter >/dev/null 2>&1; then
  git clone --depth 1 --branch stable https://github.com/flutter/flutter.git /tmp/flutter
  export PATH="/tmp/flutter/bin:$PATH"
fi

if [ -z "${API_BASE_URL:-}" ]; then
  echo "ERROR: API_BASE_URL no esta definido en Vercel."
  exit 1
fi

if [ -z "${API_KEY:-}" ]; then
  echo "ERROR: API_KEY no esta definido en Vercel."
  exit 1
fi

flutter --version
flutter config --enable-web
flutter pub get
flutter build web --release \
  --dart-define=API_BASE_URL="${API_BASE_URL}" \
  --dart-define=API_KEY="${API_KEY}"
