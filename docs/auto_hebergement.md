# 🚀 Documentation : Script d’auto-hébergement Liberchat

> Un outil simple pour héberger votre application avec HTTPS ou Tor, en quelques minutes !

---

## 🛠️ Prérequis
- **Serveur Linux** (Debian/Ubuntu recommandé)
- **Accès root** (`sudo`)
- **Application** écoutant sur un port local (par défaut : `3000`)
- **Pour HTTPS** : le domaine doit pointer vers l’IP du serveur

---

## ▶️ Utilisation rapide
1. **Rendez le script exécutable** :
   ```bash
   chmod +x auto_hebergement.sh
   ```
2. **Lancez le script en root** :
   ```bash
   sudo ./auto_hebergement.sh
   ```
3. **Suivez le menu interactif** :
   - Choisissez l’option d’hébergement :
     - 🌐 Domaine personnalisé (HTTPS)
     - 🏷️ Sous-domaine (HTTPS)
     - 🧅 Service onion (Tor)
     - 🧅✨ Service onion avec préfixe personnalisé
   - Entrez le port de votre application si différent de 3000
   - Pour HTTPS, indiquez le domaine/sous-domaine et le serveur web (Nginx ou Apache)
   - Pour Tor personnalisé, indiquez le préfixe souhaité (ex : `Liberchat`)

---

## ✨ Fonctionnalités
- **HTTPS automatique** : installation, configuration, certificat SSL Let’s Encrypt
- **Proxy inverse** : redirige le trafic vers votre application locale
- **Service onion Tor** : configuration automatique, adresse générée ou personnalisée
- **Adresse .onion personnalisée** : via mkp224o (peut être long selon le préfixe)

---

## ℹ️ Notes importantes
- Pour HTTPS, le domaine doit être déjà configuré côté DNS
- Pour Tor personnalisé, la génération d’un préfixe long peut prendre beaucoup de temps
- Les fichiers de configuration sont générés automatiquement et les services sont relancés

---

## 🔒 Sécurité
- Les clés privées .onion sont stockées dans `/var/lib/tor/hidden_service/`
- Les permissions sont ajustées automatiquement

---

## 🆘 Dépannage
- **Certificat SSL échoué** : vérifiez que le port 80 est ouvert et que le domaine pointe bien vers le serveur
- **Tor** : vérifiez que le service est bien actif :
  ```bash
  systemctl status tor
  ```

---

## 🗑️ Désinstallation
- Supprimez les fichiers de configuration dans `/etc/nginx/sites-available/`, `/etc/apache2/sites-available/` et `/var/lib/tor/hidden_service/` selon l’option utilisée
- [🗑️ Script de désinstallation automatique](auto_degrage.md)

---

Pour toute question ou suggestion, contactez l’équipe **Liberchat**.
