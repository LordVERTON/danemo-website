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
| P0 | Consultation et mise à jour d'une fiche client | Administrateur, opérateur | Recherche, filtres, modification du client, commandes liées, règlements, factures PDF par commande ou récapitulative, étiquette QR et navigation vers la fiche détaillée. |
| P0 | Gestion des règlements | Administrateur, opérateur | Ajout d'un règlement, méthode de paiement, référence, montant, solde/progression de paiement et correction d'une saisie. |
| P0 | Création et gestion d'un conteneur | Administrateur, opérateur | Code conteneur, navire, ports, ETD/ETA, client lié, modification des informations et association aux opérations. |
| P0 | Changement de statut d'un conteneur | Administrateur, opérateur | Sélection du statut, enregistrement, notification automatique des clients liés et contrôle du résultat. |
| P0 | Suivi d'une commande | Administrateur, opérateur | Recherche/filtrage, ajout d'événements de suivi, mise à jour du statut et consultation de l'historique. |
| P0 | QR code et suivi public | Client public, équipe interne | Génération d'un QR code, impression/copie, scan par l'équipe, accès public au suivi et lecture des informations disponibles. |
| P1 | Inscription client depuis le site public | Client public | Formulaire via le QR code, choix des articles/prestations, informations d'expédition et du destinataire, confirmation et création des données côté administration. |
| P1 | Gestion de l'inventaire | Administrateur, opérateur | Création, recherche, filtres, modification et affectation à un conteneur. Le scan QR concerne les commandes, pas l’inventaire. |
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
- [x] Revoir les politiques RLS Supabase et appliquer le principe du moindre privilège, table par table. *(Terminé le 03/09/2026 : migration `20260903000100_harden_rls_least_privilege.sql` appliquée en production ; elle active RLS, retire les policies historiques et révoque les accès directs `anon`/`authenticated` sur toutes les tables métier. Vérification : `supabase migration list` aligné et `supabase db lint --linked` sans erreur.)*
- [x] Corriger l'erreur de numérotation de factures détectée par le lint SQL. *(Terminé le 03/09/2026 : migration `20260903000200_fix_invoice_sequence_customer_code.sql` appliquée en production ; la colonne accepte désormais le code global `__GLOB__` utilisé par la fonction. Vérification : `supabase db lint --linked` sans erreur.)*
- [ ] Vérifier qu'aucun secret, clé de service, mot de passe de démonstration ou fichier `.env` n'est exposé dans Git, les journaux ou le navigateur. *(En cours le 07/09/2026 : les identifiants codés en dur, le mot de passe temporaire implicite et les pseudo-sessions navigateur ont été retirés ; les seeds ne contiennent plus de mot de passe connu, et les journaux de notification ne renvoient plus les erreurs brutes du fournisseur. Le bundle navigateur ne contient aucune des valeurs secrètes locales contrôlées. Après synchronisation des refs distantes, l’audit a toutefois trouvé d’anciens identifiants de démonstration dans l’historique public, ainsi qu’une clé PEM de développement dans un objet Git local non référencé. Avant clôture : révoquer/faire tourner tout compte associé, régénérer la clé si elle a quitté la machine, puis purger ou réécrire l’historique concerné avec validation préalable et refaire le contrôle.)*
- [ ] Ajouter une limitation de débit et une protection anti-abus sur les formulaires publics, le suivi, le scan QR et l'envoi de messages. *(Première protection ajoutée le 03/09/2026 dans `proxy.ts` : limites par IP, réponses HTTP 429 et en-tête `Retry-After` pour la connexion, l’inscription publique, le suivi, les scans QR, les mises à jour de suivi et les envois e-mail/SMS. Cette limite en mémoire protège chaque instance ; compléter le déploiement par une règle WAF/CDN ou un stockage partagé pour couvrir plusieurs instances.)*
- [ ] Formaliser la gestion des comptes : mots de passe robustes, réinitialisation, révocation immédiate des accès, revue périodique des rôles et, si possible, MFA pour les administrateurs.
- [ ] Mettre en place des sauvegardes testées, un plan de restauration, des alertes de santé et une journalisation centralisée des erreurs.
- [ ] Ajouter une piste d'audit métier : qui a créé, modifié ou supprimé un client, une commande, un paiement, un conteneur ou un contenu. *(Implémentée le 04/09/2026 : migration `20260903000400_add_business_audit_log.sql`, RLS au moindre privilège et journalisation des mutations réussies dans les routes métier. Appliquée et vérifiée en local le 06/09/2026 ; l’application à la base distante reste à effectuer avec un compte Supabase disposant des droits requis.)*
- [ ] Définir une politique de conservation et de suppression des données personnelles conforme aux obligations applicables (RGPD), y compris les exportations de données.

