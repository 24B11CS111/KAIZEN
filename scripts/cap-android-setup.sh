#!/usr/bin/env bash
# KAIZEN - Capacitor Android scaffold + sync.
# Run from project root. Idempotent: re-run after web changes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> [1/5] Installing Capacitor packages"
npm install --save \
  @capacitor/core@^6 \
  @capacitor/android@^6 \
  @capacitor/splash-screen@^6 \
  @capacitor/status-bar@^6 \
  @capacitor/app@^6
npm install --save-dev @capacitor/cli@^6

echo "==> [2/5] Initializing Capacitor (skipped if already configured)"
if [ ! -f "android/build.gradle" ]; then
  npx cap add android
fi

echo "==> [3/5] Building offline shell directory"
mkdir -p public-shell
[ -f public-shell/index.html ] || echo "ERROR: public-shell/index.html is missing"

echo "==> [4/5] Syncing web assets + native config to android/"
npx cap sync android

echo "==> [5/5] Done. Next steps:"
echo "    npx cap open android        # opens Android Studio"
echo "    cd android && ./gradlew assembleRelease   # build APK"
