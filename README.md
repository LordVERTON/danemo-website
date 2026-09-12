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
