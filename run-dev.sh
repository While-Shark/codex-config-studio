#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v cargo >/dev/null 2>&1; then
  echo "Rust/Cargo was not found. Install Rust from https://rustup.rs/ first."
  exit 1
fi

npm install
npm run tauri icon src-tauri/icons/icon.svg
npm run tauri:dev
