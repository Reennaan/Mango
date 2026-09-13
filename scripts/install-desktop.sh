#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${HOME}/.local/share/applications"
ICON_DIR="${HOME}/.local/share/icons/hicolor/256x256/apps"

mkdir -p "$TARGET_DIR" "$ICON_DIR"
cp "$ROOT_DIR/img/icon.png" "$ICON_DIR/mango.png"

python3 - <<'PY' "$ROOT_DIR/packaging/mango.desktop.template" "$ROOT_DIR/scripts/run-linux.sh" "$TARGET_DIR/mango.desktop" "$ICON_DIR/mango.png"
import pathlib
import sys

template_path, run_script, desktop_path, icon_path = sys.argv[1:]
text = pathlib.Path(template_path).read_text(encoding="utf-8")
text = text.replace("__RUN_SCRIPT__", run_script).replace("__ICON_PATH__", icon_path)
pathlib.Path(desktop_path).write_text(text, encoding="utf-8")
PY

echo "Atalho instalado em $TARGET_DIR/mango.desktop"
