#!/bin/bash
# Script d'auto-hébergement semi-automatisé robuste pour Liberchat
# Usage : sudo ./auto_hebergement.sh

set -e

# Vérification des droits root
if [ "$EUID" -ne 0 ]; then
  echo "Veuillez exécuter ce script en tant que root (sudo)."
  exit 1
fi

default_port=3000
admin_mail="admin@localhost"

# Détection automatique du port de l'application (propose le prochain port libre)
find_free_port() {
  local port=$1
  while lsof -i:$port &>/dev/null; do
    port=$((port+1))
  done
  echo $port
}
app_port=$(find_free_port 3000)
read -p "Port de l'application à proxyfier [défaut: $app_port] : " user_port2
app_port=${user_port2:-$app_port}

# Installation et build de l’application Node.js
if [ -f package.json ]; then
  echo "[Auto] Installation des dépendances Node.js..."
  npm install || { echo "Échec de npm install"; exit 1; }
  if grep -q '"build"' package.json; then
    echo "[Auto] Build de l’application..."
    npm run build || { echo "Échec de npm run build"; exit 1; }
  fi
else
  echo "Aucun package.json trouvé, installation Node.js ignorée."
fi

# Fonctions d'installation
install_nginx() {
  apt update && apt install -y nginx
}

install_apache() {
  apt update && apt install -y apache2
}

install_certbot_nginx() {
  apt install -y certbot python3-certbot-nginx
}

install_certbot_apache() {
  apt install -y certbot python3-certbot-apache
}

install_tor() {
  apt install -y tor
}

# Configuration HTTPS Nginx
auto_https_nginx() {
  DOMAIN=$1
  echo "[Auto] Configuration Nginx pour $DOMAIN..."
  cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://localhost:$app_port;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
  ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  echo "[Auto] Obtention du certificat SSL..."
  certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $admin_mail || true
}

# Configuration HTTPS Apache
auto_https_apache() {
  DOMAIN=$1
  echo "[Auto] Configuration Apache pour $DOMAIN..."
  cat > /etc/apache2/sites-available/$DOMAIN.conf <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ProxyPreserveHost On
    ProxyPass / http://localhost:$app_port/
    ProxyPassReverse / http://localhost:$app_port/
</VirtualHost>
EOF
  a2ensite $DOMAIN.conf
  a2enmod proxy proxy_http ssl
  systemctl reload apache2
  echo "[Auto] Obtention du certificat SSL..."
  certbot --apache -d $DOMAIN --non-interactive --agree-tos -m $admin_mail || true
}

# Configuration Tor
auto_tor() {
  install_tor
  grep -q HiddenServiceDir /etc/tor/torrc || cat >> /etc/tor/torrc <<EOF
HiddenServiceDir /var/lib/tor/hidden_service/
HiddenServicePort 80 127.0.0.1:$app_port
EOF
  systemctl restart tor
  sleep 3
  ONION_ADDR=$(cat /var/lib/tor/hidden_service/hostname 2>/dev/null || echo "Non généré")
  echo "[Auto] Votre service onion est disponible à : $ONION_ADDR"
}

