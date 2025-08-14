# DANEMO - Site Web Officiel

![DANEMO Logo](public/images/logo.webp)

**DANEMO** est une entreprise de logistique spécialisée dans le rapprochement de l'Afrique et de la Diaspora. Notre mission est de faciliter les échanges commerciaux et les services de transport entre l'Europe et l'Afrique.

## 🌍 À propos

DANEMO propose une gamme complète de services logistiques :
- **Fret maritime et aérien** - Transport de marchandises par voie maritime et aérienne
- **Commerce général** - Facilitation des échanges commerciaux
- **Conditionnement des colis** - Emballage professionnel et sécurisé
- **Dédouanement** - Services douaniers pour véhicules, conteneurs et marchandises
- **Négoce** - Intermédiation commerciale
- **Déménagement international** - Services de déménagement intercontinental

## 🚀 Technologies utilisées

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS v4
- **UI Components** : shadcn/ui avec Radix UI
- **Icônes** : Lucide React
- **Formulaires** : React Hook Form + Zod
- **Graphiques** : Recharts
- **Thèmes** : next-themes (mode sombre/clair)

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- **Node.js** (version 18.0 ou supérieure)
- **npm** ou **yarn** ou **pnpm**
- **Git**

## 🛠️ Installation et lancement en local

### 1. Cloner le repository

\`\`\`bash
git clone https://github.com/votre-username/danemo-website.git
cd danemo-website
\`\`\`

### 2. Installer les dépendances

\`\`\`bash
# Avec npm (recommandé)
npm install

# Avec yarn
yarn install

# Avec pnpm
pnpm install
\`\`\`

### 3. Lancer le serveur de développement

\`\`\`bash
# Avec npm
npm run dev

# Avec yarn
yarn dev

# Avec pnpm
pnpm dev
\`\`\`

Le serveur de développement se lancera automatiquement sur le port 3000.

### 4. Ouvrir l'application

Ouvrez votre navigateur et allez sur [http://localhost:3000](http://localhost:3000)

L'application se rechargera automatiquement lorsque vous modifiez les fichiers.

## 📁 Structure du projet

\`\`\`
danemo-website/
├── app/                    # Pages et layouts (App Router)
│   ├── blog/              # Pages du blog
│   ├── services/          # Page des services
│   ├── tarifs/            # Page des tarifs
│   ├── contact/           # Page de contact
│   ├── tracking/          # Page de suivi
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Page d'accueil
│   └── globals.css        # Styles globaux
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI (shadcn/ui)
│   ├── header.tsx        # En-tête du site
│   └── footer.tsx        # Pied de page
├── public/               # Fichiers statiques
│   └── images/          # Images du site
├── lib/                 # Utilitaires et configurations
└── hooks/              # Hooks React personnalisés
\`\`\`

## 🌐 Déploiement

### Déploiement sur Vercel (Recommandé)

1. **Connecter votre repository GitHub à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous avec votre compte GitHub
   - Cliquez sur "New Project"
   - Sélectionnez votre repository

2. **Configuration automatique**
   - Vercel détecte automatiquement qu'il s'agit d'un projet Next.js
   - Les paramètres par défaut conviennent parfaitement

3. **Déployer**
   - Cliquez sur "Deploy"
   - Votre site sera disponible sur une URL Vercel

### Déploiement sur Netlify

1. **Build du projet**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Connecter à Netlify**
   - Allez sur [netlify.com](https://netlify.com)
   - Connectez votre repository GitHub
   - Configurez les paramètres de build :
     - **Build command** : `npm run build`
     - **Publish directory** : `out`

### Déploiement manuel

1. **Créer un build de production**
   \`\`\`bash
   npm run build
   npm run start
   \`\`\`

2. **Servir les fichiers statiques**
   - Les fichiers sont générés dans le dossier `.next`
   - Utilisez un serveur web comme Nginx ou Apache

## 🔧 Scripts disponibles

\`\`\`bash
# Développement
npm run dev          # Lance le serveur de développement sur http://localhost:3000

# Production
npm run build        # Crée un build de production optimisé
npm run start        # Lance le serveur de production (nécessite npm run build)

# Linting
npm run lint         # Vérifie le code avec ESLint et corrige les erreurs automatiquement
\`\`\`

### Mode de développement

- **Hot Reload** : Les modifications sont appliquées instantanément
- **TypeScript** : Vérification des types en temps réel
- **ESLint** : Détection automatique des erreurs de code
- **Tailwind CSS** : Compilation automatique des styles

## 🎨 Personnalisation

### Couleurs et thème

Les couleurs principales sont définies dans `app/globals.css` :
- **Orange principal** : `#FF8C00` (couleur de marque DANEMO)
- **Gris foncé** : `#2D3748`
- **Blanc/Gris clair** : Pour les contrastes

### Polices

Le projet utilise :
- **Playfair Display** : Pour les titres
- **Proxima Nova** : Pour le texte courant

### Images

Toutes les images sont stockées dans `public/images/` et optimisées pour le web.

## 📞 Contact et support

- **Site web** : [www.danemo.be](https://www.danemo.be)
- **Email** : contact@danemo.be
- **Téléphone** : +32 123 456 789

## 📄 Licence

Ce projet est la propriété de Daniel VERTON. Tous droits réservés.

---

**Développé avec ❤️ pour rapprocher l'Afrique de la Diaspora**
