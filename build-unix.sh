#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v cargo >/dev/null 2>&1; then
  echo "Rust/Cargo was not found. Install Rust from https://rustup.rs/ first."
  exit 1
fi

npm install
npm run tauri icon src-tauri/icons/icon.svg

case "$(uname -s)" in
  Darwin)
    rustup target add aarch64-apple-darwin x86_64-apple-darwin
    npm run tauri:build -- --target universal-apple-darwin --bundles app,dmg
    echo "macOS bundles: src-tauri/target/universal-apple-darwin/release/bundle/"
    ;;
  Linux)
    npm run tauri:build -- --bundles appimage,deb
    echo "Linux bundles: src-tauri/target/release/bundle/"
    ;;
  *)
    echo "Unsupported OS: $(uname -s)"
    exit 1
    ;;
esac
