#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist/rpm"
SOURCES_DIR="$OUT_DIR/SOURCES"
BUILD_DIR="$OUT_DIR/BUILD"
RPMS_DIR="$OUT_DIR/RPMS"
SRPMS_DIR="$OUT_DIR/SRPMS"

rm -rf "$OUT_DIR"
mkdir -p "$SOURCES_DIR" "$BUILD_DIR" "$RPMS_DIR" "$SRPMS_DIR"

mkdir -p "$SOURCES_DIR/mango"
cp -a "$ROOT_DIR/src" "$SOURCES_DIR/mango/"
cp -a "$ROOT_DIR/assets" "$SOURCES_DIR/mango/"
cp -a "$ROOT_DIR/img" "$SOURCES_DIR/mango/"
cp -a "$ROOT_DIR/scripts" "$SOURCES_DIR/mango/"
cp "$ROOT_DIR/requirements-linux.txt" "$SOURCES_DIR/mango/"
cp "$ROOT_DIR/requirements.txt" "$SOURCES_DIR/mango/"
cp "$ROOT_DIR/README-linux.md" "$SOURCES_DIR/mango/"
cp "$ROOT_DIR/packaging/rpm/mango.spec" "$SOURCES_DIR/"

if command -v rpmbuild >/dev/null 2>&1; then
  rpmbuild --define "_topdir $OUT_DIR" --define "_sourcedir $SOURCES_DIR" --define "_builddir $BUILD_DIR" --define "_rpmdir $RPMS_DIR" --define "_srcrpmdir $SRPMS_DIR" -bb "$SOURCES_DIR/mango.spec"
  echo "Pacote .rpm criado em $RPMS_DIR"
else
  echo "rpmbuild não encontrado; instale rpm-build e tente novamente." >&2
  exit 1
fi
