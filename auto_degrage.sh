#!/bin/bash
# Script de désinstallation/dégrage automatique de Liberchat
# Usage : sudo ./auto_degrage.sh

set -e

if [ "$EUID" -ne 0 ]; then
  echo "Veuillez exécuter ce script en tant que root (sudo)."
  exit 1
fi

echo "--- Désinstallation automatique de Liberchat ---"

# Suppression Nginx
if [ -d /etc/nginx/sites-available ]; then
  echo "Suppression des configurations Nginx..."
  rm -f /etc/nginx/sites-available/localhost
  rm -f /etc/nginx/sites-enabled/localhost
  read -p "Supprimer Nginx ? [o/N] : " DELNGINX
  if [[ "$DELNGINX" =~ ^[oO]$ ]]; then
    apt remove --purge -y nginx
  fi
fi

# Suppression Apache
if [ -d /etc/apache2/sites-available ]; then
  echo "Suppression des configurations Apache..."
  rm -f /etc/apache2/sites-available/localhost.conf
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
  systemctl restart tor
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

echo "Nettoyage terminé. Pensez à supprimer manuellement les éventuels fichiers restants si besoin."
