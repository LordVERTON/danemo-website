# Supabase local hors ligne

Le projet utilise la CLI locale `supabase` **2.117.0**, épinglée dans `package.json` et `package-lock.json`. Ne pas utiliser `npx --yes supabase` ni une installation globale : les commandes npm résolvent automatiquement `node_modules/.bin/supabase.cmd`.

## Prérequis à conserver

- Docker Desktop / Docker Engine fonctionnel ;
- `node_modules/supabase` et `node_modules/.bin/supabase.cmd` ;
- `supabase/`, en particulier `config.toml`, les migrations et `seed.sql` ;
- les images listées dans `supabase/offline-images.txt`.

`.next/`, le cache Next.js, les processus Node et le cache npm peuvent être supprimés sans affecter Supabase. Ne supprimez pas `node_modules` si vous souhaitez rester hors ligne.

> Ne pas utiliser `docker system prune -a` ou `docker image prune -a`
> si l’on souhaite conserver l’environnement Supabase utilisable hors ligne.

Ne supprimez pas non plus les volumes ou images Supabase nécessaires.

## Précharger une machine connectée

Après avoir installé les dépendances npm, démarrez une fois la pile avec Internet :

```powershell
npm run supabase:start
docker ps -a --filter "name=supabase_" --format "table {{.Names}}\t{{.Image}}"
Get-Content supabase/offline-images.txt
```

Le manifeste versionné recense les images vérifiées lors du dernier démarrage avec la CLI épinglée. Si vous mettez volontairement à jour la CLI ou `supabase/config.toml`, démarrez une fois connecté puis mettez ce manifeste à jour avec les images effectivement utilisées avant de repasser hors ligne.

## Vérifier et démarrer hors ligne

Coupez Internet, puis exécutez :

```powershell
.\scripts\check-supabase-offline.ps1
.\scripts\start-supabase-offline.ps1
```

Le premier script contrôle Docker, la CLI locale, la configuration, les migrations, le seed et chaque image requise. Le second refuse de démarrer si ces contrôles échouent ; il n’exécute ni installation ni téléchargement, puis affiche le statut local.

Les équivalents npm sont :

```powershell
npm run supabase:start
npm run supabase:status
npm run supabase:reset
npm run supabase:stop
```

`supabase:reset` recrée la base locale, applique les migrations et charge `supabase/seed.sql`, configuré dans `supabase/config.toml`.

## PostgreSQL local

Pour trouver le conteneur PostgreSQL sans supposer son nom :

```powershell
$db = docker ps --format '{{.Names}} {{.Image}}' |
  Where-Object { $_ -match '^supabase_db_' } |
  Select-Object -First 1 |
  ForEach-Object { ($_ -split ' ')[0] }
docker exec -it $db psql -U postgres
```

Vous pouvez aussi récupérer les ports et l’URL locale avec `npm run supabase:status`.
