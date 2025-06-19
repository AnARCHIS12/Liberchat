#!/bin/bash
# Script centralisé de gestion Liberchat (stylisé)
# Usage : sudo ./liberchat_central.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

logo() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════════════════════════════════╗"
  echo "║                                    LIBERCHAT                                        ║"
  echo "║                        ── La Commune Numérique ✊ ──                                 ║"
  echo "╚════════════════════════════════════════════════════════════════════════════════════════╝"
  echo ""
}

menu() {
  clear
  logo
  echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   ${YELLOW}Ⓐ Liberchat : outils décentralisés Ⓐ   ${BLUE}║${NC}"
  echo -e "${BLUE}║   ${YELLOW}🌐 Pour la décentralisation numérique   ${BLUE}║${NC}"
  echo -e "${BLUE}╠══════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN} 1) 🚀 Héberger/Installer l’application${NC}"
  echo -e "${GREEN} 2) ⚙️  Gérer l’application${NC}"
  echo -e "${GREEN} 3) 🗑️  Désinstaller/Nettoyer${NC}"
  echo -e "${GREEN} 4) ❌ Quitter${NC}"
  echo -e "${GREEN} 5) 🚀 Tout configurer, builder et lancer automatiquement${NC}"
  echo -e "${GREEN} 6) 🛠️  Menu autogestion avancée${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
  read -p "${YELLOW}Choisissez une option [1-6] : ${NC}" CHOICE
}

run_script() {
  SCRIPT="$1"
  if [ -f "$SCRIPT" ]; then
    chmod +x "$SCRIPT"
    sudo "$SCRIPT"
  else
    echo -e "${RED}Le script $SCRIPT est introuvable.${NC}"
    read -p "Appuyez sur Entrée pour revenir au menu..."
  fi
}

while true; do
  menu
  case $CHOICE in
    1) run_script "./auto_hebergement.sh";;
    2) run_script "./auto_gestion.sh";;
    3) run_script "./auto_degrage.sh";;
    4) echo -e "${GREEN}Sortie. À bientôt sur Liberchat !${NC}"; exit 0;;
    5) run_script "./auto_hebergement.sh" && run_script "./auto_gestion.sh";;
    6) run_script "./auto_gestion.sh";;
    7) run_script "./auto_degrage.sh";;
    8) echo -e "${GREEN}Sortie. À bientôt sur Liberchat !${NC}"; exit 0;;
    *) echo -e "${RED}Option invalide.${NC}"; sleep 1;;
  esac
done
