# Bot Discord - Gestion de Serveur

Ce bot Discord inclut une commande pour supprimer un serveur avec des mesures de sécurité.

## Installation

1. Installez les dépendances :
```bash
npm install
```

2. Configurez le fichier `.env` avec votre token Discord :
- Renommez `.env.example` en `.env`
- Remplacez `votre_token_ici` par le token de votre bot

## Utilisation

La commande principale est `/antiraid`. Cette commande :
- Ne peut être utilisée que par le propriétaire du serveur
- Demande une confirmation explicite
- A un délai de 5 secondes avant l'exécution

## Sécurité

⚠️ ATTENTION : Cette commande est très dangereuse car elle peut supprimer un serveur entier. Utilisez-la avec précaution.
