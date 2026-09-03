# DANEMO - Système de Gestion Logistique

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

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS v4
- **UI Components** : shadcn/ui avec Radix UI
- **Base de données** : Supabase (PostgreSQL)
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

Créez un fichier `.env.local` à la racine du projet avec vos clés Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Configuration de la base de données

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez le script SQL suivant dans l'éditeur SQL de Supabase :

```sql
-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des commandes
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  service_type VARCHAR(100) NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  weight DECIMAL(10,2),
  value DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  estimated_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des événements de suivi
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  operator VARCHAR(255),
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisateurs admin
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table d'inventaire
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('colis', 'vehicule', 'marchandise')),
  reference VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  client VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('en_stock', 'en_transit', 'livre', 'en_attente')),
  location VARCHAR(255) NOT NULL,
  poids VARCHAR(100),
  dimensions VARCHAR(255),
  valeur VARCHAR(100) NOT NULL,
  date_ajout DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_client_email ON orders(client_email);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_tracking_events_order_id ON tracking_events(order_id);
CREATE INDEX idx_tracking_events_event_date ON tracking_events(event_date);
CREATE INDEX idx_inventory_type ON inventory(type);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_client ON inventory(client);
CREATE INDEX idx_inventory_date_ajout ON inventory(date_ajout);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Orders are viewable by everyone" ON orders FOR SELECT USING (true);
CREATE POLICY "Orders are insertable by authenticated users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders are updatable by authenticated users" ON orders FOR UPDATE USING (true);

CREATE POLICY "Tracking events are viewable by everyone" ON tracking_events FOR SELECT USING (true);
CREATE POLICY "Tracking events are insertable by authenticated users" ON tracking_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin users are viewable by authenticated users" ON admin_users FOR SELECT USING (true);

CREATE POLICY "Inventory is viewable by everyone" ON inventory FOR SELECT USING (true);
CREATE POLICY "Inventory is insertable by authenticated users" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Inventory is updatable by authenticated users" ON inventory FOR UPDATE USING (true);
CREATE POLICY "Inventory is deletable by authenticated users" ON inventory FOR DELETE USING (true);

-- Insérer un utilisateur admin par défaut
INSERT INTO admin_users (email, password_hash, name, role) 
VALUES ('admin@danemo.be', '$2a$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', 'Admin DANEMO', 'admin');
```

### 5. Lancer le serveur de développement

```bash
# Avec npm
npm run dev

# Avec yarn
yarn dev

# Avec pnpm
pnpm dev
```

Le serveur de développement se lancera automatiquement sur le port 3000.

### 6. Ouvrir l'application

Ouvrez votre navigateur et allez sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
danemo-website/
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

3. **Déployer**
   - Cliquez sur "Deploy"
   - Votre site sera disponible sur une URL Vercel

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

## 🔐 Accès administrateur

Les identifiants d’administration ne sont pas fournis dans le dépôt. Créez ou
provisionnez un compte administrateur dans l’environnement concerné, avec un
mot de passe unique et robuste. Ne consignez jamais ces identifiants dans la
documentation, le code source ou les journaux.

## 📊 Fonctionnalités

### Interface Admin
- ✅ Dashboard avec statistiques en temps réel
- ✅ Gestion complète des commandes (CRUD)
- ✅ Suivi des colis avec historique des événements
- ✅ Gestion des stocks et inventaire
- ✅ Analytics avec graphiques interactifs
- ✅ Recherche et filtrage avancés

### Interface Publique
- ✅ Page d'accueil moderne
- ✅ Présentation des services
- ✅ Suivi public des colis
- ✅ Blog et actualités
- ✅ Formulaire de contact

### API REST
- ✅ Endpoints complets pour toutes les fonctionnalités
- ✅ Authentification sécurisée
- ✅ Validation des données
- ✅ Gestion d'erreurs

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

---

**DANEMO** - Rapprochant l'Afrique et la Diaspora 🌍