# Configuration Tor avec préfixe personnalisé
custom_tor() {
  read -p "Préfixe souhaité pour l'adresse .onion (ex: Liberchat) : " ONION_PREFIX
  if [ -z "$ONION_PREFIX" ]; then
    echo "Préfixe vide, génération standard."
    auto_tor
    return
  fi
  echo "Installation de mkp224o (générateur d'adresse .onion personnalisée)..."
  if ! command -v mkp224o &>/dev/null; then
    apt update && apt install -y git build-essential
    git clone https://github.com/cathugger/mkp224o.git /tmp/mkp224o
    cd /tmp/mkp224o && make
    export PATH=$PATH:/tmp/mkp224o
  fi
  mkdir -p /var/lib/tor/vanity_keys
  echo "Génération de la clé, cela peut prendre plusieurs minutes/heures selon le préfixe..."
  /tmp/mkp224o/mkp224o -d /var/lib/tor/vanity_keys "$ONION_PREFIX" | tee /tmp/vanity.log
  VANITY_PRIV=$(find /var/lib/tor/vanity_keys -name "hs_ed25519_secret_key" | head -n1)
  if [ -z "$VANITY_PRIV" ]; then
    echo "Erreur lors de la génération de la clé."
    exit 1
  fi
  # Suppression de l'ancien service pour éviter les conflits
  systemctl stop tor
  rm -rf /var/lib/tor/hidden_service/
  mkdir -p /var/lib/tor/hidden_service/
  cp "$VANITY_PRIV" /var/lib/tor/hidden_service/hs_ed25519_secret_key
  PUB=$(dirname "$VANITY_PRIV")/hs_ed25519_public_key
  cp "$PUB" /var/lib/tor/hidden_service/hs_ed25519_public_key
  chown -R debian-tor:debian-tor /var/lib/tor/hidden_service/
  chmod 700 /var/lib/tor/hidden_service/
  grep -q HiddenServiceDir /etc/tor/torrc || cat >> /etc/tor/torrc <<EOF
HiddenServiceDir /var/lib/tor/hidden_service/
HiddenServicePort 80 127.0.0.1:$app_port
EOF
  systemctl restart tor
  # Attente active de la génération du fichier hostname (max 30s)
  for i in {1..30}; do
    if [ -f /var/lib/tor/hidden_service/hostname ]; then
      break
    fi
    sleep 1
  done
  if [ ! -f /var/lib/tor/hidden_service/hostname ]; then
    echo -e "${RED}Erreur : le fichier hostname .onion n'a pas été généré après 30s.${NC}"
    echo -e "${YELLOW}Guide de dépannage :${NC}"
    echo -e "1. Vérifiez que Tor fonctionne : sudo systemctl status tor@default || sudo systemctl status tor"
    echo -e "2. Vérifiez la config : sudo cat /etc/tor/torrc (doit contenir HiddenServiceDir et HiddenServicePort)"
    echo -e "3. Réparez Tor si besoin : sudo apt-get purge --auto-remove tor && sudo apt-get install tor"
    echo -e "4. Consultez les logs : sudo journalctl -u tor@default -n 50 --no-pager || sudo journalctl -u tor -n 50 --no-pager"
    echo -e "5. Relancez ce script après correction."
    exit 1
  fi
  ONION_ADDR=$(cat /var/lib/tor/hidden_service/hostname 2>/dev/null || echo "Non généré")
  echo "Votre service onion personnalisé est disponible à : $ONION_ADDR"
}

# Fonction pour ajouter un domaine à la variable ALLOWED_DOMAINS dans .env (concaténation propre)
add_domain_to_env() {
  local domain="$1"
  local env_file=".env"
  # Ajoute http:// ou https:// si absent
  if [[ ! "$domain" =~ ^http ]]; then
    if [[ "$domain" =~ \.onion$ ]]; then
      domain="http://$domain"
    else
      domain="https://$domain"
    fi
  fi
  if [ ! -f "$env_file" ]; then
    echo "ALLOWED_DOMAINS=$domain" > "$env_file"
    echo "[Auto] Fichier .env créé avec $domain."
  else
    if grep -q '^ALLOWED_DOMAINS=' "$env_file"; then
      # Ajoute le domaine s'il n'est pas déjà présent
      if ! grep -q "$domain" "$env_file"; then
        # Ajout propre (pas de virgule en trop)
        current=$(grep '^ALLOWED_DOMAINS=' "$env_file" | cut -d'=' -f2)
        if [ -z "$current" ]; then
          sed -i "s|^ALLOWED_DOMAINS=.*|ALLOWED_DOMAINS=$domain|" "$env_file"
        else
          sed -i "s|^ALLOWED_DOMAINS=.*|ALLOWED_DOMAINS=$current,$domain|" "$env_file"
        fi
        echo "[Auto] Domaine $domain ajouté à ALLOWED_DOMAINS."
      fi
    else
      echo "ALLOWED_DOMAINS=$domain" >> "$env_file"
      echo "[Auto] Variable ALLOWED_DOMAINS ajoutée à .env."
    fi
  fi
}

