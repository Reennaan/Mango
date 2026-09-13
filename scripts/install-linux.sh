#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${VENV_DIR:-$ROOT_DIR/.venv}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Python 3 não foi encontrado. Instale python3 e tente novamente." >&2
  exit 1
fi

if ! "$PYTHON_BIN" -m venv --help >/dev/null 2>&1; then
  echo "O módulo venv não está disponível. Instale python3-venv e tente novamente." >&2
  exit 1
fi

if [[ ! -d "$VENV_DIR" ]]; then
  echo "Criando ambiente virtual em $VENV_DIR"
  "$PYTHON_BIN" -m venv --system-site-packages "$VENV_DIR"
else
  if ! "$VENV_DIR/bin/python" - <<'PY' >/dev/null 2>&1
import importlib.util
raise SystemExit(0 if importlib.util.find_spec('gi') else 1)
PY
  then
    echo "Recriando ambiente virtual para aproveitar os pacotes do sistema..."
    rm -rf "$VENV_DIR"
    "$PYTHON_BIN" -m venv --system-site-packages "$VENV_DIR"
  fi
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

python -m pip install --upgrade pip setuptools wheel
python -m pip install -r "$ROOT_DIR/requirements-linux.txt"

if command -v apt-get >/dev/null 2>&1; then
  echo "Detectado Ubuntu/Debian. Instalando dependências do sistema..."
  if [[ $EUID -eq 0 ]]; then
    SUDO=""
  elif command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "Este sistema precisa de permissões de root para instalar dependências do sistema. Execute este script como root ou com sudo." >&2
    exit 1
  fi

  $SUDO apt-get update
  $SUDO apt-get install -y \
    python3-venv python3-pip python3-gi \
    libglib2.0-0 libgtk-3-0 libxkbcommon-x11-0 \
    libxcb-cursor0 libxcb-icccm4 libxcb-image0 libxcb-keysyms1 \
    libxcb-randr0 libxcb-render-util0 libxcb-shape0 libxcb-xfixes0 \
    libxcb-xinerama0 libxcb-xkb1 libxrender1 libsm6 libxext6 \
    gir1.2-webkit2-4.1 libwebkit2gtk-4.1-0

elif command -v dnf >/dev/null 2>&1; then
  echo "Detectado Fedora. Instalando dependências do sistema..."
  if [[ $EUID -eq 0 ]]; then
    SUDO=""
  elif command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "Este sistema precisa de permissões de root para instalar dependências do sistema. Execute este script como root ou com sudo." >&2
    exit 1
  fi

  $SUDO dnf install -y python3 python3-pip python3-devel python3-gobject gtk3 libxcb libxkbcommon-x11 xcb-util-cursor webkit2gtk4.1

elif command -v pacman >/dev/null 2>&1; then
  echo "Detectado Arch Linux. Instalando dependências do sistema..."
  if [[ $EUID -eq 0 ]]; then
    SUDO=""
  elif command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "Este sistema precisa de permissões de root para instalar dependências do sistema. Execute este script como root ou com sudo." >&2
    exit 1
  fi

  $SUDO pacman -S --needed --noconfirm python python-pip gtk3 libxkbcommon xcb-util-cursor python-gobject webkit2gtk-4.1

else
  echo "Distribuição Linux não identificada. O Mango pode continuar com o ambiente virtual, mas é preciso instalar manualmente as dependências do sistema." >&2
fi

echo "Instalação concluída."
echo "Para executar, rode: ./scripts/run-linux.sh"
