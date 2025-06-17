# 📥 Guide d'installation

## 📱 Installation sur Android

1. Téléchargez la dernière version de l'APK depuis [la page des releases](https://github.com/AnARCHIS12/Liberchat-3.0/releases/latest)
2. Sur votre appareil Android, autorisez l'installation d'applications depuis des sources inconnues
3. Ouvrez le fichier APK téléchargé
4. Suivez les instructions d'installation

## 💻 Installation pour le développement

### Prérequis
- Node.js
- npm ou yarn
- Git

### Étapes

1. Clonez le repository :
```bash
git clone https://github.com/AnARCHIS12/Liberchat-3.0.git
cd Liberchat-3.0
```

2-3. Installez les dépendances :
```bash
npm install
```


4. Lancez le serveur de développement :
```bash
npm run dev
```

5. Ouvrez votre navigateur à l'adresse : `http://localhost:5173`

## 🌐 Déploiement sur Render

1. Dans votre tableau de bord Render :
   - Créez un nouveau Web Service
   - Liez votre repository GitHub
   - Dans l'onglet "Environment", ajoutez la variable :
     - `VITE_GIPHY_API_KEY`: Votre clé API Giphy

2. Configurez le build :
   - Build Command : `npm install && npm run build`
   - Start Command : `npm run start`

## ⚠️ Résolution des problèmes courants

### L'APK ne s'installe pas
- Vérifiez que vous avez autorisé l'installation depuis des sources inconnues
- Vérifiez que vous avez assez d'espace de stockage
- Essayez de redémarrer votre appareil

### Le serveur de développement ne démarre pas
- Vérifiez que Node.js est bien installé : `node --version`
- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez qu'aucun autre service n'utilise le port 5173

### Les GIFs ne s'affichent pas
- Vérifiez que votre clé API Giphy est correctement configurée dans `.env`
- Vérifiez que le fichier `.env` est bien à la racine du projet
- Sur Render, vérifiez que la variable d'environnement est bien configurée
- Vérifiez la console du navigateur pour les erreurs éventuelles