### Priorité haute — données et opérations métier

- [ ] Définir les statuts officiels de commandes et conteneurs, leurs transitions autorisées et les notifications associées.
- [ ] Ajouter des validations métier cohérentes : unicité des références, cohérence des dates ETD/ETA, montants positifs, association commande-conteneur et données expéditeur/destinataire complètes.
- [ ] Prévoir l'archivage ou la désactivation plutôt que la suppression définitive pour les objets métier sensibles ; réserver la suppression aux cas explicitement validés.
- [ ] Ajouter des confirmations explicites et, pour les opérations sensibles, une étape de récapitulatif avant enregistrement.
- [ ] Documenter le traitement des doublons clients, des paiements partiels, des erreurs de notification et des corrections de suivi.
- [ ] Définir les responsabilités opérationnelles : qui crée une commande, qui valide un paiement, qui change un statut, qui répond aux messages et dans quels délais.

### Priorité haute — expérience mobile et préparation des vidéos

### Roadmap UX/UI opérateurs — parcours d'administration

Cette feuille de route complète les chantiers mobile ci-dessous. Elle priorise le travail quotidien d'un opérateur, sur téléphone **et** poste fixe, plutôt qu'une amélioration écran par écran. L'objectif est de réduire le nombre de recherches, de changements de contexte et de saisies répétées nécessaires pour enregistrer une opération fiable.

#### Principes de conception à conserver

- L'opérateur doit pouvoir partir d'une référence, d'un client ou d'un QR code et atteindre la même fiche opérationnelle sans connaître l'organisation interne des rubriques.
- Une action métier doit expliciter son impact : statut modifié, client concerné, conteneur lié et notification éventuellement déclenchée.
- Les listes servent à trouver et prioriser ; la fiche détail sert à agir. Éviter de mettre une action irréversible ou une mise à jour complexe directement dans une ligne de tableau.
- Les rôles restent appliqués côté serveur. L'interface doit aussi réduire la charge cognitive en mettant en avant les fonctions opérationnelles et en reléguant les contenus éditoriaux dans « Plus ».
- Conserver la continuité de contexte : retour à la liste avec recherche et filtres conservés, brouillon préservé après une erreur et lien retour vers l'objet d'origine après une action transversale.

#### Constats utilisés pour la priorisation — 10/09/2026

- Le point d'entrée « Clients » concentre déjà la création de commande, le règlement et les documents, mais les actions sont réparties entre liste, modales et fiche client ; une commande n'a pas encore de fiche opérationnelle unifiée.
- Le tableau de bord affiche des compteurs et des tuiles de navigation, sans file de travail ni action immédiate pour traiter une commande, un scan ou une arrivée proche.
- Le suivi et le scanner sont deux parcours voisins mais séparés : le scanner demande actuellement le nouveau statut avant d'avoir reconnu l'objet ; la suite du travail après un scan réussi n'est pas proposée.
- La mise à jour d'un conteneur peut notifier des clients ; l'opérateur doit donc voir avant validation le changement, les commandes concernées et le résultat de l'envoi.
- Les vues client et suivi disposent de cartes mobiles, tandis que les conteneurs, l'inventaire et la page générale des commandes conservent des logiques de tableau/formulaire plus denses. La page « Commandes » n'est pas exposée dans la navigation principale : elle ne doit pas devenir un deuxième flux concurrent tant que son rôle n'est pas défini.

#### P0 — rendre les opérations fréquentes rapides et sûres

