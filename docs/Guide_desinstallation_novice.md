# 🗑️ Guide ultra-simple : désinstaller Liberchat

Tu veux tout supprimer proprement ? Voici comment faire, même si tu es débutant·e !

---

## 1️⃣ Ouvre le terminal dans le dossier Liberchat
- 📂 Va dans le dossier où tu as installé Liberchat
- Clique droit > "Ouvrir dans un terminal"

## 2️⃣ Lance le script de désinstallation automatique
- Tape simplement :
```bash
sudo ./auto_degrage.sh
```
- Suis les instructions (le script te demandera si tu veux supprimer Nginx, Apache, Tor, etc.)

## 3️⃣ Supprime le dossier Liberchat (optionnel)
- Si tu veux tout effacer, tape :
```bash
cd ..
rm -rf Liberchat-Liberchat-6.1.11
```

---

## 💡 Astuces
- Si tu rencontres un message d’erreur, relance la commande ou vérifie que tu es bien en mode administrateur (sudo).
- Les scripts ne suppriment pas tes fichiers personnels, seulement l’application et ses services.

---

🧹 **Ton ordinateur est propre, tout est désinstallé !**
