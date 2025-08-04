# 🌐 Guide auto-hébergement avancé (pour aller plus loin)

Ce guide explique comment héberger Liberchat sur un vrai serveur, avec HTTPS, Tor, ou un domaine personnalisé. Idéal si tu veux partager ton chat avec d’autres, même à distance !

---

## 1️⃣ Préparer le serveur
- Prends un serveur Linux (VPS, Raspberry Pi, vieux PC…)
- Assure-toi d’avoir les droits administrateur (sudo)
- Le serveur doit être accessible depuis Internet si tu veux un vrai domaine

## 2️⃣ Lancer le script d’auto-hébergement
- Place-toi dans le dossier Liberchat
- Tape :
```bash
sudo ./auto_hebergement.sh
```

## 3️⃣ Suivre le menu interactif
- Choisis :
  - 1️⃣ Domaine personnalisé (HTTPS)
  - 2️⃣ Sous-domaine (HTTPS)
  - 3️⃣ Service onion (Tor)
  - 4️⃣ Service onion personnalisé (Tor)
- Renseigne le port (par défaut 3000)
- Indique ton domaine ou sous-domaine si besoin
- Le script configure tout (Nginx, Apache, Tor, certificats SSL…)

## 4️⃣ Accéder à ton chat
- Pour HTTPS : va sur https://ton-domaine.fr
- Pour Tor : va sur l’adresse .onion affichée par le script (avec Tor Browser)

## 5️⃣ Astuces et dépannage
- Si le certificat SSL échoue, vérifie que le port 80 est ouvert et que le domaine pointe bien vers ton serveur
- Pour Tor, vérifie que le service tourne :
```bash
sudo systemctl status tor
```
- Pour relancer l’appli :
```bash
sudo ./auto_gestion.sh
```

---

## 💡 Conseils avancés
- Tu peux ajouter plusieurs domaines dans le fichier `.env` (variable ALLOWED_DOMAINS)
- Pour une installation graphique (GUI), voir le dossier `gui_manager/`
- Pour tout problème, consulte la FAQ ou la documentation détaillée

---

🎉 **Ton Liberchat est maintenant accessible partout !**
