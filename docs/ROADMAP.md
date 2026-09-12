# DANEMO — Roadmap unique

> Source de vérité de toutes les tâches produit, métier, UX/UI, qualité et formation. Mise à jour le 12/09/2026.

## Légende

- `[x]` : implémenté dans le dépôt ; la recette métier et la configuration de production restent à confirmer lorsqu’indiqué.
- `[ ]` : à faire ou à finaliser ; les précisions entre parenthèses décrivent les bases déjà présentes.
- **P0** : sécurité, décision métier ou opération quotidienne bloquante. **P1** : amélioration prioritaire. **P2** : consolidation.

## P0 — Sécurité et exploitation

- [x] Contrôler les autorisations côté serveur pour toutes les routes sensibles.
- [x] Appliquer le moindre privilège aux tables Supabase (RLS et droits directs).
- [x] Corriger la numérotation des factures détectée par le lint SQL.
- [ ] Finaliser l’audit des secrets : rotation/révocation des anciens identifiants, traitement de la clé PEM locale et purge de l’historique Git après validation.
- [ ] Compléter le rate limit en mémoire par une protection WAF/CDN ou un stockage partagé entre instances.
- [ ] Formaliser mots de passe, récupération, révocation immédiate, revue périodique des rôles et MFA administrateur.
- [ ] Mettre en place sauvegardes testées, plan de restauration, alertes de santé et journalisation centralisée des erreurs.
- [ ] Finaliser le déploiement distant et la consultation de la piste d’audit métier (client, commande, paiement, conteneur, contenu).
- [ ] Définir conservation, archivage et suppression des données personnelles et des exports.

## P0 — Cahier des charges : conteneurs, colis et suivi

### Couverture existante

- [x] Associer les commandes à un conteneur et regrouper les clients et commandes concernées.
- [x] Envoyer des e-mails de changement de statut de conteneur et proposer des campagnes SMS/WhatsApp ciblées par conteneur depuis une interface réservée à l’administrateur.
- [x] Exporter les clients et colis d’un conteneur en Excel et Word : une entrée par commande/colis avec client, contacts, destinataire, référence, contenu, quantité, trajet, poids, valeur, statut et conteneur.
- [x] Générer un QR unique par commande et enregistrer un événement de suivi lors de son scan.
- [x] Conserver et afficher les événements de suivi internes et publics réduits.

### À finaliser

- [ ] **Réception Bruxelles.** Formaliser dans l’application le parcours terrain : accueil du client, déchargement, formulaire, conditionnement, informations d’envoi, prix négocié, enregistrement, étiquettes et explication du suivi. Associer chaque étape à un opérateur, un horodatage et un état « à faire / fait / bloqué ».
- [ ] **Contrôle avant prise en charge.** Avant de confirmer une commande, imposer une checklist : expéditeur et destinataire complets, contenu/quantité/poids, destination, prix convenu et mode de règlement, conditions de conditionnement, étiquette imprimée et canal de notification choisi.
- [ ] **Tarification et négociation.** Enregistrer le tarif initial, la remise éventuelle, le prix final validé, le motif et l’opérateur ; préserver l’historique et empêcher une modification silencieuse après confirmation.
- [ ] **Conditionnement et réception.** Ajouter le nombre de colis, dimensions, poids constaté, type de protection, photos facultatives avant/après filmage, anomalies et accord client. Les photos doivent rester internes et soumises à une durée de conservation définie.
- [ ] Décider si l’unité suivie par QR est la commande/colis (comportement actuel), le client regroupant ses colis actifs, ou les deux ; documenter la compatibilité des QR existants.
- [ ] Définir les statuts officiels de commande et de conteneur, leurs transitions autorisées et les notifications associées.
- [ ] Créer les actions terrain « Réception Douala », « Réception Yaoundé » et « Retrait/livraison » avec lieu, horodatage, opérateur et preuve de remise validée.
- [ ] Définir la preuve exigée au retrait : signature, identité du récupérateur, pièce d’identité, photo ou aucune.
- [ ] Structurer les incidents et retards : motif, ETA révisée, destinataires, canaux, modèle de message et reprise des échecs.
- [ ] Définir la matrice notification → statut/incident → destinataires → canaux → modèle ; distinguer transactionnel et marketing sans bloquer une mise à jour métier sur un échec d’envoi.
- [ ] Ajouter validations métier : références uniques, ETD/ETA cohérentes, montants positifs, données expéditeur/destinataire complètes et association commande-conteneur valide.
- [ ] Remplacer la suppression définitive des objets métier sensibles par archivage/désactivation ou, à défaut, confirmation et récapitulatif renforcés.
- [ ] Documenter doublons client, paiements partiels, corrections de suivi, erreurs de notification, responsabilités et délais opérationnels.
- [ ] Recetter les exports sur un conteneur vide, un client avec plusieurs commandes et des caractères accentués.