| Chantier | Parcours cible | Évolution UX/UI attendue | Critère de recette |
| --- | --- | --- | --- |
| 1. Accueil opérateur orienté actions | Connexion → début de journée | Remplacer les seules tuiles de navigation par une file « À traiter » : commandes sans événement récent, paiements incomplets, départs/arrivées proches et erreurs à reprendre. Ajouter trois actions persistantes : rechercher, scanner, créer une commande. | Un opérateur identifie et ouvre une prochaine tâche en moins de 10 s, sans parcourir plusieurs rubriques. Les données affichées sont filtrées selon son rôle. |
| 2. Recherche opérationnelle unique | Référence de commande, QR, client ou code conteneur → action | Ajouter une recherche globale accessible depuis l'en-tête et l'accueil, avec résultats groupés (client, commande, conteneur) et accès au scanner. Conserver la recherche locale et les filtres dans les listes. | Une référence exacte mène à l'objet en un seul résultat ; une recherche incomplète affiche un état vide utile, sans perdre la requête. |
| 3. Fiche opérationnelle de commande | Client → créer/consulter commande → suivi, règlement ou documents | Faire de la commande le pivot : identité client, trajet, statut, conteneur, paiement, QR, documents et historique dans une fiche avec actions principales visibles. Depuis la fiche client, « Nouvelle commande » doit ouvrir ce contexte et revenir à la fiche après enregistrement. Ne pas créer de second parcours parallèle dans `/admin/orders` avant décision produit. | Création, association à un conteneur, ajout d'événement et accès au QR réalisables sans rechercher de nouveau le client. Chaque action ramène à un résultat compréhensible. |
| 4. Mise à jour de suivi guidée | Commande → nouvel événement | Préremplir le statut courant, la date et l'opérateur ; afficher l'historique récent et distinguer « ajouter une note » de « changer le statut ». Si le statut change, présenter un court récapitulatif avant enregistrement. | Un événement sans changement de statut ne modifie pas la commande ; un changement affiche l'ancien et le nouveau statut, puis une confirmation avec lien vers le suivi public. |
| 5. Scan d'abord, décision ensuite | Ouvrir caméra/saisir code → reconnaître → confirmer | Scinder le flux QR en deux étapes : identification de la commande, puis proposition des seules actions et statuts applicables. Après validation, afficher la commande, le statut enregistré, l'heure et des suites explicites (« Ajouter un événement », « Scanner le suivant », « Ouvrir la fiche »). | Aucun statut invalide n'est proposé ; refus caméra, code invalide et erreur réseau ont une solution de secours claire. |
| 6. Statut conteneur avec impact maîtrisé | Conteneur → modifier statut → notifier | Présenter les transitions autorisées après validation métier. Avant confirmation, montrer statut courant/nouveau statut, ETA/ETD, nombre de commandes et destinataires concernés ; après enregistrement, distinguer mise à jour réussie et résultat de notification asynchrone. | L'opérateur comprend ce qui sera notifié avant validation. Une erreur d'envoi n'est jamais interprétée comme un échec de la mise à jour du conteneur. |
| 7. Sécurité de saisie et actions destructives | Formulaires, règlement, suppression | Ajouter validation en ligne, résumé avant les actions sensibles et états de progression. Pour l'inventaire, remplacer la suppression immédiate par archivage ou, à défaut, une confirmation contextualisée avec conséquence et possibilité d'annuler dans la fenêtre autorisée. | Les erreurs serveur sont rattachées au champ ou expliquées dans le contexte. Aucune suppression ne peut être déclenchée par erreur depuis une liste dense. |

**Séquence P0 recommandée :** 1) accueil + recherche, 2) fiche commande et suivi, 3) scanner, 4) conteneur et garde-fous de saisie. Les validations métier (statuts et transitions, suppression/archivage, responsabilités de notification) restent un prérequis fonctionnel ; elles ne doivent pas être inventées uniquement dans l'interface.

#### P1 — fiabiliser le travail récurrent et le passage mobile/desktop

