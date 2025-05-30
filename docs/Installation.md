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

2. Installez les dépendances :
```bash
npm install
```

3. Lancez le serveur de développement :
```bash
npm run dev
```

4. Ouvrez votre navigateur à l'adresse : `http://localhost:5173`

## ⚠️ Résolution des problèmes courants

### L'APK ne s'installe pas
- Vérifiez que vous avez autorisé l'installation depuis des sources inconnues
- Vérifiez que vous avez assez d'espace de stockage
- Essayez de redémarrer votre appareil

### Le serveur de développement ne démarre pas
- Vérifiez que Node.js est bien installé : `node --version`
- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez qu'aucun autre service n'utilise le port 5173
