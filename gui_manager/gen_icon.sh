#!/bin/bash
# Génère une icône PNG et ICO à partir du SVG pour Linux et Windows
# Dépendances : inkscape, imagemagick

inkscape liberchat-logo-256.svg -o liberchat.png -w 256 -h 256
inkscape liberchat-logo-256.svg -o liberchat-512.png -w 512 -h 512
convert liberchat.png liberchat.ico

echo "liberchat.ico et liberchat-512.png générés."
