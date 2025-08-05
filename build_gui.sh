#!/bin/bash
# Script de build multi-plateforme pour Liberchat GUI
# Usage : ./build_gui.sh

set -e

cd "$(dirname "$0")/gui_manager"

# Installation des dépendances
npm install

# Installation d'electron-builder si besoin
if ! npx electron-builder --version &>/dev/null; then
  npm install --save-dev electron-builder
fi

echo "--- Build AppImage (Linux) ---"
npx electron-builder --linux AppImage

echo "--- Build .deb (Linux) ---"
npx electron-builder --linux deb

echo "--- Build .exe installateur (Windows) ---"
npx electron-builder --win nsis

echo "Build terminé. Les fichiers sont dans le dossier 'dist'."
