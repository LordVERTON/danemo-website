# Instructions agents — DANEMO

## Portée

Ces instructions s’appliquent à tout le dépôt. Lire aussi le fichier AGENTS.md le plus proche du fichier modifié.

## Contexte

- Application full-stack monolithique Next.js 15.2.8 App Router, React 19 et TypeScript strict.
- Front public, back-office admin et Route Handlers sous app/api.
- Supabase/PostgreSQL, NextAuth 4, Tailwind CSS 4, shadcn/Radix.
- npm 11.15.0 est le package manager de référence. package.json exige Node 22.x ; .nvmrc indique encore Node 20.

## Avant une modification

- Lire le code appelant, les contrats concernés et les instructions locales avant d’éditer.
- Limiter le diff à la demande ; ne pas lancer de refactor, renommage ou déplacement opportuniste.
- Préserver les URLs, imports, méthodes HTTP, statuts et formes JSON existants sauf demande explicite.
- Ne supprimer aucun fichier ni donnée sans demande explicite. Signaler brièvement toute hypothèse nécessaire.

## Garde-fous

- Ne jamais afficher, copier ou committer les valeurs de .env* ou certificates/.
- Traiter clients, commandes, factures, messages et documents comme des données personnelles.
- SUPABASE_SERVICE_ROLE_KEY et supabaseAdmin restent strictement côté serveur.
- Ne pas considérer les cookies legacy comme une nouvelle base de sécurité et ne pas étendre leur usage.
- Ne jamais exécuter un seed, reset, push DB, migration de données, email, SMS ou écriture Cloudinary contre une cible réelle sans demande explicite et cible confirmée.
- Ne pas réécrire une migration Supabase déjà appliquée ; ajouter une nouvelle migration.

## Conventions

- Utiliser TypeScript strict, des composants React fonctionnels et les conventions App Router existantes.
- Garder les Server Components par défaut ; ajouter use client seulement pour hooks, événements ou APIs navigateur.
- Utiliser l’alias @/* entre zones et les imports relatifs courts à l’intérieur d’un même module.
- Respecter le style local ; éviter les reformatages globaux et ne pas accroître l’usage de any.
- Ne modifier package-lock.json que lorsqu’une dépendance change explicitement.
- Nommer composants/types en PascalCase, fonctions/variables en camelCase, constantes en UPPER_SNAKE_CASE et fichiers selon la convention du dossier.
- Aux frontières API, valider les entrées, journaliser sans secret/PII et renvoyer une erreur générique au client.

## Validation

- Pour une modification de règles ou documentation : vérifier l’arborescence, le frontmatter MDC et le diff ; ne pas lancer le build applicatif.
- Pour du code : exécuter npm run lint puis npm run build lorsque pertinent.
- Aucun runner de test, formatter ou script typecheck dédié n’est configuré ; ne pas inventer une commande et signaler les validations non exécutées.
- Relire git diff et confirmer qu’aucun fichier hors périmètre n’a changé.

## Zones principales

- app/ : routes et UI App Router.
- app/admin/ : back-office ; voir ses instructions locales.
- app/api/ : API et effets serveur ; voir ses instructions locales.
- components/ : composants partagés et primitives UI.
- lib/ : domaine, DB et intégrations ; voir ses instructions locales.
- supabase/ : schéma, migrations et seed ; voir ses instructions locales.
- scripts/ : opérations ponctuelles ; voir ses instructions locales.
