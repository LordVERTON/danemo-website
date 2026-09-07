# Workflow 04 — Suivi, QR et accès public

## Objectif

Permettre à l'équipe de tracer une commande et à un visiteur de consulter un suivi réduit par numéro de commande, code conteneur ou QR de commande. Le scan de colis constitue un flux distinct, interne, sur la table `packages`.

## Acteurs et autorisations

| Acteur | Droits |
| --- | --- |
| Visiteur | Recherche par référence et lecture des événements via une référence non UUID. |
| Opérateur / administrateur | Créer un événement, modifier le statut de commande, générer/récupérer un QR et interroger un colis. |

## Points d'entrée

- `GET /api/orders/search?tracking=…` : résultat public réduit.
- `GET /api/orders/[id]/tracking` : public pour référence non UUID, interne pour UUID; `POST` interne.
- `GET, PUT, PATCH /api/orders/[id]` et `POST /api/qr/scan`.
- `GET /api/packages/[qr]` : détail colis interne.

## Déroulé

1. Pour une recherche publique, le serveur cherche d'abord une commande par numéro, puis un premier résultat par code conteneur.
2. Il ne renvoie que référence, service, origine, destination, statut, date estimée, mise à jour et données de conteneur.
3. Les événements sont lus par UUID avec session, ou par QR/numéro/code conteneur sans session. L'identifiant public est résolu en identifiant de commande.
4. L'équipe ajoute un événement avec statut, lieu, description, opérateur et date. Un statut fourni différent met aussi à jour la commande et génère un audit.
5. Le `PATCH` d'une commande peut retourner le QR existant ou en générer un unique, jusqu'à dix essais.
6. Un scan de colis met à jour le statut du colis et `last_scan_at`; il tente ensuite d'ajouter un événement de suivi.

## Diagramme principal

```mermaid
flowchart TD
  P[Visiteur : référence ou QR] --> R[GET recherche / suivi]
  R --> O{Commande trouvée ?}
  O -- non --> N[404 ou liste vide]
  O -- oui --> V[Vue publique réduite et événements]
  S[Équipe interne] --> T[POST événement de suivi]
  T --> E[Écrire tracking_events]
  T --> U{Nouveau statut fourni ?}
  U -- oui --> C[Mettre à jour orders.status et auditer]
  U -- non --> H[Conserver le statut]
  S --> Q[POST scan QR colis]
  Q --> K[Mettre à jour packages]
```

## Règles métier et sécurité

- Le proxy limite le suivi public à 60 requêtes/minute par identifiant client et les mises à jour de suivi à 60/minute; le scan QR est limité à 120/minute.
- La recherche publique exclut explicitement coordonnées, e-mails et données financières.
- Les statuts commande viennent de la contrainte SQL; les statuts colis sont `preparation`, `expedie`, `en_transit`, `arrive_port`, `dedouane`, `livre`.
- Le QR de commande est unique et peut être créé par trigger SQL à l'insertion ou via `PATCH` si absent.

## Effets de bord

- Ajout dans `tracking_events`, mise à jour éventuelle de `orders.status`, audit de la commande.
- Le scan modifie le colis. Son ajout d'événement est best effort : il peut échouer sans annuler le scan.

## Échecs et cas limites

- Le suivi par identifiant non UUID est volontairement public; les références doivent être traitées comme des identifiants non secrets.
- Le scan de colis transmet `pkg.container_id` comme `order_id` à `tracking_events`; ce champ référence normalement `orders`. C'est une incohérence implémentée à corriger ou à confirmer avant exploitation.
- La route publique d'événements retourne la totalité des événements (dont `operator` si présent). **À confirmer** au regard de la confidentialité attendue.

## Tests de recette

1. Créer une commande test et vérifier que la recherche publique ne renvoie pas les e-mails ou adresses.
2. Ajouter un événement sans statut puis avec statut : vérifier respectivement l'absence puis la présence de mise à jour de commande et d'audit.
3. Vérifier l'accès à `GET /tracking` par UUID sans session (401) puis par numéro de commande (résultat public).
4. Scanner un QR colis en environnement isolé et contrôler l'horodatage, le statut et le comportement d'échec d'événement.

## Références code

- `app/api/orders/search/route.ts`, `app/api/orders/[id]/tracking/route.ts`, `app/api/orders/[id]/route.ts`
- `app/api/qr/scan/route.ts`, `app/api/packages/[qr]/route.ts`, `proxy.ts`
- `lib/database.ts`, `supabase/migrations/0001_initial_schema.sql`
