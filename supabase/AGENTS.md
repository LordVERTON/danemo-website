# Instructions agents — Supabase

## Portée

Ces instructions couvrent supabase/, y compris migrations, configuration et seed.

- Une migration déjà appliquée ou partagée est immuable ; créer un nouveau fichier horodaté pour toute évolution.
- Garder les migrations reproductibles et ordonnées. Utiliser une transaction lorsque l’opération le permet.
- Toute nouvelle table ou opération sensible doit avoir une décision RLS explicite et des policies au moindre privilège.
- Les policies initiales dites dev-friendly ne constituent pas une garantie de sécurité en production.
- Ne jamais utiliser la service-role key dans SQL, seed ou fichier versionné.
- supabase/seed.sql est réservé aux données locales synthétiques : aucune PII ni donnée de production.
- Ne pas éditer supabase/.temp/, supabase/.branches/ ou les fichiers générés par la CLI.
- Ne jamais lancer db reset, db push, link, migration up/down ou seed sans demande explicite et confirmation de la cible.
- Après un changement de schéma, identifier les types TypeScript, accès DB et contrats API affectés.
- Vérifier le SQL et le diff sans se connecter à une base distante par défaut.
