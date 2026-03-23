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

clean_api_base_url="$(printf '%s' "${API_BASE_URL}" | tr -d '\r\n')"
clean_api_key="$(printf '%s' "${API_KEY}" | tr -d '\r\n')"

if [ -z "${clean_api_base_url}" ]; then
  echo "ERROR: API_BASE_URL quedo vacio despues de limpiar saltos de linea."
  exit 1
fi

if [ -z "${clean_api_key}" ]; then
  echo "ERROR: API_KEY quedo vacio despues de limpiar saltos de linea."
  exit 1
fi

flutter --version
flutter config --enable-web
flutter pub get
flutter build web --release --dart-define=API_BASE_URL="${clean_api_base_url}" --dart-define=API_KEY="${clean_api_key}"