| Chantier | Évolution UX/UI attendue | Critère de recette |
| --- | --- | --- |
| Listes cohérentes | Unifier recherche, filtres, tri, compteur de résultats, filtres actifs effaçables, pagination ou chargement progressif et état vide actionnable. Conserver l'état dans l'URL pour partager/reprendre une recherche. | Client, suivi, conteneur et inventaire ont la même grammaire de liste et supportent retour navigateur sans perte de contexte. |
| Inventaire orienté terrain | Vue carte mobile avec référence, type, statut, emplacement et conteneur ; action explicite pour modifier, affecter ou scanner. Supprimer la duplication de recherche entre en-tête et panneau de filtres. | Recherche, filtre et mise à jour d'un article possibles à 320 px sans défilement horizontal. |
| Formulaires progressifs | Regrouper les champs par intention (client, expédition, destinataire, conteneur, documents) et afficher les champs conditionnels au bon moment. Sauvegarder un brouillon local pour les formulaires longs. | Le formulaire de commande peut être interrompu puis repris sans ressaisie ; les champs obligatoires et le prochain bouton à utiliser restent visibles. |
| États et retours homogènes | Standardiser chargement, vide, erreur, succès et erreur partielle ; employer des messages métier et une prochaine action, pas seulement une notification éphémère. | Chaque mutation P0 produit un état persistant ou consultable après changement de page. |
| Accessibilité et efficacité | Raccourcis clavier limités aux actions sûres (recherche, scanner), ordre de tabulation, focus, contraste, libellés, annonces d'état et respect de « réduire les animations ». | Les flux P0 se réalisent entièrement au clavier ; les contrôles fréquents respectent 44 px au tactile. |

#### P2 — pilotage, apprentissage et amélioration continue

- Ajouter une chronologie d'activité par commande/conteneur (actions, changements, notifications) lisible pour l'opérateur et compatible avec la piste d'audit métier.
- Afficher des alertes exploitables, avec propriétaire et échéance : ETA dépassée/proche, commande sans suivi, information client manquante, paiement incomplet, échec de notification.
- Prévoir des exports qui respectent les filtres actifs et indiquent clairement les données incluses.
- Intégrer une aide contextuelle courte et des liens vers les procédures de formation depuis les écrans P0.
- Instrumenter les parcours avec des indicateurs non sensibles : durée jusqu'à création de commande, taux d'erreur de saisie, scans échoués, abandons de formulaire, délai de mise à jour de suivi. Revoir ces mesures avec l'équipe opérationnelle chaque mois.

#### Mesure de succès et gouvernance

Avant chaque chantier, documenter le scénario opérateur, le rôle, la donnée de démonstration et le résultat attendu. Après livraison, réaliser une recette sur 360 px, 390 px et desktop, puis une observation de 3 à 5 opérateurs sur les cinq parcours P0. Les cibles initiales sont :

- créer une commande complète en moins de 4 minutes ;
- enregistrer un scan ou un événement de suivi en moins de 45 secondes ;
- retrouver une commande connue en moins de 20 secondes ;
- aucun abandon causé par une validation incompréhensible ou une navigation perdue dans les parcours P0 ;
- zéro suppression involontaire remontée durant la phase pilote.

Les seuils sont des objectifs de départ à recalibrer après une première mesure terrain, et non des règles métier.

Cette étape conditionne l'enregistrement des vidéos de formation : les parcours doivent être lisibles, réalisables au tactile et filmés avec des données fictives. La recette couvre au minimum les largeurs 320 px, 360 px et 390 px en portrait, puis une vérification sur un iPhone et un appareil Android réels.

#### Constat UX/UI de la plateforme — 04/09/2026

L'audit statique de `steve-dev-prod-backend` confirme que le site public et le suivi public disposent déjà de bonnes bases mobiles (menu hamburger, logo de retour à l'accueil, suivi en une colonne, scan QR responsive, labels et messages d'erreur). Le back-office reste toutefois majoritairement conçu autour de tableaux desktop. Les points ci-dessous doivent être traités avant de filmer les parcours d'administration.

