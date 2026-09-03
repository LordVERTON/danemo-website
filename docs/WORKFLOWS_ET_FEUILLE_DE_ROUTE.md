# DANEMO — Workflows à documenter et feuille de route

Ce document recense les parcours visibles dans l'application à documenter pour les équipes DANEMO, puis les actions d'amélioration à planifier. Il constitue un backlog de documentation produit : il ne remplace pas les procédures métier validées par l'équipe opérationnelle.

## Convention de documentation

Pour chaque workflow, la future procédure doit préciser :

1. le rôle habilité (`admin`, `operator`, client public) ;
2. les prérequis et données nécessaires ;
3. les étapes à l'écran, avec captures ;
4. le résultat attendu et les notifications envoyées ;
5. les cas d'erreur et, le cas échéant, la marche à suivre pour annuler ou corriger ;
6. le lien vers la vidéo correspondante lorsque celle-ci existe.

## Workflows de l'application à documenter

| Priorité | Workflow | Public / rôle | Contenu à documenter |
| --- | --- | --- | --- |
| P0 | Connexion et rôles | Administrateur, opérateur | Connexion, déconnexion, accès selon le rôle et utilisation de l'administration. |
| P0 | Création d'un client | Administrateur, opérateur | Création depuis l'administration, informations client, statut, coordonnées et vérification de la fiche créée. |
| P0 | Création d'une commande pour un client | Administrateur, opérateur | Création depuis la fiche client ou la gestion des commandes, expéditeur, destinataire, service, colis, valeurs, dates, et association éventuelle à un conteneur. |
| P0 | Consultation et mise à jour d'une fiche client | Administrateur, opérateur | Recherche, filtres, modification du client, commandes liées, historique et navigation vers la fiche détaillée. |
| P0 | Gestion des règlements | Administrateur, opérateur | Ajout d'un règlement, méthode de paiement, référence, montant, solde/progression de paiement et correction d'une saisie. |
| P0 | Création et gestion d'un conteneur | Administrateur, opérateur | Code conteneur, navire, ports, ETD/ETA, client lié, modification des informations et association aux opérations. |
| P0 | Changement de statut d'un conteneur | Administrateur, opérateur | Sélection du statut, enregistrement, notification automatique des clients liés et contrôle du résultat. |
| P0 | Suivi d'une commande | Administrateur, opérateur | Recherche/filtrage, ajout d'événements de suivi, mise à jour du statut et consultation de l'historique. |
| P0 | QR code et suivi public | Client public, équipe interne | Génération d'un QR code, impression/copie, scan par l'équipe, accès public au suivi et lecture des informations disponibles. |
| P1 | Inscription client depuis le site public | Client public | Formulaire via le QR code, choix des articles/prestations, informations d'expédition et du destinataire, confirmation et création des données côté administration. |
| P1 | Gestion de l'inventaire | Administrateur, opérateur | Création, recherche, filtres, modification, affectation à un conteneur et scan QR pour préremplir un article. |
| P1 | Suppression d'éléments | Administrateur | Éléments réellement supprimables (inventaire, collaborateurs, contenus de blog), confirmation, conséquences, contrôles avant suppression et alternative de désactivation lorsque disponible. |
| P1 | Gestion des collaborateurs | Administrateur | Création de compte, rôle, activation/désactivation, modification, activités et bonnes pratiques d'attribution des accès. |
| P1 | Messagerie et notifications | Administrateur | Envoi de messages, modèles, destinataires, suivi des erreurs d'envoi et notifications de commandes/conteneurs. |
| P1 | Gestion éditoriale du blog | Administrateur, opérateur | Création, modification, publication, sections/blocs, médias, révisions et suppression d'articles ou de sections. |
| P2 | Analyses et exports | Administrateur | Lecture des indicateurs, filtres de période, répartition des statuts et export des données disponibles. |
| P2 | Parcours public du site | Client public | Services, tarifs, contact, blog, recherche/consultation d'un suivi et attentes de réponse. |
| P2 | Administration des données de démonstration | Administrateur technique | Usage des routes de réinitialisation ou d'initialisation de données, uniquement hors production et avec validation préalable. |

## Schémas des workflows à documenter

Les schémas Mermaid sont séparés par domaine dans le dossier `docs/workflows/`. Les éléments signalés « à valider » doivent être confirmés par le responsable métier avant la rédaction des procédures et des supports de formation.

