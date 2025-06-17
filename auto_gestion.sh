#!/bin/bash
# Script de gestion de l'application Liberchat
# Usage : sudo ./auto_gestion.sh

APP_DIR="$(dirname $(realpath $0))"
APP_NAME="Liberchat"
APP_SERVICE="liberchat.service"
APP_MAIN="app.js"

menu() {
  clear
  echo "--- Gestion de l'application $APP_NAME ---"
  echo "1) Démarrer l'application"
  echo "2) Arrêter l'application"
  echo "3) Redémarrer l'application"
  echo "4) Statut de l'application"
  echo "5) Voir les logs"
  echo "6) Quitter"
  read -p "Choisissez une option [1-6] : " CHOICE
}

start_app() {
  if systemctl list-units --full -all | grep -q "$APP_SERVICE"; then
    systemctl start $APP_SERVICE
    echo "Service $APP_SERVICE démarré."
  else
    nohup node "$APP_DIR/$APP_MAIN" > "$APP_DIR/app.log" 2>&1 &
    echo $! > "$APP_DIR/app.pid"
    echo "Application démarrée en arrière-plan (PID $(cat $APP_DIR/app.pid))."
  fi
}

stop_app() {
  if systemctl list-units --full -all | grep -q "$APP_SERVICE"; then
    systemctl stop $APP_SERVICE
    echo "Service $APP_SERVICE arrêté."
  elif [ -f "$APP_DIR/app.pid" ]; then
    kill $(cat "$APP_DIR/app.pid") && rm "$APP_DIR/app.pid"
    echo "Application arrêtée."
  else
    echo "Aucun process à arrêter."
  fi
}

restart_app() {
  if systemctl list-units --full -all | grep -q "$APP_SERVICE"; then
    systemctl restart $APP_SERVICE
    echo "Service $APP_SERVICE redémarré."
  else
    stop_app
    start_app
  fi
}

status_app() {
  if systemctl list-units --full -all | grep -q "$APP_SERVICE"; then
    systemctl status $APP_SERVICE
  elif [ -f "$APP_DIR/app.pid" ]; then
    PID=$(cat "$APP_DIR/app.pid")
    if ps -p $PID > /dev/null; then
      echo "Application en cours d'exécution (PID $PID)."
    else
      echo "Process mort, suppression du PID."
      rm "$APP_DIR/app.pid"
    fi
  else
    echo "Application non démarrée."
  fi
}

logs_app() {
  if systemctl list-units --full -all | grep -q "$APP_SERVICE"; then
    journalctl -u $APP_SERVICE -n 50 --no-pager
  elif [ -f "$APP_DIR/app.log" ]; then
    tail -n 50 "$APP_DIR/app.log"
  else
    echo "Aucun log disponible."
  fi
}

while true; do
  menu
  case $CHOICE in
    1) start_app; read -p "Appuyez sur Entrée pour continuer...";;
    2) stop_app; read -p "Appuyez sur Entrée pour continuer...";;
    3) restart_app; read -p "Appuyez sur Entrée pour continuer...";;
    4) status_app; read -p "Appuyez sur Entrée pour continuer...";;
    5) logs_app; read -p "Appuyez sur Entrée pour continuer...";;
    6) echo "Sortie."; exit 0;;
    *) echo "Option invalide."; sleep 1;;
  esac

done
