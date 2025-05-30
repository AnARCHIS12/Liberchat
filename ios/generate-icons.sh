#!/bin/bash

# Créer le dossier des icônes si il n'existe pas
mkdir -p App/App/Assets.xcassets/AppIcon.appiconset

# Convertir SVG en PNG haute résolution
convert ../public/images/liberchat-logo.svg -resize 1024x1024 icon-1024.png

# Générer toutes les tailles d'icônes
convert icon-1024.png -resize 40x40 App/App/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@2x.png
convert icon-1024.png -resize 60x60 App/App/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@3x.png
convert icon-1024.png -resize 58x58 App/App/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@2x.png
convert icon-1024.png -resize 87x87 App/App/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@3x.png
convert icon-1024.png -resize 80x80 App/App/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@2x.png
convert icon-1024.png -resize 120x120 App/App/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@3x.png
convert icon-1024.png -resize 120x120 App/App/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png
convert icon-1024.png -resize 180x180 App/App/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@3x.png
convert icon-1024.png -resize 1024x1024 App/App/Assets.xcassets/AppIcon.appiconset/ItunesArtwork@2x.png

# Nettoyer
rm icon-1024.png
