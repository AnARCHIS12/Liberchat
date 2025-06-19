#!/bin/bash
# Script de build multi-plateforme pour Liberchat GUI
# Usage : ./build_gui.sh

set -e

cd "$(dirname "$0")"

# Génération des icônes si besoin
if [ ! -f liberchat.ico ] || [ ! -f liberchat-512.png ]; then
  echo "Génération des icônes (Windows et Linux)..."
  inkscape liberchat-logo-256.svg -o liberchat.png -w 256 -h 256
  inkscape liberchat-logo-256.svg -o liberchat-512.png -w 512 -h 512
  convert liberchat.png liberchat.ico
fi

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
