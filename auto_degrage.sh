#!/bin/bash
# Script de désinstallation/dégrage automatique de Liberchat (robuste)
# Usage : sudo ./auto_degrage.sh

set -e

if [ "$EUID" -ne 0 ]; then
  echo "Veuillez exécuter ce script en tant que root (sudo)."
  exit 1
fi

echo "--- Désinstallation automatique de Liberchat ---"

# Arrêt de l'application Liberchat si elle tourne
if [ -f app.pid ]; then
  APP_PID=$(cat app.pid)
  if ps -p $APP_PID > /dev/null 2>&1; then
    echo "Arrêt de l'application Liberchat (PID $APP_PID)..."
    kill $APP_PID || true
    rm -f app.pid
  fi
fi
pkill -f "node server.js" 2>/dev/null || true

# Suppression des fichiers de conf Nginx liés à Liberchat
if [ -d /etc/nginx/sites-available ]; then
  echo "Suppression des configurations Nginx Liberchat..."
  for f in /etc/nginx/sites-available/*liberchat* /etc/nginx/sites-available/*localhost*; do
    [ -e "$f" ] && rm -f "$f"
  done
  for f in /etc/nginx/sites-enabled/*liberchat* /etc/nginx/sites-enabled/*localhost*; do
    [ -e "$f" ] && rm -f "$f"
  done
  read -p "Supprimer Nginx ? [o/N] : " DELNGINX
  if [[ "$DELNGINX" =~ ^[oO]$ ]]; then
    apt remove --purge -y nginx
  fi
fi

# Suppression des fichiers de conf Apache liés à Liberchat
if [ -d /etc/apache2/sites-available ]; then
  echo "Suppression des configurations Apache Liberchat..."
  for f in /etc/apache2/sites-available/*liberchat*.conf /etc/apache2/sites-available/*localhost*.conf; do
    [ -e "$f" ] && rm -f "$f"
  done
  a2dissite *liberchat*.conf 2>/dev/null || true
  a2dissite localhost.conf 2>/dev/null || true
  read -p "Supprimer Apache ? [o/N] : " DELAPACHE
  if [[ "$DELAPACHE" =~ ^[oO]$ ]]; then
    apt remove --purge -y apache2
  fi
fi

# Suppression du service onion Tor
if [ -d /var/lib/tor/hidden_service ]; then
  echo "Suppression du service onion Tor..."
  rm -rf /var/lib/tor/hidden_service
  grep -v HiddenServiceDir /etc/tor/torrc > /etc/tor/torrc.tmp && mv /etc/tor/torrc.tmp /etc/tor/torrc
  systemctl restart tor || true
  read -p "Supprimer Tor ? [o/N] : " DELTOR
  if [[ "$DELTOR" =~ ^[oO]$ ]]; then
    apt remove --purge -y tor
  fi
fi

# Suppression Certbot
read -p "Supprimer Certbot ? [o/N] : " DELCERT
if [[ "$DELCERT" =~ ^[oO]$ ]]; then
  apt remove --purge -y certbot python3-certbot-nginx python3-certbot-apache
fi

# Suppression Node.js/npm (optionnel)
read -p "Supprimer Node.js et npm ? [o/N] : " DELNODE
if [[ "$DELNODE" =~ ^[oO]$ ]]; then
  apt remove --purge -y nodejs npm
fi

# Suppression des fichiers/dossiers de l'application (optionnel)
read -p "Supprimer les fichiers de l'application Liberchat (.env, prod.log, app.pid, build, node_modules) ? [o/N] : " DELFILES
if [[ "$DELFILES" =~ ^[oO]$ ]]; then
  rm -f .env prod.log app.pid
  rm -rf build node_modules dist
  echo "Fichiers/dossiers Liberchat supprimés."
fi

echo "Nettoyage terminé. Pensez à supprimer manuellement les éventuels fichiers restants si besoin."
