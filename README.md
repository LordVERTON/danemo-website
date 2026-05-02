# DANEMO - Système de Gestion Logistique

**DANEMO** est une entreprise de logistique spécialisée dans le rapprochement de l'Afrique et de la Diaspora. Notre mission est de faciliter les échanges commerciaux et les services de transport entre l'Europe et l'Afrique.

🌐 **Plateforme accessible sur** : [danemo.app](https://danemo.app)

## 🌍 À propos

DANEMO propose une gamme complète de services logistiques :
- **Fret maritime et aérien** - Transport de marchandises par voie maritime et aérienne
- **Commerce général** - Facilitation des échanges commerciaux
- **Conditionnement des colis** - Emballage professionnel et sécurisé
- **Dédouanement** - Services douaniers pour véhicules, conteneurs et marchandises
- **Négoce** - Intermédiation commerciale
- **Déménagement international** - Services de déménagement intercontinental

## 🚀 Stack Technologique

### Frontend
- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS v4
- **UI Components** : shadcn/ui avec Radix UI
- **Icônes** : Lucide React
- **Formulaires** : React Hook Form + Zod
- **Graphiques** : Recharts
- **Thèmes** : next-themes (mode sombre/clair)
- **QR Code** : html5-qrcode, qrcode

### Backend
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **API** : Next.js API Routes
- **Email** : Resend + React Email
- **Notifications** : Email automatiques (Resend)

### Documents & Export
- **PDF** : jsPDF
- **DOCX** : docx
- **Excel** : ExcelJS
- **CSV** : PapaParse

### Déploiement
- **Hébergement** : Vercel (recommandé)
- **Domaine** : danemo.app

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- **Node.js** (version 18.0 ou supérieure)
- **npm** ou **yarn** ou **pnpm**
- **Git**
- **Docker** (requis pour `npx supabase start` en local)

## 🛠️ Installation et lancement en local

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/danemo-website.git
cd danemo-website
```

### 2. Installer les dépendances

```bash
# Avec npm (recommandé)
npm install

# Avec yarn
yarn install

# Avec pnpm
pnpm install
```

### 3. Configuration de l'environnement

À la racine du projet, copiez le modèle de variables puis éditez `.env.local` :

```bash
cp .env.example .env.local
```

Renseignez au minimum les clés Supabase (voir [Project Settings → API](https://supabase.com/dashboard) sur votre projet cloud, ou les URLs affichées par Supabase en local après `npx supabase start`) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Base de données Supabase en local (Docker)

Le schéma applicatif est versionné dans le dépôt :

- `supabase/migrations/` — structure de la base (tables, contraintes, index, fonctions, triggers, RLS).
- `supabase/seed.sql` — données de test minimales et cohérentes (sans données réelles ni sensibles).

Depuis la racine du projet :

```bash
npm install
cp .env.example .env.local
npx supabase start
npx supabase db reset
npm run dev
```

- **`npx supabase start`** démarre la stack Supabase locale (PostgreSQL, API, Studio, etc.) via Docker.
- **`npx supabase db reset`** recrée la base locale en appliquant les fichiers dans `supabase/migrations/`, puis recharge `supabase/seed.sql`.
- Pour **repartir d’une base propre**, relancez `npx supabase db reset` (cela réapplique migrations + seed).

Après `supabase start`, la CLI affiche l’URL du projet et les clés ; copiez-les dans `.env.local` pour pointer l’app Next.js vers la base locale.

### 5. (Optionnel) Appliquer le schéma sur un projet Supabase Cloud

Pour pousser les migrations vers un projet hébergé sur Supabase :

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Si vous souhaitez aussi charger les données de test sur ce projet distant :

```bash
npx supabase db push --include-seed
```

### 6. Données de test supplémentaires (API admin)

Pour générer des jeux de données plus volumineux (après configuration de `ADMIN_SEED_KEY` dans `.env.local`), vous pouvez utiliser les routes API documentées dans le code, par exemple :

```bash
curl -X POST http://localhost:3000/api/admin/reseed-data \
  -H "Content-Type: application/json" \
  -H "x-admin-seed-key: YOUR_ADMIN_SEED_KEY"
```

Voir également `/api/admin/seed-containers`, `/api/admin/seed-customers`, `/api/admin/seed-orders`.

### 7. Lancer le serveur de développement

```bash
# Avec npm
npm run dev

# Avec yarn
yarn dev

# Avec pnpm
pnpm dev
```

Le serveur de développement se lancera automatiquement sur le port 3000.

### 7.1 Tester sur téléphone en HTTPS (Alternative : ngrok)

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
npx ngrok http 3000
```

Ouvrez ensuite l’URL `https://...ngrok-free.app` affichée par ngrok sur votre téléphone.

> Si `ngrok` n'est pas reconnu sur Windows, utilisez `npx ngrok` (ci-dessus) ou installez-le globalement.

#### Fix rapide si ngrok échoue (Windows)

Si vous voyez une erreur `ERR_NGROK_334` (endpoint déjà en ligne), fermez les anciens processus ngrok puis relancez :

```bash
taskkill /IM ngrok.exe /F
npm run dev -- --hostname 0.0.0.0 --port 3000
npx ngrok http 3000
```

Si vous utilisez déjà ngrok sur un autre projet, démarrez l'autre projet sur un port différent (ex: `3001`) pour obtenir une URL différente.

### 8. Ouvrir l'application

Ouvrez votre navigateur et allez sur [http://localhost:3000](http://localhost:3000)

**Note** : La plateforme de production est accessible sur [danemo.app](https://danemo.app)

## 📁 Structure du projet

```
danemo-website/
├── supabase/               # CLI Supabase : migrations SQL, seed local
│   ├── migrations/
│   └── seed.sql
├── app/                    # Pages et layouts (App Router)
│   ├── admin/             # Interface d'administration
│   │   ├── analytics/     # Page des analyses
│   │   ├── inventory/     # Gestion des stocks
│   │   ├── login/         # Connexion admin
│   │   ├── orders/        # Gestion des commandes
│   │   └── tracking/      # Suivi des colis
│   ├── api/               # API Routes
│   │   ├── inventory/     # API inventaire
│   │   ├── orders/        # API commandes
│   │   └── stats/         # API statistiques
│   ├── blog/              # Pages du blog
│   ├── services/          # Page des services
│   ├── tarifs/            # Page des tarifs
│   ├── contact/           # Page de contact
│   ├── tracking/          # Suivi public
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Page d'accueil
│   └── globals.css        # Styles globaux
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI (shadcn/ui)
│   ├── admin-layout.tsx  # Layout admin
│   ├── header.tsx        # En-tête du site
│   └── footer.tsx        # Pied de page
├── lib/                  # Utilitaires et configurations
│   ├── database.ts       # API base de données
│   ├── supabase.ts       # Configuration Supabase
│   └── utils.ts          # Utilitaires
├── public/               # Fichiers statiques
│   └── images/          # Images du site
└── styles/              # Styles CSS
```

## 🌐 Déploiement

### Déploiement sur Vercel (Recommandé)

La plateforme est actuellement déployée sur Vercel et accessible sur **danemo.app**.

1. **Connecter votre repository GitHub à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous avec votre compte GitHub
   - Cliquez sur "New Project"
   - Sélectionnez votre repository

2. **Configuration des variables d'environnement**
   - Ajoutez vos variables Supabase dans les paramètres du projet :
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY` (pour les notifications email)
     - `ADMIN_SEED_KEY` (pour les scripts de seed)

3. **Configuration du domaine**
   - Configurez le domaine personnalisé `danemo.app` dans les paramètres Vercel
   - Ajoutez les enregistrements DNS nécessaires

4. **Déployer**
   - Cliquez sur "Deploy"
   - Votre site sera disponible sur danemo.app

### Déploiement sur Netlify

1. **Build du projet**
   ```bash
   npm run build
   ```

2. **Connecter à Netlify**
   - Allez sur [netlify.com](https://netlify.com)
   - Connectez votre repository GitHub
   - Configurez les variables d'environnement
   - Déployez

## 🔐 Accès Admin

- **URL** : `/admin/login`
- **Email** : `admin@danemo.be`
- **Mot de passe** : `danemo2024`

## 📊 Fonctionnalités

### 🎯 Priorités & Fonctionnalités Principales

#### 1. Gestion des Commandes
- ✅ **CRUD complet** : Création, lecture, mise à jour, suppression
- ✅ **Gestion expéditeur/destinataire** : 
  - Distinction entre expéditeur et destinataire
  - Le client peut être expéditeur, destinataire, les deux, ou aucun
  - Formulaires dédiés pour chaque rôle
  - Synchronisation automatique avec les données client
- ✅ **Association clients** : Liaison des commandes aux clients existants
- ✅ **Statuts multiples** : pending, confirmed, in_progress, completed, cancelled
- ✅ **Recherche avancée** : Par numéro, client, email, destinataire
- ✅ **Filtres** : Par statut, conteneur, date

#### 2. Suivi & Tracking
- ✅ **QR Codes** : Génération et impression de QR codes pour chaque commande
- ✅ **Scan QR** : Suivi en temps réel via scan de QR code
- ✅ **Historique complet** : Tous les événements de suivi enregistrés
- ✅ **Suivi public** : Interface publique pour suivre les commandes
- ✅ **Notifications automatiques** : Emails envoyés aux clients lors des changements de statut

#### 3. Gestion des Conteneurs
- ✅ **CRUD conteneurs** : Création et gestion des conteneurs
- ✅ **Association commandes** : Liaison des commandes aux conteneurs
- ✅ **Statuts conteneurs** : planned, departed, in_transit, arrived, delivered, delayed
- ✅ **Notifications groupées** : Notification de tous les clients d'un conteneur lors de changement de statut
- ✅ **Informations détaillées** : Navire, ports de départ/arrivée, ETD/ETA

#### 4. Gestion des Clients
- ✅ **Base de données clients** : Gestion complète des clients
- ✅ **Détails clients** : Coordonnées, adresses, informations entreprise
- ✅ **Historique commandes** : Visualisation de toutes les commandes d'un client
- ✅ **Statuts clients** : active, inactive, archived

#### 5. Documents & Facturation
- ✅ **Factures PDF** : Génération automatique de factures en PDF
- ✅ **Proformas** : Génération de proformas en PDF et DOCX
- ✅ **Informations complètes** : Adresses expéditeur/destinataire, détails de service
- ✅ **Export Excel/CSV** : Export des données pour analyse

#### 6. Notifications & Communication
- ✅ **Emails automatiques** : Notifications de changement de statut
- ✅ **Templates personnalisés** : Emails avec liens de suivi
- ✅ **Historique notifications** : Suivi des notifications envoyées
- ✅ **Notifications conteneurs** : Notifications groupées pour les conteneurs

#### 7. Analytics & Rapports
- ✅ **Dashboard admin** : Statistiques en temps réel
- ✅ **Graphiques interactifs** : Visualisation des données avec Recharts
- ✅ **Métriques clés** : Commandes, revenus, statuts, etc.

#### 8. Interface Publique
- ✅ **Page d'accueil** : Présentation moderne de l'entreprise
- ✅ **Services** : Détails des services proposés
- ✅ **Tarifs** : Informations tarifaires
- ✅ **Suivi public** : Interface de suivi pour les clients
- ✅ **Blog** : Articles et actualités
- ✅ **Contact** : Formulaire de contact
- ✅ **Multilingue** : Support FR/EN

### API REST
- ✅ **Endpoints complets** : CRUD pour toutes les entités
- ✅ **Authentification sécurisée** : Middleware d'authentification
- ✅ **Validation des données** : Validation côté serveur
- ✅ **Gestion d'erreurs** : Gestion robuste des erreurs
- ✅ **QR Code endpoints** : API dédiée pour le scan QR
- ✅ **Tracking endpoints** : API pour le suivi en temps réel

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

- **Email** : info@danemo.be
- **Téléphone** : +32488645183
- **Site web** : [danemo.be](https://danemo.be)
- **Plateforme** : [danemo.app](https://danemo.app)

---

**DANEMO** - Rapprochant l'Afrique et la Diaspora 🌍