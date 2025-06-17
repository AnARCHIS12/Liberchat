# 🗑️ Script de désinstallation automatique Liberchat

Ce script permet de supprimer facilement toutes les configurations générées par le script d’auto-hébergement :
- Suppression des fichiers de configuration Nginx/Apache
- Suppression du service onion Tor
- Option pour désinstaller Nginx, Apache, Tor, Certbot

## Utilisation

1. Rendez le script exécutable :
   ```bash
   chmod +x auto_degrage.sh
   ```
2. Lancez-le en root :
   ```bash
   sudo ./auto_degrage.sh
   ```
3. Suivez les instructions pour supprimer les services et configurations souhaités.

## Sécurité
- Les suppressions sont irréversibles.
- Vérifiez que vous ne supprimez pas d’autres services importants sur votre serveur.

---

Pour toute question, contactez l’équipe Liberchat.