## P0 — UX/UI opérateur et mobile

### Fondations livrées

- [x] Mettre en place la navigation mobile : Clients, Conteneurs, Scanner, Suivi et Plus, adaptée au rôle.
- [x] Rendre l’en-tête et la déconnexion utilisables à 320 px.
- [x] Présenter les listes clients, conteneurs et suivi en cartes sans balayage horizontal.
- [x] Prévoir caméra, saisie manuelle et messages de secours pour le scan QR.
- [x] Rendre les exports Excel et Word accessibles dans chaque carte de conteneur.

### Parcours à rendre rapides et sûrs

- [ ] **Accueil opérateur.** Afficher une file « À traiter » (suivis anciens, paiements incomplets, départs/arrivées proches, erreurs) et les actions Rechercher, Scanner, Créer une commande.
- [ ] **Assistant de réception Bruxelles.** Proposer un écran en huit étapes, utilisable sur mobile/tablette, qui conserve le brouillon : accueil, formulaire client, conditionnement, informations d’envoi, tarif, création/étiquettes, suivi client, clôture. Une étape « problème » doit permettre de signaler l’incident au responsable et de suivre sa résolution.
- [ ] **Recherche globale.** Rechercher référence, QR, client ou conteneur depuis l’en-tête/accueil, conserver filtres et requête dans l’URL et fournir un état vide utile.
- [ ] **Fiche commande.** Réunir client, trajet, statut, conteneur, paiement, QR, documents et historique dans une même fiche orientée action, avec un bloc « réception Bruxelles » (conditionnement, nombre de colis, étiquettes, tarif final, incident éventuel).
- [ ] **Suivi guidé.** Distinguer ajout de note et changement de statut ; préremplir date/opérateur, afficher l’historique et confirmer le changement.
- [x] **Scan en deux temps.** Identifier d’abord la commande, afficher ses informations, puis proposer uniquement les actions/états valides et la prochaine action après succès.
- [ ] **Statut conteneur.** Avant confirmation, afficher ancien/nouveau statut, ETD/ETA, commandes, destinataires et conséquence de notification ; séparer résultat métier et résultat d’envoi.
- [ ] **Recherche et filtres mobiles.** Empiler les contrôles sous `sm`, conserver les valeurs après retour/erreur et éviter toute largeur incompatible avec 320 px.
- [ ] **Cibles tactiles et clavier.** Atteindre 44 px minimum (48 px pour actions critiques), garantir focus, ordre de tabulation, fermeture explicite et bouton d’action accessible avec le clavier mobile.
- [ ] **Formulaires.** Utiliser une colonne sur mobile, libellés visibles, `autocomplete`, types de champ adaptés, erreurs près du champ, brouillon pour les longs parcours et saisie conservée après erreur.
- [ ] **États cohérents.** Uniformiser chargement, vide, succès, erreur et erreur partielle pour création, modification, notification, paiement, scan et suppression.
- [ ] **Accessibilité.** Assurer navigation clavier, contraste, zoom 200 %, langue déclarée, réduction des animations et absence d’action dépendante du survol.
- [ ] **Recette mobile.** Constituer une matrice à 320/360/390 px, iPhone et Android pour connexion, client, commande, paiement, conteneur, suivi et scan ; joindre capture ou enregistrement par scénario.
- [ ] **Performance mobile.** Mesurer les écrans P0 sur réseau mobile (LCP < 2,5 s, INP < 200 ms, CLS < 0,1) et documenter Lighthouse avec appareils réels.

## P1 — Expérience client et améliorations produit

### Portail, historique et langues

- [x] Fournir un suivi public réduit par référence de commande, QR ou code conteneur.
- [x] Mettre en place la fondation français/anglais du site public.
- [ ] Décider si le suivi public suffit ou si un portail client authentifié est nécessaire ; définir alors inscription, droits et confidentialité des commandes.
- [ ] Ajouter une chronologie client fiable, la dernière mise à jour et une stratégie de rafraîchissement/temps réel avec repli en cas d’échec.
- [ ] Gérer la préférence client de langue et de canal, puis traduire le back-office prioritaire et les notifications métier français/anglais.
- [ ] Définir l’archivage et la consultation des historiques de colis : correction traçable, durée de conservation, export et restauration.

### Notifications et communication