| Workflow | Fichier |
| --- | --- |
| Connexion et rôles | [01 — Connexion et rôles](workflows/01-connexion-et-roles.md) |
| Client, commande et règlement | [02 — Client, commande et règlement](workflows/02-client-commande-reglement.md) |
| Conteneur et changement de statut | [03 — Conteneur et changement de statut](workflows/03-conteneur-et-statut.md) |
| Suivi, QR code et accès public | [04 — Suivi, QR code et accès public](workflows/04-suivi-qr-et-acces-public.md) |
| Inscription et parcours public | [05 — Inscription et parcours public](workflows/05-inscription-et-parcours-public.md) |
| Inventaire et suppression contrôlée | [06 — Inventaire et suppression contrôlée](workflows/06-inventaire-et-suppression.md) |
| Collaborateurs, messagerie et blog | [07 — Collaborateurs, messagerie et blog](workflows/07-collaborateurs-messagerie-et-blog.md) |
| Analyses, exports et données de démonstration | [08 — Analyses, exports et données de démonstration](workflows/08-analyses-exports-et-demonstration.md) |

## Ordre recommandé de production des procédures

1. Connexion, rôles, création de client et création de commande.
2. Conteneurs, statuts, notifications et suivi de commande.
3. QR code, inscription publique et paiements.
4. Inventaire, collaborateurs, messagerie et blog.
5. Analyses, exports, contenus publics et opérations de démonstration.

## Liste des choses à faire

### Priorité haute — sécurité et continuité de service

- [x] Auditer systématiquement les autorisations de toutes les routes API : aucune route d'écriture, d'administration ou contenant des données personnelles ne doit dépendre uniquement de l'interface. *(Terminé le 03/09/2026 : refus par défaut dans le proxy avec session NextAuth signée ; contrôles explicites dans les routes sensibles ; suppression du fallback par cookies non signés ; routes de seed réservées au hors-production, à un administrateur et à la clé locale ; suivi public réduit aux seules données nécessaires.)*
- Validation de cette étape : contrôle du diff réussi. La compilation complète reste à relancer après restauration de `node_modules` : les dépendances concernées sont déjà déclarées et verrouillées, mais absentes localement.
- [ ] Revoir les politiques RLS Supabase et appliquer le principe du moindre privilège, table par table. *(Audit terminé le 03/09/2026 : migration `20260903000100_harden_rls_least_privilege.sql` appliquée et vérifiée en local ; elle active RLS, retire les policies historiques et révoque les accès directs `anon`/`authenticated` sur toutes les tables métier. Production en attente : le compte CLI reçoit un 403 de la plateforme Supabase et doit obtenir l’accès au projet ou une connexion PostgreSQL autorisée.)*
- [ ] Corriger l'erreur de numérotation de factures détectée par le lint SQL. *(Migration `20260903000200_fix_invoice_sequence_customer_code.sql` appliquée et validée par `supabase db lint --local` le 03/09/2026 : la colonne accepte désormais le code global `__GLOB__` utilisé par la fonction. Application en production en attente du même accès Supabase.)*
- [ ] Vérifier qu'aucun secret, clé de service, mot de passe de démonstration ou fichier `.env` n'est exposé dans Git, les journaux ou le navigateur. *(Audit du 03/09/2026 : aucun fichier sensible suivi par Git ; `.env*` est ignoré ; les clés Supabase/OpenAI détectées sont uniquement référencées via des variables d’environnement. Le mot de passe de démonstration auparavant présent dans le README a été retiré. Reste à vérifier l’absence de cette valeur dans l’historique Git distant et à la révoquer/faire tourner si le compte correspondant a existé hors développement.)*
- [ ] Ajouter une limitation de débit et une protection anti-abus sur les formulaires publics, le suivi, le scan QR et l'envoi de messages. *(Première protection ajoutée le 03/09/2026 dans `proxy.ts` : limites par IP, réponses HTTP 429 et en-tête `Retry-After` pour la connexion, l’inscription publique, le suivi, les scans QR, les mises à jour de suivi et les envois e-mail/SMS. Cette limite en mémoire protège chaque instance ; compléter le déploiement par une règle WAF/CDN ou un stockage partagé pour couvrir plusieurs instances.)*
- [ ] Formaliser la gestion des comptes : mots de passe robustes, réinitialisation, révocation immédiate des accès, revue périodique des rôles et, si possible, MFA pour les administrateurs.
- [ ] Mettre en place des sauvegardes testées, un plan de restauration, des alertes de santé et une journalisation centralisée des erreurs.
- [ ] Ajouter une piste d'audit métier : qui a créé, modifié ou supprimé un client, une commande, un paiement, un conteneur ou un contenu.
- [ ] Définir une politique de conservation et de suppression des données personnelles conforme aux obligations applicables (RGPD), y compris les exportations de données.

