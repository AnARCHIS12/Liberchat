# Compiler Liberchat pour macOS

Ce guide explique comment compiler Liberchat pour macOS et créer un fichier DMG d'installation.

## Prérequis

- Un ordinateur Mac avec macOS
- Node.js installé
- Xcode Command Line Tools installé

## Structure des dossiers

```
macos/
├── build/
│   ├── entitlements.mac.plist
│   ├── icon.icns (à ajouter)
│   └── background.png (à ajouter)
├── package.json
├── build.sh
└── README.md
```

## Instructions de compilation

1. Copier le dossier `macos` sur votre Mac
2. Ouvrir le Terminal
3. Naviguer vers le dossier :
   ```bash
   cd chemin/vers/macos
   ```
4. Rendre le script exécutable et le lancer :
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

## Résultats

Après la compilation, vous trouverez dans le dossier `dist/` :
- Un fichier `.dmg` pour l'installation par glisser-déposer
- Un fichier `.zip` contenant l'application

## Notes importantes

- Assurez-vous d'avoir une icône au format `.icns` dans `build/icon.icns`
- Ajoutez une image de fond pour le DMG dans `build/background.png`
- La compilation peut prendre plusieurs minutes
- Un certificat de développeur Apple peut être nécessaire pour la distribution

## Fonctionnalités incluses

- Support du mode sombre macOS
- Installation facile par glisser-déposer
- Sécurité renforcée avec hardened runtime
- Compilation universelle (Intel et Apple Silicon)

## Support

Pour toute question ou problème, contactez-nous :
- Email : contact@unionlibertaireanarchiste.org
- GitHub : https://github.com/UnionLibertaire/Liberchat
