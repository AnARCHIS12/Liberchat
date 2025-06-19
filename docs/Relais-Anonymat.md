# Relais d'Anonymat pour Liberchat

## Pourquoi utiliser un relais ?
Un relais (proxy) permet aux utilisateurs de masquer leur adresse IP réelle lorsqu'ils se connectent à Liberchat. Le serveur ne voit que l'adresse IP du relais, pas celle de l'utilisateur.

## Fonctionnement
- L'utilisateur configure son navigateur ou son client pour passer par un serveur relais (proxy HTTP ou SOCKS).
- Le relais transmet le trafic entre l'utilisateur et le serveur Liberchat.
- L'adresse IP visible par Liberchat est celle du relais.

## Limites
- Le relais connaît l'adresse IP réelle de l'utilisateur.
- Il faut faire confiance au relais pour ne pas conserver de logs.
- Le chiffrement de bout en bout de Liberchat protège le contenu des messages, mais pas l'adresse IP au niveau du relais.

## Tutoriel : Utiliser un proxy HTTP/SOCKS
1. Trouvez un proxy de confiance (ou hébergez le vôtre).
2. Configurez votre navigateur :
   - Firefox : Préférences > Réseau > Paramètres > Configuration manuelle du proxy
   - Chrome : Paramètres > Système > Ouvrir les paramètres proxy
3. Indiquez l'adresse et le port du proxy.
4. Accédez à Liberchat normalement.

## Alternatives
- Utiliser le navigateur Tor pour un anonymat fort.
- Utiliser un VPN.
- Héberger Liberchat derrière un service caché Tor (.onion).

## Bonnes pratiques
- Ne jamais partager d'informations personnelles sensibles.
- Privilégier les proxys sans logs et chiffrés.
- Utiliser le chiffrement de bout en bout intégré à Liberchat.
