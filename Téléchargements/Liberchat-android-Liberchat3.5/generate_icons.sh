#!/bin/bash
# Génère les icônes Android à partir de icon.png
# Nécessite ImageMagick (commande 'convert')

set -e

ICON_SRC="icon.png"
if [ ! -f "$ICON_SRC" ]; then
  echo "Fichier $ICON_SRC introuvable ! Placez-le à la racine du projet."
  exit 1
fi

declare -A SIZES=(
  [mdpi]=48
  [hdpi]=72
  [xhdpi]=96
  [xxhdpi]=144
  [xxxhdpi]=192
)

for dpi in "${!SIZES[@]}"; do
  size=${SIZES[$dpi]}
  dest="android/app/src/main/res/mipmap-$dpi/ic_launcher.png"
  echo "Génération $dest ($size x $size)"
  convert "$ICON_SRC" -resize ${size}x${size} "$dest"
done

echo "✅ Icônes générées et remplacées !"