- [ ] **Navigation administration — P0.** Remplacer la barre basse à huit entrées par cinq accès directs maximum : tableau de bord, clients, suivi, scanner et « Plus ». Le menu « Plus » doit contenir les sections secondaires selon le rôle (conteneurs, analyses, messages, blogs et collaborateurs), indiquer la section active, se fermer après navigation et conserver tous les contrôles de rôle existants. Critère de recette : aucun libellé tronqué et chaque accès mesure au moins 44 × 44 px à 320 px. *(Chantier démarré le 04/09/2026.)*
- [ ] **En-tête admin à 320 px — P0.** Réduire le libellé de marque et adapter l'accès à la déconnexion afin que l'en-tête ne déborde pas ou ne masque aucune action sur petits écrans. Critère de recette : connexion, tableau de bord et déconnexion utilisables à 320 px sans zoom ni défilement horizontal.
- [ ] **Listes métier sous forme de cartes — P0.** Prévoir une vue carte sous `lg` pour les clients, commandes et suivi ; ne conserver les tableaux denses qu'à partir du bureau. Chaque carte expose la donnée principale, le statut, le contexte indispensable et une action explicite « Voir »/« Modifier ». Critère de recette : les parcours client, commande et suivi se font sans balayage horizontal. *(En cours le 06/09/2026 : vues carte livrées pour les clients et le suivi ; la liste générale des commandes reste à généraliser.)*
- [ ] **Filtres et recherche — P0.** Empiler recherche, filtres et actions sous `sm`, supprimer les largeurs fixes incompatibles avec 320 px et conserver les valeurs après navigation, erreur ou retour. Critère de recette : le champ de recherche reste entièrement visible avec un filtre actif. *(En cours le 06/09/2026 : listes clients et suivi adaptées.)*
- [ ] **Cibles tactiles du système UI — P0.** Faire évoluer les boutons, boutons icône, sélecteurs et champs utilisés sur mobile vers une hauteur minimale de 44 px ; réserver 48 px aux actions critiques et séparer les actions destructives. Critère de recette : aucun contrôle fréquent inférieur à 44 px dans les parcours P0. *(En cours le 06/09/2026 : composants UI principaux portés à 44 px.)*
- [ ] **Modales, clavier et actions de formulaire — P0.** Normaliser toutes les modales : largeur adaptée, hauteur maximale de 90 vh, contenu défilable, fermeture explicite et bouton principal atteignable avec le clavier ouvert. Critère de recette : création d'un client, commande et règlement possible sur iPhone et Android sans perdre la saisie. *(En cours le 06/09/2026 : composants de modale normalisés, actions de commande stabilisées et modale de suivi réordonnée pour placer l’ajout d’événement avant l’accès QR puis l’historique, sans contenu imposant un balayage horizontal.)*
- [ ] **Saisie et validation — P1.** Ajouter `autocomplete` aux informations d'identité et d'adresse, employer `type="tel"` pour les téléphones, conserver un libellé visible et afficher les erreurs près du champ. Les grilles à deux ou trois colonnes doivent revenir à une seule colonne sur mobile. Critère de recette : le clavier approprié s'affiche et chaque erreur est compréhensible sans remonter la page. *(En cours le 06/09/2026 : formulaires client et commande couverts.)*
- [ ] **Accessibilité des actions — P1.** Remplacer les lignes de tableau uniquement cliquables et les indices au survol par des liens ou boutons accessibles au clavier ; garantir un focus visible et franciser les libellés non visuels (par exemple « Fermer »). Critère de recette : tous les parcours P0 fonctionnent au clavier sans dépendre d'un survol. *(En cours le 06/09/2026 : suivi rendu accessible par un bouton explicite.)*
- [ ] **Confirmation et états — P1.** Uniformiser les confirmations après création, modification, notification, paiement, scan et suppression, ainsi que les états vide, chargement et erreur. Critère de recette : chaque action importante donne un résultat explicite et une prochaine étape.
- [ ] **Performance et robustesse — P1.** Mesurer les écrans P0 sur réseau mobile : LCP < 2,5 s, INP < 200 ms, CLS < 0,1 et audit Lighthouse mobile documenté. Vérifier les images sans `sizes`, les images brutes du constructeur de blog et les bibliothèques lourdes chargées côté client. Critère de recette : rapport Lighthouse et test réel sur un iPhone et un Android joints à la matrice de recette.