- [ ] **Notification de prise en charge.** À la confirmation, envoyer au client le numéro de colis, la destination, le lien de suivi prérempli, les trois étapes d’utilisation du tracking et un moyen de contact vérifié. Enregistrer le canal, la langue, la date, le destinataire et le résultat d’envoi sans bloquer la confirmation métier.
- [ ] **Explication des statuts.** Afficher dans le suivi et partager à l’accueil une définition client simple de chaque statut, ainsi que la prochaine action attendue ; maintenir ces libellés dans les modèles de messages.
- [ ] Créer un centre de messagerie avec modèles versionnés, variables documentées, aperçu, envoi de test, préférence de langue/canal et historique de délivrabilité.
- [ ] Rendre les destinataires, canaux et modèles configurables sans permettre une diffusion non consentie.
- [ ] Ajouter une aide contextuelle dans les formulaires pour les termes métier et valeurs attendues.

### Tableaux de bord, exports et administration

- [x] Proposer Analyses sur volumes, montants, services, statuts et périodes de commandes.
- [ ] Ajouter les indicateurs de conteneur : capacité, unités de poids/volume, taux de remplissage, ETD/ETA, retard et délai réel de livraison.
- [ ] Créer alertes et vues d’action : suivi ancien, ETA proche, paiement incomplet et donnée client manquante.
- [ ] Étendre les exports ciblés et filtrés aux clients, commandes, paiements, conteneurs et inventaire, avec contrôle d’accès et respect des filtres actifs.
- [ ] Uniformiser recherches, filtres, tris, pagination/chargement progressif, états vides, chargements et messages d’erreur.
- [ ] Améliorer l’inventaire terrain : carte mobile, référence, type, statut, emplacement, conteneur et actions explicites ; remplacer la suppression immédiate par archivage ou confirmation contextualisée.
- [ ] Instrumenter les parcours sans données sensibles : durée de création, erreurs de saisie, scans échoués, abandons et délai de mise à jour ; revoir les résultats mensuellement.
- [ ] Préparer un environnement de démonstration isolé, réinitialisable, avec données fictives et adapté aux captures mobiles.

## P2 — Intégrations, qualité technique et exploitation

### Intégrations tierces

- [x] Intégrer Twilio pour les campagnes SMS/WhatsApp et préparer l’envoi d’e-mails transactionnels.
- [ ] Choisir les partenaires de paiement, transporteurs et douanes ; documenter données échangées, propriétaire métier et règles de rapprochement.
- [ ] Mettre en œuvre les API retenues avec secrets isolés, webhooks signés, idempotence, journal de traitement et reprise opérateur.

### Qualité et exploitation

- [ ] Mettre à jour la documentation technique : architecture, variables, déploiement, base et intégrations e-mail/SMS/Cloudinary.
- [ ] Compléter les tests automatisés P0 : droits, client, commande, changement de statut, suivi QR et notifications ; intégrer les smoke tests au CI.
- [ ] Mettre en place le CI : lint, TypeScript, tests et build de production.
- [ ] Suivre dépendances, correctifs de sécurité et mises à jour Next.js/Supabase avec recette de version.
- [ ] Mettre en place suivi des erreurs et performances client/serveur, avec alertes actionnables.
- [ ] Écrire les procédures d’incident : indisponibilité Supabase, échec e-mail/SMS, perte d’accès administrateur et restauration des données.

## Formation et décisions attendues

- [ ] Valider chaque workflow avec le responsable métier, le tester sur démonstration et ajouter captures à jour.
- [ ] Produire une vidéo courte et une procédure écrite pour connexion/rôles, client, commande, conteneur, suivi/QR, règlement, inventaire, collaborateurs, contenu, messagerie, analyses et exports.
- [ ] Pour chaque vidéo mobile, valider d’abord le scénario à 360 px, 390 px et sur iPhone ou Android réel ; employer uniquement des données fictives.
- [ ] Choisir le modèle QR : commande/colis, client, ou les deux.
- [ ] Valider les étapes Douala, Yaoundé, retrait/livraison et la preuve de remise.
- [ ] Valider le parcours Bruxelles avec l’équipe entrepôt : responsable de chaque étape, temps cible, matériel requis (eau, film, balance, imprimante), règles de négociation, traitement des incidents et critère exact de « prise en charge ».
- [ ] Définir les canaux obligatoires par événement (e-mail, SMS, WhatsApp, portail), les destinataires et le consentement applicable aux messages transactionnels.
- [ ] Décider si le portail client doit être authentifié.
- [ ] Choisir les fournisseurs/API de paiement, transporteurs et douanes avant toute intégration.
