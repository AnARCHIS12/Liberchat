#!/bin/bash
# Script de gestion simplifiée de Liberchat (web)
# Usage : ./auto_gestion.sh

RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
BOLD='\033[1m'
NC='\033[0m'

APP_DIR="$(dirname $(realpath $0))"
APP_MAIN="server.js"
PID_FILE="$APP_DIR/app.pid"
LOG_FILE="$APP_DIR/app.log"

banner() {
  echo -e "${RED}${BOLD}✊ LIBERCHAT — Gestion anarchiste ✊${NC}"
  echo -e "${CYAN}Pour l'autogestion, la solidarité et la liberté numérique !${NC}"
  echo -e "${YELLOW}Aucun chef, pas de patron, juste du code libre et du chaos organisé.${NC}\n"
}

menu() {
  clear
  banner
  echo -e "${GREEN}1) Démarrer l'application (npm start)${NC}"
  echo -e "${RED}2) Arrêter l'application${NC}"
  echo -e "${YELLOW}3) Redémarrer l'application${NC}"
  echo -e "${CYAN}4) Voir les logs${NC}"
  echo -e "${YELLOW}5) Rebuild (npm run build)${NC}"
  echo -e "${CYAN}6) Ouvrir une adresse .onion dans Tor Browser${NC}"
  echo -e "${RED}7) Quitter${NC}"
  read -p "${BOLD}Choisissez une option [1-7] : ${NC}" CHOICE
}

start_app() {
  if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
    echo -e "${YELLOW}Application déjà en cours d'exécution (PID $(cat $PID_FILE)).${NC}"
  else
    nohup npm start > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo -e "${GREEN}Application démarrée en arrière-plan (PID $(cat $PID_FILE)).${NC}"
  fi
}

stop_app() {
  if [ -f "$PID_FILE" ]; then
    kill $(cat "$PID_FILE") && rm "$PID_FILE"
    echo -e "${RED}Application arrêtée.${NC}"
  else
    echo -e "${YELLOW}Aucun process à arrêter.${NC}"
  fi
}

restart_app() {
  stop_app
  start_app
}

logs_app() {
  if [ -f "$LOG_FILE" ]; then
    tail -n 50 "$LOG_FILE"
  else
    echo -e "${YELLOW}Aucun log disponible.${NC}"
  fi
}

rebuild_app() {
  if [ -f "$APP_DIR/package.json" ]; then
    echo -e "${CYAN}Lancement de npm run build...${NC}"
    cd "$APP_DIR"
    npm run build || echo -e "${RED}Erreur lors du build.${NC}"
  else
    echo -e "${RED}Aucun package.json trouvé.${NC}"
  fi
}

open_onion_in_tor() {
  local onion_url="$1"
  if command -v tor-browser &>/dev/null; then
    tor-browser "$onion_url" &
    echo -e "${GREEN}Ouverture de l'adresse .onion dans Tor Browser (tor-browser).${NC}"
  elif command -v torbrowser-launcher &>/dev/null; then
    torbrowser-launcher "$onion_url" &
    echo -e "${GREEN}Ouverture de l'adresse .onion dans Tor Browser (torbrowser-launcher).${NC}"
  else
    echo -e "${YELLOW}Tor Browser n'est pas détecté. Copiez-collez cette adresse dans Tor Browser :${NC}"
    echo "$onion_url"
  fi
}

while true; do
  menu
  case $CHOICE in
    1) start_app; read -p "Appuyez sur Entrée pour continuer...";;
    2) stop_app; read -p "Appuyez sur Entrée pour continuer...";;
    3) restart_app; read -p "Appuyez sur Entrée pour continuer...";;
    4) logs_app; read -p "Appuyez sur Entrée pour continuer...";;
    5) rebuild_app; read -p "Appuyez sur Entrée pour continuer...";;
    6) read -p "Entrez l'adresse .onion à ouvrir : " ONION_URL; open_onion_in_tor "$ONION_URL"; read -p "Appuyez sur Entrée pour continuer...";;
    7) echo -e "${GREEN}Sortie. Vive la Commune numérique !${NC}"; exit 0;;
    *) echo -e "${RED}Option invalide."; sleep 1;;
  esac

done
