# ⚙️ Script de gestion de l’application Liberchat

Ce script permet de gérer facilement l’application Liberchat :
- Démarrer, arrêter, redémarrer l’application
- Afficher le statut
- Voir les logs récents
- Fonctionne avec systemd (service) ou en mode process simple

## Utilisation

1. Rendez le script exécutable :
   ```bash
   chmod +x auto_gestion.sh
   ```
2. Lancez-le en root :
   ```bash
   sudo ./auto_gestion.sh
   ```
3. Utilisez le menu interactif pour gérer l’application.

## Notes
- Si un service systemd `liberchat.service` existe, il sera utilisé automatiquement.
- Sinon, l’application sera lancée en arrière-plan via Node.js.
- Les logs sont accessibles via le menu.

---

Pour toute question, contactez l’équipe Liberchat.
