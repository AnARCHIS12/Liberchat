#!/bin/bash

# Vérifier si nous sommes sur macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Ce script doit être exécuté sur macOS"
    exit 1
fi

# Se placer dans le dossier macos
cd "$(dirname "$0")"

# Installer les dépendances
npm install

# Vérifier si l'icône existe
if [ ! -f "build/icon.icns" ]; then
    echo "ATTENTION: Placez l'icône de l'application dans build/icon.icns"
fi

# Vérifier si l'image de fond existe
if [ ! -f "build/background.png" ]; then
    echo "ATTENTION: Placez l'image de fond du DMG dans build/background.png"
fi

# Compiler l'application
echo "Compilation de Liberchat pour macOS..."
npm run build

echo "Compilation terminée ! Vérifiez le dossier dist/ pour les fichiers DMG et ZIP"
