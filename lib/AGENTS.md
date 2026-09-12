# Instructions agents — backend et bibliothèque partagée

## Portée

Ces instructions couvrent lib/, qui contient à la fois des modules partagés, clients et strictement serveur.

- Vérifier les importeurs et la présence de use client avant de changer une dépendance.
- Ne jamais rendre importable côté client un module qui lit SUPABASE_SERVICE_ROLE_KEY, SMTP, Resend, Twilio ou Cloudinary.
- supabaseAdmin est réservé au serveur ; le client anon ne remplace pas un contrôle d’autorisation.
- Préserver les signatures publiques des objets d’accès DB et utilitaires, car de nombreux handlers les appellent directement.
- Les erreurs DB/intégration peuvent être enrichies côté serveur, mais sans secret ni donnée personnelle.
- Les notifications, messages, uploads et générations de documents ont des effets externes : ne pas les invoquer pendant une validation.
- Préserver les règles de calcul, numérotation, devise et format des factures/proformas/documents sauf demande métier explicite.
- Maintenir les types Database de lib/supabase.ts cohérents avec le schéma versionné.
- Ne pas étendre les casts any existants ; typer localement les nouvelles données.
- Inspecter les deux flux de blog, historique JSON et articles Supabase/Puck, avant toute modification partagée.
