# DANEMO — Workflows unifiés

> Document fonctionnel de référence pour les parcours de l’application. Les schémas détaillés, cas limites et références techniques restent dans `docs/workflows/`.

## Rôles

| Rôle | Périmètre |
| --- | --- |
| Visiteur | Site public, demande d’expédition, suivi réduit, blog et contact. |
| Client | Pas de compte authentifié à ce jour ; suivi avec une référence publique. |
| Opérateur | Clients, commandes, conteneurs, inventaire, suivi, QR et contenu autorisé. |
| Administrateur | Tous les droits opérateur, plus collaborateurs, messages et analyses. |
| Administrateur technique | Données de démonstration et opérations d’exploitation contrôlées. |

## Règles transversales

1. Les rôles sont contrôlés côté serveur ; une action masquée dans l’interface n’est jamais une autorisation.
2. Les mutations métier doivent laisser une trace dans l’audit lorsqu’il est disponible ; une notification en erreur ne doit pas annuler une opération métier réussie.
3. Les parcours publics ne retournent que les données nécessaires ; données personnelles, financières et secrets restent internes.
4. Les procédures et vidéos utilisent un environnement de démonstration et des données fictives.

## 1. Connexion, récupération et rôles

**Acteurs :** opérateur, administrateur.

1. Le collaborateur se connecte sur `/admin/login`.
2. NextAuth/Supabase Auth vérifie ses identifiants, puis l’application vérifie rôle et activation dans `employees`.
3. Une session JWT est créée pour un compte actif cohérent ; le proxy et les routes API appliquent ensuite ses droits.
4. La réinitialisation de mot de passe requiert une session de récupération Supabase.

**Résultat attendu :** accès au back-office correspondant au rôle, ou refus indifférencié.  
**Détail :** [01 — Connexion et rôles](workflows/01-connexion-et-roles.md).

## 2. Client, commande, règlement et documents

**Acteurs :** opérateur, administrateur.

1. À Bruxelles, l’équipe accueille le client, aide au déchargement et renseigne le formulaire ; elle conditionne les colis et confirme les informations d’envoi.
2. Elle calcule puis valide le tarif, crée ou retrouve le client, enregistre la commande et imprime l’étiquette QR. La commande reçoit un numéro, un statut initial et peut être associée à un conteneur pour le fret maritime.
3. Elle explique le suivi, transmet le numéro de colis et clôture la réception. Un problème est signalé au responsable et reste suivi jusqu’à résolution.
4. Les règlements sont enregistrés au niveau client et la progression est calculée à partir des commandes et paiements ; la fiche client permet d’émettre une facture PDF et une facture récapitulative.

**Résultat attendu :** commande rattachée à son client, son conteneur éventuel et ses documents.  
**Détail :** [02 — Client, commande et règlement](workflows/02-client-commande-reglement.md).

## 3. Conteneur, commandes liées, statut et exports

**Acteurs :** opérateur, administrateur.

1. L’équipe crée ou modifie le conteneur (code, navire, ports, ETD/ETA et statut).
2. Les commandes de fret maritime et les articles d’inventaire peuvent y être associés.
3. Un changement de statut inscrit un événement dans le suivi des commandes liées et tente une notification e-mail.
4. Depuis la carte du conteneur, les exports Excel et Word produisent une entrée par commande/colis avec données client, destinataire et fret.

**Résultat attendu :** un conteneur rassemble les opérations, le suivi, les notifications et la liste exportable de ses colis.  
**Détail :** [03 — Conteneur et changement de statut](workflows/03-conteneur-et-statut.md).

## 4. Suivi, QR et accès public

**Acteurs :** visiteur, opérateur, administrateur.

1. Le visiteur recherche une référence, un QR ou un code conteneur et consulte le suivi réduit.
2. L’équipe ajoute un événement avec statut, lieu, note, opérateur et date.
3. Le scan QR résout une commande, peut en modifier le statut et ajoute un événement de suivi.
4. L’étiquette imprimable associe le QR à la commande et à ses informations opérationnelles.

**Résultat attendu :** le suivi est consultable sans exposer les coordonnées ou données financières.  
**Détail :** [04 — Suivi, QR et accès public](workflows/04-suivi-qr-et-acces-public.md).

## 5. Inscription et parcours public

**Acteurs :** visiteur, équipe interne.

1. Le visiteur sélectionne prestations/articles et renseigne client, expédition et destinataire.
2. L’API valide les données, crée un client et une commande `pending`.
3. Une confirmation e-mail est tentée lorsque l’adresse est disponible ; elle ne bloque pas la création.
4. L’équipe reprend ensuite la demande dans le back-office.

**Résultat attendu :** demande publique transformée en client et commande, sans compte client connecté.  
**Détail :** [05 — Inscription et parcours public](workflows/05-inscription-et-parcours-public.md).

## 6. Inventaire et suppression contrôlée

**Acteurs :** opérateur, administrateur.

1. L’équipe recherche, crée ou modifie un article (`colis`, `vehicule`, `marchandise`).
2. Elle renseigne statut, emplacement, poids, dimensions, valeur et conteneur éventuel.
3. La suppression est actuellement physique : ses impacts doivent être confirmés avant utilisation.

**Résultat attendu :** inventaire localisable et associé au conteneur quand nécessaire.  
**Détail :** [06 — Inventaire et suppression](workflows/06-inventaire-et-suppression.md).

## 7. Collaborateurs, messagerie et contenu

**Acteurs :** administrateur ; opérateur pour le contenu autorisé.

1. L’administrateur gère comptes, rôles, activation et activités des collaborateurs.
2. Il prévisualise et envoie des campagnes SMS/WhatsApp par client, conteneur, ville ou ensemble de clients, avec contrôle du consentement.
3. Administrateur et opérateur gèrent les contenus Puck et historiques selon leurs droits ; les révisions protègent les articles Puck.

**Résultat attendu :** accès internes, communications et contenus administrés avec droits cohérents.  
**Détail :** [07 — Collaborateurs, messagerie et blog](workflows/07-collaborateurs-messagerie-et-blog.md).

## 8. Analyses, exports généraux, audit et démonstration

**Acteurs :** administrateur, administrateur technique.

1. L’administrateur choisit une période et consulte volumes, montants, statuts, services et tendances de commandes.
2. Il exporte les données chargées au format CSV/PDF ; les exports de conteneur sont disponibles dans le workflow dédié.
3. Les mutations métier alimentent l’audit lorsque disponible.
4. Les routes de seed/reseed sont réservées à un environnement de démonstration explicitement validé.

**Résultat attendu :** pilotage de l’activité sans utiliser de données de production pour les démonstrations.  
**Détail :** [08 — Analyses, exports et démonstration](workflows/08-analyses-exports-et-demonstration.md).

## Recette commune avant formation

1. Vérifier le rôle requis, les prérequis et le résultat métier de chaque scénario.
2. Tester succès, données manquantes, droits insuffisants et échecs externes pertinents.
3. Réaliser la recette sur données fictives, puis capturer les écrans et enregistrer la vidéo associée.
4. Suivre les améliorations et critères de clôture dans [la roadmap unique](ROADMAP.md).
