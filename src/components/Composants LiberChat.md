# Composants LiberChat

## ChatInput

Le composant ChatInput permet aux utilisateurs d'envoyer des messages texte, des emojis et des GIFs.

### Fonctionnalités

#### Emojis
- Cliquez sur le bouton 😀 pour ouvrir le sélecteur d'emojis
- Choisissez un emoji pour l'insérer dans votre message
- Le sélecteur d'emojis se ferme automatiquement après la sélection

#### GIFs
- Cliquez sur le bouton "GIF" pour ouvrir le sélecteur de GIFs
- Tapez votre recherche dans la barre de recherche
- Les GIFs se chargent automatiquement pendant la saisie
- Faites défiler pour charger plus de GIFs
- Cliquez sur un GIF pour l'envoyer dans le chat
- Les GIFs sont mis en cache pendant 5 minutes pour optimiser les performances

### Performances

Le composant intègre plusieurs optimisations :
- Mise en cache des recherches GIF
- Chargement progressif des images
- Debounce sur la recherche de GIFs
- Nettoyage automatique du cache
- Limite de 12 GIFs par page pour éviter la surcharge
