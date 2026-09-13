#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist/deb"
WORK_DIR="$OUT_DIR/work"
PKG_DIR="$WORK_DIR/mango"

rm -rf "$OUT_DIR" "$WORK_DIR"
mkdir -p "$PKG_DIR/DEBIAN" "$PKG_DIR/usr/bin" "$PKG_DIR/usr/share/applications" "$PKG_DIR/usr/share/icons/hicolor/256x256/apps" "$PKG_DIR/opt/mango"

mkdir -p "$PKG_DIR/opt/mango"
cp -a "$ROOT_DIR/src" "$PKG_DIR/opt/mango/"
cp -a "$ROOT_DIR/assets" "$PKG_DIR/opt/mango/"
cp -a "$ROOT_DIR/img" "$PKG_DIR/opt/mango/"
cp -a "$ROOT_DIR/scripts" "$PKG_DIR/opt/mango/"
cp "$ROOT_DIR/requirements-linux.txt" "$PKG_DIR/opt/mango/"
cp "$ROOT_DIR/requirements.txt" "$PKG_DIR/opt/mango/"
cp "$ROOT_DIR/README-linux.md" "$PKG_DIR/opt/mango/"

cat > "$PKG_DIR/usr/bin/mango" <<'EOF'
#!/usr/bin/env bash
exec /bin/bash /opt/mango/scripts/run-linux.sh "$@"
EOF
chmod 755 "$PKG_DIR/usr/bin/mango"

cp "$ROOT_DIR/img/icon.png" "$PKG_DIR/usr/share/icons/hicolor/256x256/apps/mango.png"

cat > "$PKG_DIR/usr/share/applications/mango.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Mango
Comment=Aplicação Mango para leitura de mangás
Exec=/usr/bin/mango
Icon=/usr/share/icons/hicolor/256x256/apps/mango.png
Terminal=false
Categories=Utility;Graphics;Viewer;
StartupNotify=true
EOF

cat > "$PKG_DIR/DEBIAN/control" <<EOF
Package: mango
Version: 1.0.1
Section: utils
Priority: optional
Architecture: all
Depends: python3, python3-venv, python3-pip
Maintainer: Mango Team
Description: Mango para Linux
EOF

cat > "$PKG_DIR/DEBIAN/postinst" <<'EOF'
#!/usr/bin/env bash
set -e
/usr/bin/python3 -m venv /opt/mango/.venv
/opt/mango/.venv/bin/pip install --upgrade pip
/opt/mango/.venv/bin/pip install -r /opt/mango/requirements-linux.txt
chmod +x /opt/mango/scripts/run-linux.sh
exit 0
EOF
chmod 755 "$PKG_DIR/DEBIAN/postinst"

if command -v dpkg-deb >/dev/null 2>&1; then
  dpkg-deb --build "$PKG_DIR" "$OUT_DIR/mango.deb"
  echo "Pacote .deb criado em $OUT_DIR/mango.deb"
else
  echo "dpkg-deb não encontrado; instale o pacote dpkg e tente novamente." >&2
  exit 1
fi
