#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$ROOT/release/Andhra Thota Agents"
NODE_VER="${NODE_VER:-v22.14.0}"

cd "$ROOT"
npm run build

rm -rf "$ROOT/release"
mkdir -p "$STAGE/app/.next" "$STAGE/runtime"

cp -a "$ROOT/.next/standalone/." "$STAGE/app/"
cp -a "$ROOT/.next/static" "$STAGE/app/.next/static"
if [[ -d "$ROOT/public" ]]; then
  cp -a "$ROOT/public" "$STAGE/app/public"
fi

echo "Downloading the Windows Node runtime ${NODE_VER}"
curl -fL --retry 3 -o "$STAGE/runtime/node.exe" \
  "https://nodejs.org/dist/${NODE_VER}/win-x64/node.exe"

cd "$ROOT/packaging/launcher"
build_win() {
  local path="$1"
  local out="$2"
  CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build \
    -ldflags "-H windowsgui -X main.startPath=${path}" \
    -o "$out" .
}
build_win inbox "$STAGE/Order Agent.exe"
build_win group "$STAGE/Group Agent.exe"
build_win stop "$STAGE/Stop Agents.exe"

cp "$ROOT/packaging/windows/Install shortcuts.bat" "$STAGE/Install shortcuts.bat"
cp "$ROOT/packaging/windows/README.txt" "$STAGE/README.txt"
cp "$ROOT/packaging/windows/andhra-thota.env.example" "$STAGE/andhra-thota.env.example"

mkdir -p /opt/cursor/artifacts
rm -f /opt/cursor/artifacts/AndhraThota-Agents-Windows.zip
(
  cd "$ROOT/release"
  zip -r -q /opt/cursor/artifacts/AndhraThota-Agents-Windows.zip "Andhra Thota Agents"
)
ls -lh /opt/cursor/artifacts/AndhraThota-Agents-Windows.zip
echo "Packaged $STAGE"
