# Instructions agents — back-office admin

## Portée

Ces instructions couvrent app/admin/. Elles complètent le fichier AGENTS.md racine.

- Préserver les parcours, libellés, filtres, exports et appels API existants.
- La plupart des pages sont des Client Components et utilisent AdminLayout manuellement ; ne pas changer cette architecture sans demande explicite.
- Garder les contrôles admin/operator cohérents avec middleware.ts et les handlers API.
- app/admin/login est l’exception publique de cet arbre ; ne pas la placer derrière une redirection authentifiée par inadvertance.
- Un élément masqué ou désactivé dans l’UI ne constitue jamais une autorisation serveur.
- Ne jamais importer supabaseAdmin, une clé secrète ou un module serveur dans une page cliente.
- Réutiliser les composants de components/ et components/ui/ avant d’ajouter une variante.
- Conserver les états loading, empty et error lors d’une modification de flux.
- Les pages admin sont volumineuses : effectuer des changements ciblés et vérifier les usages avant d’extraire ou déplacer du code.
- Ne pas déclencher réellement email, SMS, seed, suppression ou génération de documents pendant une validation.
- Pour une évolution de contrat, modifier et valider d’abord le handler API correspondant.