### Priorité haute — données et opérations métier

- [ ] Définir les statuts officiels de commandes et conteneurs, leurs transitions autorisées et les notifications associées.
- [ ] Ajouter des validations métier cohérentes : unicité des références, cohérence des dates ETD/ETA, montants positifs, association commande-conteneur et données expéditeur/destinataire complètes.
- [ ] Prévoir l'archivage ou la désactivation plutôt que la suppression définitive pour les objets métier sensibles ; réserver la suppression aux cas explicitement validés.
- [ ] Ajouter des confirmations explicites et, pour les opérations sensibles, une étape de récapitulatif avant enregistrement.
- [ ] Documenter le traitement des doublons clients, des paiements partiels, des erreurs de notification et des corrections de suivi.
- [ ] Définir les responsabilités opérationnelles : qui crée une commande, qui valide un paiement, qui change un statut, qui répond aux messages et dans quels délais.

### Priorité moyenne — expérience utilisateur et fonctionnalités

- [ ] Uniformiser les recherches, filtres, tris, états vides, chargements et messages d'erreur dans tous les écrans d'administration.
- [ ] Ajouter des exports ciblés et filtrés (clients, commandes, paiements, conteneurs, inventaire) avec un contrôle d'accès adapté.
- [ ] Prévoir des vues ou alertes d'action : commandes sans suivi récent, conteneurs proches de l'ETA, paiements incomplets et données client manquantes.
- [ ] Améliorer l'accessibilité : navigation clavier, libellés de champs, contraste, messages d'erreur compréhensibles et tests mobile.
- [ ] Rendre les notifications configurables : destinataires, canaux, modèles, aperçu et historique de délivrabilité.
- [ ] Ajouter une aide contextuelle dans les formulaires pour les termes métier et les valeurs attendues.
- [ ] Prévoir un environnement de démonstration isolé de la production avec des données fictives.

### Priorité moyenne — qualité technique et exploitation

- [ ] Mettre à jour la documentation technique (architecture, variables d'environnement, déploiement, base de données, intégrations e-mail/SMS/Cloudinary).
- [ ] Mettre en place des tests automatisés des parcours P0 : droits, création client/commande, changement de statut, suivi QR et notifications.
- [ ] Ajouter des contrôles CI : lint compatible avec la version de Next.js, types TypeScript, tests et build de production.
- [ ] Suivre les dépendances, correctifs de sécurité et mises à jour de Next.js/Supabase avec un processus de recette.
- [ ] Mettre en place un suivi des erreurs et des performances côté client et serveur, avec alertes actionnables.
- [ ] Documenter les procédures d'incident : indisponibilité Supabase, échec e-mail/SMS, perte d'accès administrateur et restauration de données.

## To-do dédié aux vidéos de formation

Chaque vidéo doit utiliser des données de démonstration, éviter toute donnée personnelle réelle, indiquer le rôle requis et se terminer par le résultat attendu. Prévoir une version courte (2 à 5 minutes) et une procédure écrite avec chapitrage.

- [ ] Vidéo : se connecter, comprendre les rôles et se déconnecter.
- [ ] Vidéo : créer un nouveau client, vérifier la fiche et le modifier.
- [ ] Vidéo : créer une ou plusieurs commandes pour un client, puis les consulter dans la fiche client et le suivi.
- [ ] Vidéo : créer un conteneur, l'associer aux opérations et mettre à jour son statut.
- [ ] Vidéo : ajouter un événement de suivi, générer/imprimer un QR code et tester le suivi public par scan.
- [ ] Vidéo : ajouter un règlement et lire la progression de paiement.
- [ ] Vidéo : créer, modifier et supprimer un élément d'inventaire, en expliquant les conséquences de la suppression.
- [ ] Vidéo : gérer un collaborateur (création, rôle, activation/désactivation et suppression lorsque autorisée).
- [ ] Vidéo : créer, modifier et supprimer un article ou une section de blog.
- [ ] Vidéo : utiliser la messagerie, les notifications, les analyses et les exports.

## Critères de clôture

Un workflow est considéré documenté lorsque sa procédure est relue par le responsable métier, testée sur l'environnement de démonstration, illustrée par des captures à jour et liée à une vidéo si elle figure dans le plan de formation.
