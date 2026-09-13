# Workflow 05 — Inscription et parcours public

## Objectif

Permettre à un visiteur de créer sa fiche client avant de se présenter chez Danemo. La commande est ensuite saisie et validée avec un opérateur, lors de la prise en charge du colis.

## Acteurs et autorisations

| Acteur | Droit |
| --- | --- |
| Visiteur | Créer sa fiche client ; consulter les tarifs, les départs, le blog et le suivi. |
| Équipe interne | Retrouver la fiche et créer ou valider la commande avec le client. |

## Points d'entrée

- Page `/new-client-form`
- `POST /api/public/self-register`
- `GET /api/public/tariff-items`, `GET /api/public/upcoming-departure`, `GET /api/public/blog-posts`

## Déroulé

1. Le visiteur renseigne uniquement ses coordonnées dans la section « Vos informations ».
2. Le serveur valide le schéma Zod et le champ leurre `company_website`.
3. Il crée une fiche client active, sans article, devis, destinataire ni commande.
4. Le visiteur présente ensuite sa fiche et son colis à un opérateur, qui complète et valide la commande dans le back-office.

## Règles métier et sécurité

- Cinq requêtes par 15 minutes sont autorisées par identifiant client, par instance applicative.
- Sont requis : nom, téléphone, adresse, ville, code postal et pays. L'e-mail est facultatif ; s'il est fourni, il est normalisé et unique.
- Les données de transport, les prestations, les articles et le destinataire ne sont recueillis qu'au moment de la création de commande par l'équipe interne.
- Aucun e-mail de confirmation ni numéro de suivi n'est généré à l'inscription de la fiche.

## Échecs et cas limites

- Données invalides ou champ leurre rempli : 400.
- Duplication d'e-mail : 409 ; le message invite à contacter Danemo pour modifier la fiche existante.
- Une fiche sans e-mail reste valide et peut être retrouvée par l'équipe interne.

## Tests de recette

1. Soumettre les coordonnées requises avec et sans e-mail : contrôler la création de la fiche client et l'absence de commande.
2. Envoyer un champ requis vide, un e-mail invalide ou un champ leurre rempli : contrôler le 400.
3. Soumettre deux fois le même e-mail : contrôler le 409 à la seconde requête.
4. Ouvrir `/new-client-form` : contrôler que seul le bloc « Vos informations » est affiché.

## Références code

- `app/new-client-form/page.tsx`
- `app/api/public/self-register/route.ts`
- `scripts/test-business-workflows.mjs`
- `proxy.ts`
