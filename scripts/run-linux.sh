#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${VENV_DIR:-$ROOT_DIR/.venv}"

if [[ ! -d "$VENV_DIR" ]]; then
  echo "Ambiente virtual não encontrado. Execute primeiro: ./scripts/install-linux.sh" >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

export QT_QPA_PLATFORM=xcb
export QT_QUICK_BACKEND=${QT_QUICK_BACKEND:-software}
export GDK_BACKEND=x11
export QT_OPENGL=${QT_OPENGL:-software}
export LIBGL_ALWAYS_SOFTWARE=${LIBGL_ALWAYS_SOFTWARE:-1}
export QT_XCB_GL_INTEGRATION=${QT_XCB_GL_INTEGRATION:-none}
export WEBKIT_DISABLE_COMPOSITING_MODE=${WEBKIT_DISABLE_COMPOSITING_MODE:-1}
export QTWEBENGINE_DISABLE_SANDBOX=${QTWEBENGINE_DISABLE_SANDBOX:-1}
export QTWEBENGINE_DISABLE_GPU=${QTWEBENGINE_DISABLE_GPU:-1}
export QTWEBENGINE_DISABLE_GPU_COMPOSITING=${QTWEBENGINE_DISABLE_GPU_COMPOSITING:-1}
export QTWEBENGINE_CHROMIUM_FLAGS=${QTWEBENGINE_CHROMIUM_FLAGS:---no-sandbox --disable-gpu --disable-software-rasterizer --disable-gpu-compositing --disable-gpu-vsync}

cd "$ROOT_DIR"
python src/main.py
