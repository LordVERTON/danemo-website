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
  container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
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
CREATE INDEX idx_orders_container_id ON orders(container_id);
CREATE INDEX idx_tracking_events_order_id ON tracking_events(order_id);
CREATE INDEX idx_tracking_events_event_date ON tracking_events(event_date);
CREATE INDEX idx_inventory_type ON inventory(type);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_client ON inventory(client);
CREATE INDEX idx_inventory_date_ajout ON inventory(date_ajout);

-- Table des clients (customers)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(255),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  company VARCHAR(255),
  tax_id VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des factures (invoices)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_method VARCHAR(50),
  payment_date DATE,
  notes TEXT,
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter customer_id à orders si nécessaire
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Index pour customers et invoices
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

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

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Customers are viewable by authenticated users" ON customers FOR SELECT USING (true);
CREATE POLICY "Customers are insertable by authenticated users" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers are updatable by authenticated users" ON customers FOR UPDATE USING (true);
CREATE POLICY "Customers are deletable by authenticated users" ON customers FOR DELETE USING (true);

CREATE POLICY "Invoices are viewable by authenticated users" ON invoices FOR SELECT USING (true);
CREATE POLICY "Invoices are insertable by authenticated users" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Invoices are updatable by authenticated users" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Invoices are deletable by authenticated users" ON invoices FOR DELETE USING (true);

-- Insérer un utilisateur admin par défaut
INSERT INTO admin_users (email, password_hash, name, role) 
VALUES ('admin@danemo.be', '$2a$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', 'Admin DANEMO', 'admin');
```

### 5. Remplir la base de données avec des données de test (Seeds)

#### Option 1 : Supprimer et recréer les données (Recommandé pour un reset complet)

**Via SQL :**
1. Exécutez d'abord `delete-orders-customers-containers.sql` pour supprimer toutes les données existantes
2. Exécutez ensuite `seed-15-customers-3-containers.sql` pour créer :
   - 15 clients différents
   - 3 conteneurs
   - Entre 1 et 5 commandes par client (aléatoire)

**Via API :**
```bash
# Supprimer toutes les données et recréer avec 15 clients, 3 conteneurs, et 1-5 commandes par client
curl -X POST http://localhost:3000/api/admin/reseed-data \
  -H "Content-Type: application/json" \
  -H "x-admin-seed-key: YOUR_ADMIN_SEED_KEY"
```

#### Option 2 : Autres scripts de seed disponibles

**Via SQL :**
- `seed-containers.sql` - Créer uniquement des conteneurs de test
- `seed-customers-from-orders.sql` - Extraire les clients des commandes existantes et créer des factures
- `seed-orders-with-containers.sql` - Créer des commandes complètes avec des clients et des conteneurs liés

**Via API :**
```bash
# Créer des conteneurs de test
curl -X POST http://localhost:3000/api/admin/seed-containers \
  -H "Content-Type: application/json" \
  -H "x-admin-seed-key: YOUR_ADMIN_SEED_KEY"

# Créer des clients et factures depuis les commandes existantes
curl -X POST http://localhost:3000/api/admin/seed-customers \
  -H "Content-Type: application/json" \
  -H "x-admin-seed-key: YOUR_ADMIN_SEED_KEY"

# Créer des commandes avec clients et conteneurs
curl -X POST http://localhost:3000/api/admin/seed-orders \
  -H "Content-Type: application/json" \
  -H "x-admin-seed-key: YOUR_ADMIN_SEED_KEY"
```

**Note** : 
- Assurez-vous d'avoir défini la variable d'environnement `ADMIN_SEED_KEY` dans votre fichier `.env.local`.
- Si vous rencontrez une erreur avec la fonction `generate_invoice_number()`, exécutez d'abord le script `fix-invoice-number-function.sql` pour corriger la fonction.
- Le script `seed-15-customers-3-containers.sql` crée un dataset complet avec 15 clients, 3 conteneurs, et des commandes aléatoires (1-5 par client).

### 6. Lancer le serveur de développement

```bash
# Avec npm
npm run dev

# Avec yarn
yarn dev

# Avec pnpm
pnpm dev
```

Le serveur de développement se lancera automatiquement sur le port 3000.

### 7. Ouvrir l'application

Ouvrez votre navigateur et allez sur [http://localhost:3000](http://localhost:3000)

**Note** : La plateforme de production est accessible sur [danemo.app](https://danemo.app)

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