# Vérification et réparation automatique de Tor
check_and_repair_tor() {
  echo -e "${YELLOW}Vérification du service Tor...${NC}"
  # Vérifie si tor@default existe (cas Debian/Ubuntu modernes)
  if systemctl list-units --full -all | grep -q 'tor@default.service'; then
    if ! systemctl is-active --quiet tor@default; then
      echo -e "${RED}Le service tor@default n'est pas actif. Tentative de réparation...${NC}"
      sudo apt-get install --reinstall -y tor
      sudo systemctl restart tor@default
      sleep 3
      if ! systemctl is-active --quiet tor@default; then
        echo -e "${RED}Échec du démarrage de tor@default. Veuillez vérifier manuellement avec 'sudo journalctl -u tor@default -n 50 --no-pager'.${NC}"
        exit 1
      else
        echo -e "${GREEN}Service tor@default réparé et démarré avec succès.${NC}"
      fi
    else
      echo -e "${GREEN}Service tor@default actif.${NC}"
    fi
  else
    # Fallback : vérifie tor.service classique
    if ! systemctl is-active --quiet tor; then
      echo -e "${RED}Le service Tor n'est pas actif. Tentative de réparation...${NC}"
      sudo apt-get install --reinstall -y tor
      sudo systemctl restart tor
      sleep 3
      if ! systemctl is-active --quiet tor; then
        echo -e "${RED}Échec du démarrage de Tor. Votre installation systemd est probablement cassée (ExecStart=/bin/true).${NC}"
        echo -e "${RED}Corrigez manuellement avec : sudo apt-get purge --auto-remove tor && sudo apt-get install tor${NC}"
        exit 1
      else
        echo -e "${GREEN}Service Tor réparé et démarré avec succès.${NC}"
      fi
    else
      echo -e "${GREEN}Service Tor actif.${NC}"
    fi
  fi
}

# Correction définitive Tor : configuration stricte et service explicite
force_tor_service() {
  # Vérifie et installe tor@default si besoin
  if ! systemctl list-units --full -all | grep -q 'tor@default.service'; then
    echo -e "${YELLOW}Installation du vrai service Tor (tor@default)...${NC}"
    sudo apt-get purge --auto-remove -y tor
    sudo apt-get install -y tor
    sudo systemctl enable tor@default
  fi
  # Ajout/correction stricte de la config HiddenService
  sudo sed -i '/HiddenServiceDir \/var\/lib\/tor\/hidden_service\//d' /etc/tor/torrc
  sudo sed -i '/HiddenServicePort 80 127.0.0.1:/d' /etc/tor/torrc
  echo "HiddenServiceDir /var/lib/tor/hidden_service/" | sudo tee -a /etc/tor/torrc
  echo "HiddenServicePort 80 127.0.0.1:$app_port" | sudo tee -a /etc/tor/torrc
  # Supprime et recrée le dossier avec les bonnes permissions
  sudo systemctl stop tor@default
  sudo rm -rf /var/lib/tor/hidden_service/
  sudo mkdir -p /var/lib/tor/hidden_service/
  sudo chown -R debian-tor:debian-tor /var/lib/tor/hidden_service/
  sudo chmod 700 /var/lib/tor/hidden_service/
  sudo systemctl start tor@default
}

# Couleurs et style
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
BOLD='\033[1m'
NC='\033[0m'

banner() {
  echo -e "${RED}${BOLD}✊ LIBERCHAT — La Commune Numérique ✊${NC}"
  echo -e "${CYAN}Pour l'autogestion, la solidarité et la liberté numérique !${NC}"
  echo -e "${YELLOW}Aucun chef, pas de patron, juste du code libre et du chaos organisé.${NC}\n"
}

banner

