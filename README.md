# DANEMO

Application de gestion logistique DANEMO : site public, suivi d'expédition et
espace d'administration.

## Démarrage rapide

Prérequis : Node.js compatible avec Next.js 16.3.4 et npm.

```bash
npm install
npm run dev
```

L'application est disponible sur <http://localhost:3000>.

Configurez les variables nécessaires dans `.env.local` avant de lancer les
fonctionnalités connectées à Supabase ou aux services externes. Ne versionnez
jamais de secret, d'identifiant ou de donnée de production.

## Commandes utiles

```bash
npm run dev       # développement
npm run build     # build de production
npm run lint      # lint
npm test          # tests de workflows (identifiants de test requis)
npm run test:smoke
```

## Devis et factures mensuels

Le générateur en ligne de commande crée des devis et factures au modèle du
document `Invoice 6` : fond blanc, en-tête gris, tableau anthracite et logo
Daniel VERTON. Le logo du modèle est conservé dans
[`scripts/invoice-template-logo.png`](scripts/invoice-template-logo.png).

Avant de créer le premier devis, copiez le profil versionné puis renseignez vos
coordonnées. Ce profil local, comme les devis mensuels et les PDF générés, n’est
pas versionné :

```powershell
Copy-Item billing/profile.example.json billing/profile.local.json
```

### Créer et générer un devis

Choisissez le mois au format `AAAA-MM`. Lors de la première commande, l’outil
lit les commits fonctionnels de la branche courante, les regroupe par thèmes
(sécurité, opérations, parcours opérateur, qualité, plateforme) et crée le
fichier de données éditable correspondant.

```bash
npm run billing:quote -- --month 2026-09
```

Cela crée ou utilise [`billing/devis/2026-09.json`](billing/devis/2026-09.json)
et produit `output/Devis-DANEMO-Septembre-2026.pdf`. Les exécutions suivantes
du même mois relisent le JSON et conservent vos ajustements manuels.

Pour repartir des commits du mois et recréer les objets automatiquement, utilisez
explicitement `--refresh`. Cette commande remplace le fichier JSON existant :

```bash
npm run billing:quote -- --month 2026-09 --refresh
```

### Ajuster un devis avant validation

Ouvrez `billing/devis/AAAA-MM.json`. Le tableau `lineItems` contient les objets
du devis et peut être librement ajusté :

- `title` : intitulé en gras ;
- `detail` : détail, notamment la liste des commits ;
- `quantity` : quantité ou temps facturé ;
- `unitPrice` : prix unitaire hors taxe en euros.

Les montants par ligne, le sous-total, la TVA (`taxRate`) et le total sont
calculés automatiquement. Le même fichier permet aussi de modifier la
référence, les dates, le client, les coordonnées de paiement, les remarques et
les termes.

### Générer une facture après validation

Après validation du devis, modifiez uniquement son JSON :

```json
"status": "validated"
```

Générez ensuite la facture, dans le même style visuel :

```bash
npm run billing:invoice -- --month 2026-09
```

Elle utilise les mêmes objets, montants et coordonnées, et est enregistrée dans
`output/Facture-DANEMO-Septembre-2026.pdf`. L’outil refuse de créer une facture
tant que le devis est encore au statut `draft`.

Pour afficher la syntaxe complète :

```bash
npm run billing:help
```

## Documentation

- [Référentiel des workflows](docs/workflows/README.md) — comportements,
  rôles et règles métier.
- [Workflows unifiés](docs/WORKFLOWS.md) — vue synthétique des parcours.
- [Tests de workflows](docs/TESTS_WORKFLOWS.md) — prérequis et exécution des
  tests automatisés.
- [Roadmap](docs/ROADMAP.md) — travaux réalisés et à venir.

## Données et Supabase

Les migrations constituent la source de vérité du schéma :
[`supabase/migrations`](supabase/migrations). Les données locales synthétiques
sont dans [`supabase/seed.sql`](supabase/seed.sql). Consultez également les
[instructions Supabase](supabase/AGENTS.md) avant toute opération sur la base.

## Déploiement

Exécutez `npm run build` et configurez les variables d'environnement sur la
plateforme cible. La configuration Vercel est versionnée dans
[`vercel.json`](vercel.json).