- [ ] Établir une matrice de recette mobile par parcours P0 : connexion, recherche/création/modification d'un client, création et suivi d'une commande, gestion d'un conteneur, ajout d'un paiement et scan QR public. Conserver une capture ou un court enregistrement de validation pour chaque parcours.
- [ ] Vérifier et corriger l'absence de défilement horizontal à partir de 320 px, y compris dans les tableaux, filtres, graphiques, modales, alertes et messages d'erreur. À moins de 768 px, privilégier les cartes ou le détail progressif aux tableaux denses.
- [ ] Simplifier la navigation mobile : accès explicite aux sections d'administration prioritaires, état de la section active, retour prévisible et pas d'action dépendante du survol. Limiter les entrées principales visibles simultanément à cinq au maximum.
- [ ] Rendre les actions principales immédiatement repérables dans chaque écran mobile (créer, enregistrer, rechercher, scanner, payer) et toujours proposer une suite claire après succès, erreur ou état vide.
- [ ] Standardiser les formulaires mobile : une colonne, libellés visibles, champs adaptés au contenu (`email`, `tel`, date, montant), autocomplétion lorsque pertinente, aide courte et erreurs placées près du champ concerné.
- [ ] Vérifier que la touche de validation du clavier reste utilisable et que le bouton d'envoi n'est jamais masqué par le clavier, les barres fixes ou une modale ; conserver les saisies lors d'une erreur de validation.
- [ ] Garantir des cibles tactiles d'au moins 44 × 44 px (48 px pour les actions critiques), un espacement suffisant entre actions destructives et non destructives, ainsi qu'un état de focus visible pour le clavier.
- [ ] Adapter les modales, menus et tiroirs à la hauteur utile de l'écran : contenu défilable, fermeture explicite, action principale accessible et aucune information critique hors de la zone visible.
- [ ] Fiabiliser le parcours QR sur mobile : demande d'autorisation caméra compréhensible, indication de cadrage, reprise après refus/erreur et solution de secours par saisie du code de suivi. *(Couvert dans l’écran scanner au 06/09/2026 ; recette sur appareils réels reste à faire.)*
- [ ] Vérifier la lisibilité : hiérarchie de titres, taille de texte lisible sans zoom, contraste suffisant, zoom navigateur jusqu'à 200 %, langue déclarée et prise en charge de la préférence « réduire les animations ».
- [ ] Mesurer la qualité perçue sur réseau mobile et appareil réel : images compressées et dimensionnées, absence de script bloquant, LCP inférieur à 2,5 s, INP inférieur à 200 ms, CLS inférieur à 0,1 et audit Lighthouse mobile documenté pour les écrans P0.
- [ ] Préparer un jeu de données de démonstration mobile stable, réinitialisable et sans données personnelles réelles ; fixer les tailles d'écran, le navigateur et le scénario utilisés dans chaque vidéo pour rendre les captures reproductibles.

#### Ordre de traitement mobile recommandé

1. Connexion, navigation et tableau de bord administrateur.
2. Fiche client et création/modification de commande.
3. Paiements, conteneurs et suivi QR public.
4. Inventaire, collaborateurs, blog, messagerie, analyses et exports.

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
- [ ] Mettre en place des tests automatisés des parcours P0 : droits, création client/commande, changement de statut, suivi QR et notifications. *(En cours le 06/09/2026 : `npm run test` exécute un smoke test local authentifié couvrant la création, lecture, modification et suppression d’un client, conteneur et commande, avec nettoyage garanti. Reste à l’intégrer au CI et à compléter les droits, le suivi et les notifications.)*
- [ ] Ajouter des contrôles CI : lint compatible avec la version de Next.js, types TypeScript, tests et build de production. *(En cours le 06/09/2026 : script `lint` aligné sur ESLint CLI de Next 16 et diagnostic global en cours de correction.)*
- [ ] Suivre les dépendances, correctifs de sécurité et mises à jour de Next.js/Supabase avec un processus de recette. *(En cours le 06/09/2026 : Next.js et `eslint-config-next` mis à jour vers 16.3.4 ; recette TypeScript, génération de types et build à valider avant clôture.)*
- [ ] Mettre en place un suivi des erreurs et des performances côté client et serveur, avec alertes actionnables.
- [ ] Documenter les procédures d'incident : indisponibilité Supabase, échec e-mail/SMS, perte d'accès administrateur et restauration de données.

## To-do dédié aux vidéos de formation

Chaque vidéo doit utiliser des données de démonstration, éviter toute donnée personnelle réelle, indiquer le rôle requis et se terminer par le résultat attendu. Prévoir une version courte (2 à 5 minutes) et une procédure écrite avec chapitrage. Une vidéo mobile ne peut être enregistrée qu'après la recette du parcours concerné sur 360 px et 390 px, plus un appareil iPhone ou Android réel.

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