# Menu principal (robuste)
while true; do
  clear
  banner
  echo -e "${RED}${BOLD}Menu d'auto-hébergement anarchiste :${NC}"
  echo -e "${GREEN}1) Héberger sur un domaine personnalisé (HTTPS)${NC}"
  echo -e "${GREEN}2) Héberger sur un sous-domaine (HTTPS)${NC}"
  echo -e "${YELLOW}3) Héberger en service onion (Tor)${NC}"
  echo -e "${YELLOW}4) Héberger en service onion (Tor) avec préfixe personnalisé${NC}"
  echo -e "${CYAN}5) Héberger en local (192.168.x.x ou 127.0.0.1)${NC}"
  echo -e "${RED}6) Quitter${NC}"
  read -p "${BOLD}Choisissez une option [1-6] : ${NC}" CHOICE

  case "$CHOICE" in
    1|2)
      read -p "Entrez votre (sous-)domaine (ex: monsite.fr ou sub.monsite.fr) : " DOMAIN
      add_domain_to_env "$DOMAIN"
      echo "Choix du serveur web :"
      echo "1) Nginx (recommandé)"
      echo "2) Apache"
      read -p "Votre choix [1-2, défaut: 1] : " WEBCHOICE
      WEBCHOICE=${WEBCHOICE:-1}
      if [ "$WEBCHOICE" == "1" ]; then
        install_nginx
        install_certbot_nginx
        auto_https_nginx "$DOMAIN"
      elif [ "$WEBCHOICE" == "2" ]; then
        install_apache
        install_certbot_apache
        auto_https_apache "$DOMAIN"
      else
        echo "Option serveur web invalide."
        continue
      fi
      ;;
    3)
      force_tor_service
      check_and_repair_tor
      auto_tor
      ONION_ADDR=$(cat /var/lib/tor/hidden_service/hostname 2>/dev/null || echo "")
      if [ -n "$ONION_ADDR" ]; then
        add_domain_to_env "$ONION_ADDR"
        echo -e "\n\033[1;32mVotre adresse Liberchat .onion (union) :\033[0m $ONION_ADDR"
        echo -e "\033[1;33mOuvrez cette adresse dans Tor Browser pour accéder à votre chat en union !\033[0m\n"
      fi
      ;;
    4)
      force_tor_service
      check_and_repair_tor
      custom_tor
      ONION_ADDR=$(cat /var/lib/tor/hidden_service/hostname 2>/dev/null || echo "")
      if [ -n "$ONION_ADDR" ]; then
        add_domain_to_env "$ONION_ADDR"
        echo -e "\n\033[1;32mVotre adresse Liberchat .onion personnalisée (union) :\033[0m $ONION_ADDR"
        echo -e "\033[1;33mOuvrez cette adresse dans Tor Browser pour accéder à votre chat en union !\033[0m\n"
      fi
      ;;
    5)
      echo "Configuration pour un accès local (LAN ou localhost) en cours..."
      LOCAL_IP=$(hostname -I | awk '{print $1}')
      echo -e "\n\033[1;32mVotre adresse locale :\033[0m http://$LOCAL_IP:$app_port"
      echo -e "\033[1;33mOuvrez cette adresse sur vos appareils du réseau local.\033[0m\n"
      add_domain_to_env "http://$LOCAL_IP:$app_port"
      add_domain_to_env "http://127.0.0.1:$app_port"
      add_domain_to_env "http://localhost:$app_port"
      ;;
    6)
      echo "Abandon."
      exit 0
      ;;
    *)
      echo "Option invalide. Veuillez choisir entre 1 et 6."
      sleep 2
      ;;
  esac
  echo -e "${GREEN}Configuration terminée ! Vive la Commune numérique !${NC}"
  read -p "Voulez-vous lancer automatiquement l'application en mode production ? (npm run build + npm start) [O/n] : " AUTOLAUNCH
  # Lancement automatique : build seulement si le dossier build/dist n'existe pas
  if [[ "$AUTOLAUNCH" =~ ^[oO]$ || -z "$AUTOLAUNCH" ]]; then
    if ! pgrep -f "node server.js" >/dev/null; then
      if [ ! -d build ] && [ ! -d dist ]; then
        echo "Build du frontend (npm run build)..."
        npm run build || { echo "Échec du build frontend."; exit 1; }
      else
        echo "Le build frontend existe déjà, saut du build."
      fi
      echo "Lancement du backend (npm start)..."
      nohup npm start > prod.log 2>&1 &
      echo $! > app.pid
      echo "Application Liberchat (production) démarrée en arrière-plan (PID $(cat app.pid))."
      echo "Consultez prod.log pour les logs."
    else
      echo "L'application tourne déjà."
    fi
  fi
  read -p "Appuyez sur Entrée pour revenir au menu principal..."
done
