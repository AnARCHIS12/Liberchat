# ♿ Guide d'Accessibilité - LiberChat

> « L'accessibilité numérique est un droit fondamental. Aucun camarade ne doit être exclu de la communication libre ! »

## 🎯 Fonctionnalités d'Accessibilité

LiberChat intègre un **mode accessibilité complet** pour garantir l'inclusion de toutes les personnes en situation de handicap.

### 🔧 Accès aux Paramètres

- **Raccourci clavier** : `Alt + A`
- **Bouton dans l'en-tête** : Icône ♿ "Accessibilité"
- **Sauvegarde automatique** : Tous les paramètres sont conservés localement

## 🎨 Options Disponibles

### 1. 🔆 Contraste Élevé
- **Pour qui** : Personnes malvoyantes, déficience visuelle
- **Effet** : Couleurs noir/blanc/jaune à fort contraste
- **Activation** : Bouton bascule dans les paramètres

### 2. 📏 Taille de Police Ajustable
- **Options** : Petit, Normal, Grand, Très grand
- **Pour qui** : Personnes avec troubles visuels, presbytie
- **Effet** : Modifie la taille de tous les textes de l'interface

### 3. 📖 Police Dyslexie
- **Police** : Comic Sans MS / Trebuchet MS (polices adaptées)
- **Pour qui** : Personnes dyslexiques
- **Effet** : Améliore la lisibilité et réduit les confusions de lettres

### 4. 🎭 Réduction des Animations
- **Pour qui** : Personnes sensibles au mouvement, épilepsie photosensible
- **Effet** : Supprime toutes les animations et transitions
- **Respect** : Suit les préférences système `prefers-reduced-motion`

### 5. 🔊 Mode Lecteur d'Écran
- **Pour qui** : Personnes aveugles ou malvoyantes
- **Fonctionnalités** :
  - Annonces vocales des nouveaux messages
  - Descriptions ARIA complètes
  - Focus visible renforcé
  - Étiquettes contextuelles

### 6. ⌨️ Navigation Clavier Améliorée
- **Pour qui** : Personnes avec mobilité réduite
- **Fonctionnalités** :
  - Focus visible sur tous les éléments
  - Raccourcis clavier globaux
  - Navigation séquentielle optimisée
  - Indicateurs visuels d'état

## ⌨️ Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Alt + A` | Ouvrir les paramètres d'accessibilité |
| `Alt + T` | Basculer thème clair/sombre |
| `Alt + Q` | Se déconnecter |
| `Échap` | Fermer les modales |
| `Entrée` | Activer les boutons/liens |
| `Espace` | Activer les boutons |
| `Tab` | Navigation séquentielle |
| `Shift + F10` | Menu contextuel |

## 🎯 Navigation au Clavier

### Dans le Chat
- **Tab** : Naviguer entre les messages
- **Entrée** : Ouvrir les images en grand
- **Menu contextuel** : `Shift + F10` ou clic droit
- **Réactions** : Naviguer avec Tab, activer avec Entrée

### Dans les Formulaires
- **Tab** : Champ suivant
- **Shift + Tab** : Champ précédent
- **Entrée** : Valider le formulaire
- **Échap** : Annuler l'édition

## 🔊 Support des Lecteurs d'Écran

### Lecteurs Testés
- **NVDA** (Windows) ✅
- **JAWS** (Windows) ✅
- **VoiceOver** (macOS/iOS) ✅
- **TalkBack** (Android) ✅
- **Orca** (Linux) ✅

### Annonces Automatiques
- Nouveaux messages reçus
- Utilisateurs qui rejoignent/quittent
- Changements d'état de l'interface
- Messages d'erreur et confirmations

## 🎨 Personnalisation Visuelle

### Thèmes Disponibles
1. **Thème Sombre** (par défaut)
2. **Thème Clair**
3. **Mode Contraste Élevé** (noir/blanc/jaune)

### Adaptations Automatiques
- Respect des préférences système
- Adaptation aux conditions d'éclairage
- Optimisation pour les écrans e-ink

## 📱 Accessibilité Mobile

### Fonctionnalités Tactiles
- **Appui long** : Menu contextuel
- **Double tap** : Activation
- **Gestes de balayage** : Navigation
- **Zoom** : Support natif

### Optimisations
- Taille des zones tactiles (44px minimum)
- Espacement suffisant entre éléments
- Feedback haptique sur les actions importantes

## 🛠️ Technologies Utilisées

### Standards Web
- **ARIA** : Étiquettes et descriptions sémantiques
- **WCAG 2.1** : Conformité niveau AA
- **HTML sémantique** : Structure accessible
- **CSS** : Media queries d'accessibilité

### Polices Spécialisées
- **Comic Sans MS** : Police adaptée pour dyslexiques
- **Fallbacks** : Trebuchet MS, polices système accessibles

## 🔧 Configuration Technique

### Variables CSS Personnalisées
```css
/* Contraste élevé */
.high-contrast {
  --bg-primary: #000000;
  --text-primary: #ffffff;
  --accent-primary: #ffff00;
}

/* Tailles de police */
.font-large { font-size: 1.25rem; }
.font-xlarge { font-size: 1.5rem; }

/* Réduction des animations */
.reduce-motion * {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

### Détection Automatique
```javascript
// Détection des préférences système
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
```

## 🎯 Tests d'Accessibilité

### Outils Recommandés
- **axe-core** : Tests automatisés
- **WAVE** : Évaluation web
- **Lighthouse** : Audit d'accessibilité
- **Color Contrast Analyzer** : Vérification des contrastes

### Tests Manuels
1. Navigation complète au clavier
2. Test avec lecteur d'écran
3. Vérification des contrastes
4. Test avec zoom à 200%
5. Validation HTML/ARIA

## 🚀 Améliorations Futures

### Prochaines Fonctionnalités
- **Synthèse vocale** : Lecture des messages
- **Reconnaissance vocale** : Dictée des messages
- **Mode daltonien** : Adaptation des couleurs
- **Sous-titres** : Pour les messages vocaux
- **Braille** : Support des afficheurs braille

### Contributions Bienvenues
Les suggestions d'amélioration d'accessibilité sont particulièrement appréciées !

## 📞 Support et Feedback

### Signaler un Problème
Si vous rencontrez des difficultés d'accessibilité :
1. Ouvrez une issue sur GitHub
2. Précisez votre configuration (OS, navigateur, technologie d'assistance)
3. Décrivez le problème rencontré

### Communauté
Rejoignez notre canal dédié à l'accessibilité pour :
- Partager vos retours d'expérience
- Proposer des améliorations
- Aider d'autres utilisateurs

---

> 💡 **Rappel** : L'accessibilité est un processus continu. Vos retours nous aident à améliorer l'expérience pour tous !

**Ensemble, construisons un chat vraiment inclusif ! ✊**