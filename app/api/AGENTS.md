# Instructions agents — API

## Portée

Ces instructions couvrent tous les Route Handlers sous app/api/.

- Préserver méthode HTTP, paramètres, statut et forme de réponse existants, généralement { success, data, error }.
- Considérer toute modification de contrat comme potentiellement utilisée directement par les pages admin.
- Valider et normaliser les entrées avant tout accès DB ou effet externe ; suivre la validation locale et préférer Zod pour un nouveau schéma non trivial.
- Vérifier explicitement authentification et rôle dans le handler ou son wrapper. Ne pas supposer qu’un chemin est protégé par middleware.ts.
- Les routes app/api/public/** sont publiques par intention ; toute autre exposition doit être vérifiée dans middleware.ts et le handler.
- app/api/blog-posts conserve un GET public particulier ; ses méthodes mutantes ne doivent pas hériter de cette exception.
- Garder supabaseAdmin et les secrets côté serveur uniquement. Un accès service-role contourne RLS et exige une autorisation applicative préalable.
- Ne pas renvoyer de secret, PII, stack trace ou message brut d’un fournisseur.
- Conserver try/catch, journaliser un contexte non sensible et utiliser un statut HTTP adapté.
- Ne pas ajouter de double envoi : les notifications peuvent déjà être déclenchées depuis lib/database.ts.
- Ne pas exécuter les routes seed/reseed, health, test-connection, email, SMS, notifications, QR ou suppression pendant une simple validation.
- Pour une route destructive ou à effet externe, exiger une cible claire, un contrôle d’accès et un comportement idempotent lorsque possible.
