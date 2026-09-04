# Supabase local et rôles de production

## Objet

Ce document décrit la configuration Supabase locale, le fonctionnement de l’authentification du back-office et la synchronisation des rôles entre `public.employees` et `auth.users`.

## Développement local

L’application locale utilise l’instance Supabase démarrée par la CLI :

- API Supabase : `http://127.0.0.1:54321`
- Base PostgreSQL : `127.0.0.1:54322`
- Studio : `http://127.0.0.1:54323`
- Interface Next.js : `https://localhost:3000`

Avant de lancer Next.js, démarrer Docker Desktop puis la stack locale :

```powershell
npx supabase start
npx supabase status -o env
npm run dev
```

Les trois variables de `.env.development.local` doivent correspondre aux valeurs de l’instance locale affichées par `supabase status -o env` :

```env
NEXT_PUBLIC_SUPABASE_URL=API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_KEY
```

Ne jamais recopier ces valeurs dans le dépôt, dans une documentation ou dans une variable `NEXT_PUBLIC_*` pour la clé de service.

Si Docker expose encore l’API sur un ancien port après une modification de `supabase/config.toml`, redémarrer la stack sans réinitialiser les données :

```powershell
npx supabase stop
npx supabase start
```

`npx supabase db reset` efface et recrée la base locale. Ne l’utiliser que lorsque cette remise à zéro est volontaire.

## Comptes de démonstration locaux

`supabase/seed.sql` crée uniquement des données synthétiques de développement, y compris les comptes back-office. Il insère ces comptes directement dans les tables du schéma `auth`, ce qui exige de renseigner les champs texte attendus par la version locale de GoTrue.

Le seed renseigne les champs de changement d’e-mail et normalise `recovery_token`. Cette normalisation évite une erreur interne GoTrue (`500`) lors d’une connexion par mot de passe, erreur que NextAuth présente sinon comme un `401`.

Les comptes créés en production par l’API Admin Supabase n’utilisent pas ce chemin : GoTrue renseigne lui-même ses champs internes.

## Rôles du back-office

La source de vérité métier est `public.employees.role`. Les seules valeurs autorisées pour l’accès au back-office sont `admin` et `operator`.

Lors de la connexion, `lib/auth.ts` lit `auth.users.raw_app_meta_data.role` pour construire la session NextAuth. Un rôle absent est traité comme `operator`. Les deux tables doivent donc rester synchronisées.

La migration `20260904000100_sync_auth_roles_from_employees.sql` aligne `auth.users.raw_app_meta_data.role` sur `public.employees.role` et échoue si une incohérence subsiste. Elle a été appliquée au projet de production le 4 septembre 2026.

Après une modification de rôle en production, les sessions NextAuth déjà ouvertes conservent leur rôle jusqu’à leur expiration. Pour une révocation immédiate des accès, invalider les sessions de façon contrôlée, par exemple par rotation de `NEXTAUTH_SECRET`, ce qui déconnecte tous les utilisateurs.

## Déploiement de migrations Supabase

Ne jamais exécuter de seed ou de reset contre la production.

Avant un déploiement :

```powershell
npx supabase migration list --linked
npx supabase db push --linked --dry-run --skip-vault
```

Si l’historique distant contient des migrations absentes du dépôt, récupérer d’abord ces scripts et les relire avant tout push :

```powershell
npx supabase migration fetch --linked
```

Puis déployer uniquement après validation de l’aperçu :

```powershell
npx supabase db push --linked --skip-vault
```

Ne pas utiliser `supabase migration repair` pour contourner un historique divergent sans analyse explicite : il modifie l’historique des migrations.

## Vérification de production

L’audit effectué après la migration a confirmé l’absence d’incohérence de rôles entre les employés et les comptes Auth. Les contrôles doivent rester agrégés afin de ne pas exposer d’adresses e-mail ou de données personnelles.

La commande suivante fournit aussi les alertes structurelles et de sécurité de Supabase :

```powershell
npx supabase db advisors --linked --type security --level warn
```

Les alertes connues à traiter séparément concernent le `search_path` de plusieurs fonctions SQL, l’emplacement de l’extension `pg_trgm`, la protection contre les mots de passe compromis, les options MFA et la mise à jour PostgreSQL.

## Interdictions en production

- Ne pas exécuter `supabase/seed.sql` ni `supabase db reset`.
- Ne pas insérer directement dans `auth.users`.
- Créer et mettre à jour les comptes via `supabaseAdmin.auth.admin` ou le Dashboard Supabase.
- Ne pas activer la route de seed d’administration avec des identifiants de démonstration en production.
