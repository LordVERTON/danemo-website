# Instructions agents — scripts

## Portée

Ces instructions couvrent scripts/ et les opérations ponctuelles.

- Lire entièrement le script et son ordre de chargement dotenv avant toute exécution.
- Certains scripts peuvent charger .env.production.local ; arrêter si la cible n’est pas explicitement confirmée.
- Ne jamais exécuter une migration de données, un seed, un envoi ou un upload par défaut.
- Préférer un mode dry-run, des opérations idempotentes et une reprise sûre pour tout nouveau script de mutation.
- Échouer rapidement si une variable obligatoire manque ; ne jamais afficher sa valeur.
- Journaliser des identifiants techniques ou des compteurs, pas des secrets ni des enregistrements clients complets.
- Conserver le format .mjs et les conventions dotenv déjà utilisées sauf raison explicite.
- Documenter en tête du script la cible, les prérequis et les effets irréversibles.
