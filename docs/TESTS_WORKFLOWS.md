# Tests automatisés des workflows

`npm run test` exécute une suite d'intégration HTTP contre une application DANEMO locale déjà démarrée. Elle couvre les rôles visiteur, opérateur et administrateur sans passer par l'interface.

## Lancement

Dans un premier terminal, démarrer l'application et Supabase local. Dans un second :

```powershell
$env:TEST_ADMIN_EMAIL='admin-local@example.test'
$env:TEST_ADMIN_PASSWORD='mot-de-passe-admin'
$env:TEST_OPERATOR_EMAIL='operator-local@example.test'
$env:TEST_OPERATOR_PASSWORD='mot-de-passe-operateur'
npm run test
```

`TEST_BASE_URL` est facultative et vaut `http://127.0.0.1:3000`. Seules les cibles `localhost`, `127.0.0.1` et `[::1]` sont acceptées. Les anciennes variables `SMOKE_TEST_EMAIL` et `SMOKE_TEST_PASSWORD` sont reconnues pour l'administrateur.

## Couverture

| Rôle | Tests automatisés |
| --- | --- |
| Visiteur | Tarifs FR/EN, blog, prochain départ, conteneurs publics, recherche, refus des API internes, inscription publique et suivi créé. |
| Opérateur | Connexion, refus des fonctions admin, CRUD client/conteneur/commande, changement de statut sans destinataire, suivi, QR, export XLSX, règlement, facture, inventaire, création/modification/révision d'article. |
| Administrateur | Connexion, statistiques, santé, accès collaborateurs, création d'un collaborateur et lecture d'activités, simulation de campagne, suppression article. |

## Sécurité et nettoyage

- Chaque exécution porte un préfixe `TEST-<aléa>` et supprime dans un `finally` les clients, commandes, conteneurs, inventaires, article et collaborateur créés.
- Les commandes créées n'ont pas d'adresse e-mail : les mises à jour de statut ne déclenchent pas d'envoi e-mail réel.
- La messagerie est appelée avec `dryRun: true`; les routes e-mail, SMS/WhatsApp réels, upload média, scan QR de commande et seed/reseed ne sont jamais exécutés.
- En cas d'interruption, rechercher le préfixe `TEST-` dans l'administration locale puis supprimer les éventuelles données restantes.

La suite est un test d'intégration des contrats API. Elle ne remplace pas les recettes visuelles (mise en page, caméra QR, rendu PDF/graphes) ni les tests de délivrabilité avec un fournisseur réel.
