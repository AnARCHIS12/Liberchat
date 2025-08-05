# 🖥️ Script de compilation GUI Liberchat

Ce script (`build_gui.sh`) permet de compiler l’interface graphique Electron de Liberchat en différents formats :
- **AppImage** (Linux)
- **.deb** (Debian/Ubuntu)
- **.exe installateur** (Windows)

## Utilisation

1. Rendez le script exécutable :
   ```bash
   chmod +x build_gui.sh
   ```
2. Lancez-le depuis la racine du projet :
   ```bash
   ./build_gui.sh
   ```
3. Les fichiers générés se trouvent dans `gui_manager/dist/`

## Prérequis
- Node.js et npm installés
- Le dossier `gui_manager/` doit exister avec le projet Electron
- Pour générer un .exe Windows, il est recommandé d’utiliser une machine ou VM Windows, ou d’installer Wine sur Linux

---

Pour toute question, contactez l’équipe Liberchat.
