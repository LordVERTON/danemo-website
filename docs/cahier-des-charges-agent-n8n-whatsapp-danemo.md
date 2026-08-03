# Cahier des charges — Agent client n8n + WhatsApp Business pour DANEMO

**Destinataire :** Steve  
**Commanditaire :** DANEMO  
**Version :** 1.0 — 29 juillet 2026  
**Périmètre :** conception, implémentation, tests, mise en production, documentation et transfert de compétences

---

## 1. Résumé exécutif

DANEMO souhaite mettre en place un assistant conversationnel WhatsApp Business, orchestré par n8n et connecté à la plateforme `danemo.app`.

L’assistant doit :

1. répondre 24 h/24 aux questions courantes en français et en anglais ;
2. expliquer les services DANEMO et donner les tarifs indicatifs publiés ;
3. guider un prospect jusqu’à une demande d’envoi structurée ;
4. reconnaître un client à partir de son numéro WhatsApp, sans exposer ses données ;
5. permettre le suivi d’une commande à partir de son numéro de commande ou code QR ;
6. communiquer le statut logistique, les derniers événements et l’ETA disponible ;
7. collecter une demande de devis ou de rappel ;
8. transférer la conversation à un opérateur quand le bot est incertain, quand le client le demande ou quand la situation est sensible ;
9. envoyer des notifications transactionnelles WhatsApp après opt-in : confirmation, départ, transit, arrivée, retard et livraison ;
10. journaliser les conversations, consentements, erreurs, délais de réponse et escalades.

### Décision d’architecture recommandée

Le projet DANEMO contient déjà une intégration **Twilio**, la prise en charge du canal `whatsapp`, une normalisation E.164, une table `message_logs` et des consentements `opted_in_whatsapp`. Le MVP doit donc **conserver Twilio comme fournisseur WhatsApp** et utiliser n8n comme orchestrateur.

Cette option évite une migration inutile vers Meta Cloud API et réutilise les acquis. Une migration directe vers Meta pourra être réévaluée après le pilote sur la base du coût, des volumes et des besoins fonctionnels.

**Important :** le code actuel envoie des messages WhatsApp libres avec un champ `body`. Cela convient dans la fenêtre de service ouverte par le client, mais les messages initiés par DANEMO hors fenêtre doivent utiliser un modèle WhatsApp approuvé via un `ContentSid` Twilio. Ce point doit être corrigé avant toute automatisation transactionnelle en production.

---

## 2. Contexte fonctionnel existant

La plateforme est une application Next.js 15 reliée à Supabase/PostgreSQL. Elle couvre :

- fret maritime et aérien ;
- commerce général et négoce ;
- conditionnement de colis ;
- dédouanement de véhicules, conteneurs et marchandises ;
- déménagement international ;
- création et gestion des clients ;
- création et gestion des commandes ;
- expéditeur et destinataire distincts ;
- conteneurs avec navire, ports, ETD, ETA et statuts ;
- suivi public par numéro de commande, code conteneur ou QR ;
- événements de tracking ;
- tarifs indicatifs FR/EN ;
- factures, proformas et exports ;
- notifications e-mail ;
- envoi administratif SMS/WhatsApp via Twilio ;
- administration des messages et journal d’envoi.

### Données déjà exploitables

| Domaine | Source DANEMO | Champs utiles |
|---|---|---|
| Client | `customers` | nom, téléphone, `phone_e164`, e-mail, ville, pays, statut, opt-in |
| Commande | `orders` | numéro, service, origine, destination, description, poids, valeur, statut, ETA, QR, conteneur |
| Destinataire | `orders` | nom, téléphone, e-mail, adresse, ville, pays |
| Conteneur | `containers` | code, navire, ports, ETD, ETA, statut |
| Suivi | `tracking_events` | statut, lieu, description, opérateur, date |
| Tarifs | API `/api/public/tariff-items?lang=fr|en` | article, libellé, prix indicatif |
| Contenus | pages services, tarifs et articles publiés | base de connaissances |
| Messages | `message_logs` | canal, corps, cible, client, téléphone, statut, SID, erreur |

### Statuts à traduire pour le client

**Commande :** `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`.

**Conteneur :** `planned`, `departed`, `in_transit`, `arrived`, `delivered`, `delayed`.

Le bot ne doit jamais afficher les valeurs techniques brutes. Il doit employer des libellés compréhensibles et cohérents avec le site.

---

## 3. Objectifs et indicateurs

### Objectifs métier

- réduire les questions répétitives reçues par téléphone ou message ;
- rendre le suivi accessible sans intervention d’un opérateur ;
- éviter la perte de prospects et collecter des demandes complètes ;
- répondre immédiatement en dehors des heures d’ouverture ;
- améliorer la transparence lors des retards ;
- centraliser l’historique de la relation client ;
- laisser les sujets complexes à l’équipe DANEMO.

### KPI à mesurer dès le pilote

- taux de résolution sans humain ;
- taux d’escalade vers un opérateur ;
- délai médian de première réponse ;
- délai médian de prise en charge humaine ;
- taux de réussite du suivi autonome ;
- taux de demandes de devis complètes ;
- taux d’erreurs ou de réponses sans source ;
- taux de livraison WhatsApp ;
- taux d’opt-out et de blocage ;
- coût Twilio, Meta et IA par conversation ;
- satisfaction post-conversation (1 à 5) ;
- volume par intention, langue, pays et horaire.

### Cibles initiales après 30 jours

- première réponse automatique en moins de 10 secondes ;
- au moins 60 % des FAQ et suivis résolus sans humain ;
- moins de 5 % de réponses classées incorrectes lors de l’audit ;
- 100 % des conversations et escalades journalisées ;
- 0 notification marketing sans consentement explicite ;
- 0 exposition de données d’une commande à une personne non vérifiée.

---

## 4. Parcours conversationnels du MVP

### 4.1 Accueil et orientation

Message d’accueil court :

> Bonjour, je suis l’assistant DANEMO. Je peux vous aider à suivre un envoi, consulter nos services et tarifs, préparer une demande ou parler à un conseiller. Que souhaitez-vous faire ?

Menu recommandé :

1. Suivre mon envoi
2. Demander un devis
3. Consulter les services et tarifs
4. Préparer un nouvel envoi
5. Parler à un conseiller
6. English

Le texte libre doit rester accepté. Le menu est une aide, pas une obligation.

### 4.2 Suivi d’un envoi

1. Demander le numéro de commande ou le code QR.
2. Rechercher la commande par un endpoint serveur dédié.
3. Vérifier l’identité avant de donner des détails privés :
   - le téléphone WhatsApp correspond au téléphone E.164 du client ou du destinataire ; ou
   - demander un second facteur léger, par exemple les 4 derniers chiffres du téléphone enregistré ou le code postal de destination.
4. Retourner seulement :
   - référence ;
   - service ;
   - origine et destination ;
   - statut lisible ;
   - dernier événement public ;
   - date de mise à jour ;
   - ETA si renseignée ;
   - lien signé ou public vers la page de suivi.
5. En cas de retard, expliquer uniquement les informations enregistrées et proposer un conseiller.

Le bot ne doit jamais inventer une position, une date, un navire, un prix ou une cause de retard.

### 4.3 FAQ services

Questions couvertes :

- différence entre fret maritime et aérien ;
- zones desservies ;
- étapes d’un envoi ;
- conditionnement ;
- dédouanement ;
- déménagement international ;
- import/export et négoce ;
- documents généralement nécessaires ;
- horaires, coordonnées et localisation ;
- fonctionnement du suivi ;
- délais indicatifs, seulement s’ils figurent dans une source validée.

Toute question réglementaire ou douanière dépendant d’un pays, d’un type de marchandise ou d’une date doit être formulée comme information générale et transférée à un humain pour confirmation.

### 4.4 Tarifs

Le bot interroge l’API DANEMO des tarifs et ne mémorise pas de prix en dur.

Réponse attendue :

- maximum 5 résultats pertinents ;
- prix marqué « indicatif » ou « à partir de » ;
- quantité et total estimatif si le calcul est certain ;
- avertissement : poids, dimensions, origine, destination, douane et conditionnement peuvent modifier le prix ;
- proposition de demande de devis.

### 4.5 Demande de devis / nouvel envoi

Collecte progressive :

- nom ;
- numéro WhatsApp déjà connu ;
- e-mail facultatif ;
- particulier ou société ;
- type de service ;
- ville et pays d’origine ;
- ville et pays de destination ;
- description des marchandises ;
- quantité de colis ;
- poids approximatif ;
- dimensions si disponibles ;
- valeur déclarée ;
- délai souhaité ;
- besoin de conditionnement ;
- besoin de dédouanement ;
- photos ou documents facultatifs ;
- coordonnées du destinataire, seulement au moment nécessaire ;
- consentement au traitement et au contact WhatsApp.

Après récapitulatif, demander une confirmation explicite. Le MVP doit créer un **lead/devis**, pas une commande définitive, sauf validation métier contraire. Un opérateur transforme ensuite le lead en commande.

### 4.6 Transfert vers un humain

Déclencheurs :

- « humain », « conseiller », « appeler », « réclamation » ;
- confiance du classifieur insuffisante ;
- deux incompréhensions consécutives ;
- problème de paiement, douane, litige, dommage ou marchandise sensible ;
- données incohérentes ;
- demande de modification ou annulation ;
- indisponibilité d’une source ou d’un outil ;
- ton très négatif ou urgence détectée.

Comportement :

1. confirmer le transfert ;
2. demander un résumé si nécessaire ;
3. créer une escalade avec priorité et motif ;
4. notifier l’équipe ;
5. suspendre le bot sur cette conversation ;
6. transmettre au conseiller le client, la référence, l’intention, le résumé et l’historique ;
7. reprendre automatiquement seulement après fermeture par l’opérateur ou expiration définie.

### 4.7 Opt-in et opt-out

- Une personne qui écrit à DANEMO peut recevoir des réponses liées à sa demande dans la fenêtre de service.
- Les notifications initiées par DANEMO nécessitent un opt-in explicite enregistré.
- Mots d’arrêt : `STOP`, `ARRÊT`, `DESINSCRIPTION`, `UNSUBSCRIBE`.
- Mots de reprise : `START`, `REPRENDRE`.
- L’opt-out doit être traité automatiquement, confirmé une seule fois et bloquer les futurs envois non essentiels.
- Enregistrer la date, la source, la version du texte de consentement et la finalité.

---

## 5. Architecture cible

```text
Client WhatsApp
      |
      v
Twilio WhatsApp Sender
      |
      | webhook entrant signé
      v
Endpoint passerelle DANEMO (/api/integrations/twilio/whatsapp/inbound)
      |
      | validation signature + normalisation + idempotence
      v
n8n (orchestration)
      |
      +--> routeur d’intention déterministe
      +--> API Agent DANEMO (lecture/écriture contrôlée)
      +--> base de connaissances / RAG
      +--> modèle IA (réponse encadrée)
      +--> file d’escalade opérateur
      +--> métriques et logs
      |
      v
Twilio API / Content Templates
      |
      v
Client WhatsApp
```

### Principe de sécurité

n8n ne doit pas avoir un accès SQL libre à toutes les tables de production. Créer des endpoints internes DANEMO limités, authentifiés et auditables. La clé `SUPABASE_SERVICE_ROLE_KEY` reste côté application/serveur et ne doit jamais apparaître dans un workflow exporté.

### API internes à créer

Préfixe recommandé : `/api/integrations/n8n/v1`.

| Méthode | Endpoint | Usage |
|---|---|---|
| POST | `/whatsapp/inbound` | réception normalisée depuis la passerelle |
| POST | `/customers/resolve` | retrouver un client par téléphone E.164 |
| POST | `/tracking/lookup` | suivi après contrôles d’identité |
| GET | `/tariffs?lang=&q=` | recherche tarifaire |
| POST | `/leads` | créer/mettre à jour une demande de devis |
| POST | `/conversations` | ouvrir ou mettre à jour une conversation |
| POST | `/conversations/:id/messages` | journaliser un message |
| POST | `/conversations/:id/escalate` | créer une escalade |
| POST | `/consents` | enregistrer opt-in/opt-out |
| POST | `/outbound/status` | recevoir les statuts Twilio |
| GET | `/knowledge/export` | exporter les contenus publiés approuvés |

Authentification serveur à serveur :

- HMAC SHA-256 avec timestamp et nonce, ou jeton court renouvelable ;
- rejet si timestamp supérieur à 5 minutes ;
- idempotency key obligatoire ;
- allowlist réseau si l’infrastructure le permet ;
- rate limiting par numéro, IP et endpoint ;
- schémas Zod côté Next.js ;
- réponse sans PII inutile.

---

## 6. Modèle de données à ajouter

Créer une migration Supabase versionnée.

### `whatsapp_conversations`

- `id uuid`
- `customer_id uuid nullable`
- `wa_phone_e164 text not null`
- `twilio_wa_id text nullable`
- `language text default 'fr'`
- `status`: `bot`, `waiting_human`, `human`, `closed`, `blocked`
- `current_intent text`
- `last_inbound_at timestamptz`
- `service_window_expires_at timestamptz`
- `assigned_employee_id uuid nullable`
- `summary text nullable`
- `metadata jsonb`
- `created_at`, `updated_at`

Index unique partiel conseillé sur le téléphone pour la conversation ouverte.

### `whatsapp_messages`

- `id uuid`
- `conversation_id uuid`
- `direction`: `inbound`, `outbound`
- `sender_type`: `customer`, `bot`, `human`, `system`
- `provider_message_sid text unique`
- `message_type`: `text`, `image`, `document`, `audio`, `location`, `interactive`
- `body text nullable`
- `media_url text nullable`
- `media_mime_type text nullable`
- `status`: `received`, `queued`, `sent`, `delivered`, `read`, `failed`
- `intent text nullable`
- `confidence numeric nullable`
- `model_name text nullable`
- `prompt_version text nullable`
- `sources jsonb`
- `error_code text nullable`
- `created_at`

### `whatsapp_consents`

- `id uuid`
- `customer_id uuid nullable`
- `phone_e164 text`
- `purpose`: `transactional`, `marketing`
- `status`: `granted`, `revoked`
- `source`: `web_form`, `whatsapp`, `admin`, `paper`
- `text_version text`
- `evidence jsonb`
- `captured_at`, `revoked_at`

### `support_escalations`

- `id uuid`
- `conversation_id uuid`
- `customer_id uuid nullable`
- `order_id uuid nullable`
- `reason text`
- `priority`: `low`, `normal`, `high`, `urgent`
- `status`: `open`, `assigned`, `resolved`, `cancelled`
- `assigned_to uuid nullable`
- `summary text`
- `resolution text nullable`
- `created_at`, `assigned_at`, `resolved_at`

### `quote_leads`

- identité et coordonnées ;
- service, origine, destination ;
- marchandises, quantité, poids, dimensions, valeur ;
- options conditionnement/douane ;
- pièces jointes ;
- statut : `draft`, `qualified`, `contacted`, `converted`, `lost` ;
- conversation, client et commande liés ;
- consentements et dates.

### `knowledge_documents`

- `id`, `source_type`, `source_id`, `title`, `language` ;
- `content`, `content_hash`, `status`, `published_at`, `updated_at` ;
- embeddings via `pgvector` si RAG activé ;
- métadonnées : URL, catégorie, version, validateur.

Appliquer RLS. Les vues opérateur doivent masquer les données inutiles. Définir une politique de conservation : par exemple 13 mois pour les conversations ordinaires, plus longtemps seulement pour justification contractuelle ou légale validée.

---

## 7. Workflows n8n à livrer

Chaque workflow doit être exporté en JSON, documenté, versionné et disposer d’un workflow d’erreur.

### WF-01 — Réception, dédoublonnage et routage

1. Webhook entrant.
2. Validation du secret provenant de la passerelle DANEMO.
3. Dédoublonnage sur `MessageSid`.
4. Normalisation téléphone, texte, type et média.
5. Traitement immédiat de STOP/START.
6. Chargement ou création de la conversation.
7. Détection de langue.
8. Vérification du mode humain.
9. Classification d’intention structurée.
10. Routage vers un sous-workflow.
11. Journalisation et accusé technique.

### WF-02 — FAQ avec base de connaissances

1. Recherche hybride : mots-clés puis similarité vectorielle.
2. Filtrage par langue et contenu publié.
3. Réponse du modèle uniquement avec les passages fournis.
4. Format court adapté à WhatsApp.
5. Ajout éventuel d’un lien DANEMO.
6. Si aucune source suffisante : ne pas répondre de mémoire, escalader ou demander une précision.
7. Stocker les sources et la confiance.

### WF-03 — Suivi sécurisé

1. Extraire la référence.
2. Appeler `/tracking/lookup`.
3. Vérifier le téléphone ou lancer le second facteur.
4. Transformer les statuts en texte client.
5. Répondre avec dernier événement, ETA et lien.
6. Proposer une alerte WhatsApp lors du prochain changement.
7. Ne jamais rechercher une commande via un accès Supabase générique exposé au modèle.

### WF-04 — Tarifs et estimation

1. Comprendre l’article demandé.
2. Appeler l’API de tarifs en direct.
3. Proposer les résultats proches.
4. Calculer uniquement `prix unitaire × quantité`.
5. Marquer toute somme comme indicative.
6. Orienter vers le devis si aucun résultat exact.

### WF-05 — Qualification devis

1. Sauvegarde incrémentale de chaque champ.
2. Validation par règles, pas par texte libre du modèle.
3. Téléchargement sécurisé des médias.
4. Analyse antivirus et taille maximale.
5. Récapitulatif.
6. Confirmation du client.
7. Création du lead.
8. Notification à l’équipe et message de confirmation.

### WF-06 — Notifications transactionnelles

Déclenchement par webhook applicatif après changement de commande/conteneur, pas par polling si possible.

1. Vérifier l’idempotence événement + destinataire.
2. Résoudre le client et l’opt-in.
3. Choisir le modèle approuvé correspondant.
4. Envoyer via `ContentSid` et `ContentVariables`.
5. Journaliser SID et statut.
6. Traiter retry exponentiel uniquement pour erreurs temporaires.
7. Ne jamais réessayer une erreur de consentement, destinataire invalide ou template rejeté.

### WF-07 — Escalade humaine

1. Créer le ticket.
2. Générer un résumé factuel.
3. Notifier l’équipe par e-mail dans le MVP.
4. Afficher la conversation dans l’administration DANEMO.
5. Verrouiller la réponse automatique.
6. Alerter si non assigné après le SLA.
7. Permettre à l’opérateur de répondre via l’interface DANEMO.

### WF-08 — Synchronisation de la base de connaissances

Déclenché à chaque publication et quotidiennement en contrôle :

1. extraire services, tarifs, FAQ et articles publiés ;
2. nettoyer le HTML ;
3. découper en segments ;
4. calculer le hash ;
5. mettre à jour uniquement les contenus modifiés ;
6. créer les embeddings ;
7. retirer de l’index les contenus dépubliés ;
8. produire un rapport d’erreurs.

### WF-09 — Statuts de livraison Twilio

Recevoir `queued`, `sent`, `delivered`, `read`, `failed`, mettre à jour le message, agréger les erreurs et alerter en cas de hausse anormale.

### WF-10 — Supervision quotidienne

- erreurs n8n ;
- webhooks non traités ;
- templates désactivés ;
- files d’escalade ;
- coût et volume ;
- réponses à faible confiance ;
- taux d’opt-out ;
- conversations bloquées ;
- rapport quotidien à l’administrateur.

---

## 8. Agent IA : règles impératives

### Rôle

L’IA reformule, classe et choisit parmi des outils autorisés. Elle ne doit pas devenir la source de vérité ni disposer d’un outil SQL générique.

### Prompt système minimal

> Tu es l’assistant client officiel de DANEMO. Réponds en français ou en anglais selon le client. Utilise uniquement les informations fournies par les outils DANEMO et les sources approuvées. N’invente jamais un prix, un délai, un statut, une règle douanière ou une position. Si une information manque, dis-le clairement et propose un conseiller. Ne révèle jamais de données personnelles sans vérification. Ne modifie ni n’annule une commande. Réponds de façon concise et adaptée à WhatsApp.

### Sortie structurée du classifieur

```json
{
  "language": "fr",
  "intent": "tracking",
  "confidence": 0.96,
  "entities": {
    "tracking_reference": "..."
  },
  "needs_human": false,
  "reason": null
}
```

### Garde-fous

- température basse ;
- limite de tokens et de longueur ;
- liste blanche d’outils ;
- validation JSON ;
- timeout ;
- maximum deux appels d’outil par réponse courante ;
- aucune action financière ou de modification de commande ;
- défense contre prompt injection dans les messages et documents ;
- médias considérés comme non fiables ;
- masquage des secrets et données sensibles dans les logs ;
- audit d’un échantillon de conversations chaque semaine.

---

## 9. Modèles WhatsApp à faire approuver

Créer les versions FR et EN, catégorie **Utility** quand elles concernent une transaction réelle :

- `danemo_order_received_v1`
- `danemo_order_confirmed_v1`
- `danemo_container_departed_v1`
- `danemo_shipment_in_transit_v1`
- `danemo_shipment_arrived_v1`
- `danemo_shipment_delayed_v1`
- `danemo_shipment_delivered_v1`
- `danemo_agent_followup_v1`

Exemple :

> Bonjour {{1}}, mise à jour de votre envoi DANEMO {{2}} : {{3}}. Consultez le suivi : {{4}}. Répondez à ce message si vous avez une question.

Ne placer aucune donnée sensible dans un modèle. Les liens doivent pointer vers `https://danemo.app`. Conserver dans la configuration n8n la correspondance `événement -> ContentSid`, sans SID codé dans les nœuds multiples.

---

## 10. Modifications requises dans DANEMO

### Backend

- ajouter la passerelle webhook Twilio et valider `X-Twilio-Signature` ;
- accepter le format `application/x-www-form-urlencoded` de Twilio ;
- répondre rapidement à Twilio puis traiter de façon asynchrone ;
- créer les endpoints n8n internes ;
- ajouter les migrations de tables ;
- ajouter l’envoi Twilio par `ContentSid` ;
- ajouter le callback de statut ;
- ajouter idempotence, rate limits et audit ;
- publier les changements de statut vers n8n ;
- corriger la normalisation téléphonique : le préfixe par défaut `+32` n’est pas fiable pour les clients africains ; imposer le pays ou un numéro international ;
- étendre le formulaire public pour enregistrer séparément consentement opérationnel et marketing.

### Administration

Ajouter une section « Conversations WhatsApp » :

- liste et filtres ;
- conversation en temps réel ;
- identité et commandes liées ;
- résumé ;
- prise en charge/assignation ;
- réponse opérateur ;
- pause/reprise du bot ;
- statut de la fenêtre de 24 heures ;
- emploi obligatoire d’un template si la fenêtre est fermée ;
- escalades et SLA ;
- opt-in/opt-out ;
- statut envoyé/livré/lu/échoué ;
- export et audit.

### Frontend public

- bouton « Discuter sur WhatsApp » avec texte prérempli ;
- CTA sur suivi, services, tarifs et formulaire ;
- consentement clair et non précoché ;
- mention de la nature automatisée du premier interlocuteur ;
- lien vers confidentialité et droit de parler à un humain.

---

## 11. Sécurité, confidentialité et conformité

- réaliser une validation RGPD avec le responsable de traitement ;
- minimiser les données collectées ;
- informer le client que la conversation est automatisée ;
- définir finalités, base juridique, sous-traitants et transferts ;
- signer/contrôler les DPA avec n8n, Twilio, l’hébergeur et le fournisseur IA ;
- héberger n8n dans une région appropriée ;
- chiffrer en transit et au repos ;
- secrets uniquement dans le gestionnaire de credentials n8n/Vercel ;
- comptes nominatifs, MFA et rôles minimaux ;
- sauvegardes chiffrées et test de restauration ;
- ne pas enregistrer les prompts complets chez le fournisseur IA si cela expose des PII ;
- anonymiser les données utilisées pour les évaluations ;
- URL média à durée courte ;
- antivirus sur documents entrants ;
- limiter taille et formats ;
- plan de réponse à incident ;
- possibilité d’export et d’effacement selon politique validée.

---

## 12. Tests et critères d’acceptation

### Tests fonctionnels

- FR et EN ;
- texte libre, menu, fautes et messages courts ;
- suivi valide/invalide ;
- tentative d’accès à la commande d’un tiers ;
- client et destinataire ;
- tarif exact, approximatif et absent ;
- devis interrompu puis repris ;
- STOP/START ;
- transfert humain ;
- changement de statut ;
- template hors fenêtre ;
- réponse libre dans la fenêtre ;
- média trop gros ou interdit ;
- panne Supabase, Twilio, IA et n8n.

### Tests sécurité

- fausse signature Twilio ;
- webhook rejoué ;
- injection dans le message ;
- tentative d’exfiltration du prompt, des clés ou des données d’autres clients ;
- brute force de références ;
- dépassement du rate limit ;
- contrôle des rôles opérateur/admin ;
- secrets absents des exports n8n.

### Critères de recette

- aucun message traité deux fois ;
- aucune donnée privée sans vérification ;
- statuts et tarifs identiques à la plateforme ;
- transfert humain opérationnel ;
- STOP effectif immédiatement ;
- notifications hors fenêtre envoyées uniquement avec template approuvé ;
- statuts de livraison visibles ;
- erreurs visibles dans la supervision ;
- restauration testée ;
- documentation complète et démonstration enregistrée.

---

## 13. Roadmap recommandée

### Phase 0 — Cadrage (2 à 3 jours)

- valider propriétaire, Steve, opérateurs et horaires ;
- confirmer Twilio ;
- inventorier les données et textes validés ;
- décider du fournisseur IA et de l’hébergement n8n ;
- définir SLA, langues, conservation et budget ;
- rédiger les scénarios de recette.

**Jalon :** architecture et périmètre MVP signés.

### Phase 1 — Fondations WhatsApp (3 à 5 jours)

- configurer compte WABA, profil et numéro ;
- sandbox puis sender production ;
- webhook entrant et callback ;
- templates FR/EN soumis ;
- credentials, environnements dev/staging/prod ;
- consentement et opt-out.

**Jalon :** échange bidirectionnel fiable et journalisé.

### Phase 2 — Couche d’intégration DANEMO (5 à 8 jours)

- migrations ;
- API n8n sécurisée ;
- suivi sécurisé ;
- leads ;
- publication des événements ;
- `ContentSid` ;
- tests unitaires et d’intégration.

**Jalon :** n8n lit et écrit uniquement via contrats contrôlés.

### Phase 3 — Workflows MVP (5 à 8 jours)

- accueil et intentions ;
- suivi ;
- services/tarifs ;
- devis ;
- FAQ sans IA puis RAG ;
- escalade ;
- notifications ;
- supervision.

**Jalon :** parcours de bout en bout en staging.

### Phase 4 — Interface opérateur (4 à 7 jours)

- boîte de réception ;
- assignation ;
- réponse ;
- fenêtre 24 h ;
- pause bot ;
- escalades ;
- métriques.

**Jalon :** relais humain exploitable par l’équipe.

### Phase 5 — Recette et pilote (5 jours + 2 semaines)

- tests sécurité et charge ;
- jeu de 100 questions réelles ;
- formation ;
- pilote avec un petit groupe ;
- suivi quotidien ;
- correction des réponses et seuils.

**Jalon :** go/no-go production.

### Phase 6 — Production et optimisation continue

- ouverture progressive ;
- revue hebdomadaire des échecs ;
- enrichissement FAQ ;
- optimisation coûts et modèles ;
- satisfaction ;
- ajout ultérieur de voix, image, OCR ou paiement seulement après stabilisation.

**Estimation MVP :** environ 4 à 6 semaines pour une personne expérimentée, selon les délais d’approbation WhatsApp et la profondeur de l’interface opérateur.

---

## 14. Priorisation

### P0 — indispensable

- réception/réponse WhatsApp ;
- signature, idempotence et logs ;
- suivi sécurisé ;
- FAQ/services/tarifs ;
- opt-in/opt-out ;
- templates transactionnels ;
- transfert humain ;
- supervision ;
- documentation et tests.

### P1 — après pilote

- devis conversationnel complet ;
- pièces jointes ;
- boîte opérateur avancée ;
- RAG sur articles ;
- score de satisfaction ;
- relances de brouillons consenties.

### P2 — évolution

- messages vocaux et transcription ;
- OCR documents ;
- paiement ;
- rendez-vous ;
- marketing segmenté ;
- prévision de délais ;
- migration éventuelle vers Meta Cloud API.

---

## 15. Livrables attendus de Steve

1. schéma d’architecture final ;
2. dépôt ou branche avec migrations et code DANEMO ;
3. workflows n8n JSON, nommés et versionnés ;
4. variables d’environnement documentées sans secret ;
5. collection de tests API ;
6. templates WhatsApp et liste des `ContentSid` ;
7. matrice intentions/réponses/escalades ;
8. jeu de tests et rapport de recette ;
9. dashboard de supervision ;
10. runbook incidents ;
11. guide de déploiement et retour arrière ;
12. guide opérateur ;
13. session de formation et vidéo de démonstration ;
14. transfert des accès aux comptes appartenant à DANEMO.

### Définition de « terminé »

Le projet n’est pas terminé lorsqu’une démonstration répond à un message. Il est terminé lorsque le système est sécurisé, observable, documenté, testable, réversible, transférable et utilisable par l’équipe sans dépendance quotidienne à l’implémenteur.

---

## 16. Répartition des responsabilités

### Steve

- architecture détaillée ;
- implémentation Next.js/Supabase/n8n/Twilio ;
- sécurité technique ;
- tests et documentation ;
- déploiement ;
- formation.

### DANEMO

- fournir et posséder les comptes Twilio/Meta/n8n/IA ;
- valider textes, tarifs, services et réponses douanières ;
- fournir les horaires et règles d’escalade ;
- valider conformité et conservation ;
- participer à la recette ;
- désigner les opérateurs.

### Accompagnement du commanditaire

- arbitrer les questions métier ;
- fournir des cas clients réels anonymisés ;
- valider les étapes à chaque jalon ;
- tester le pilote ;
- accompagner Steve sur les spécificités logistiques DANEMO.

---

## 17. Questions à trancher au lancement

1. Quel est le numéro WhatsApp Business final ?
2. Le compte Twilio et le WABA appartiennent-ils déjà à DANEMO ?
3. n8n Cloud ou n8n auto-hébergé en Europe ?
4. Quel fournisseur et quel modèle IA sont autorisés ?
5. Quels opérateurs reçoivent les escalades et à quels horaires ?
6. Quel SLA annoncer au client ?
7. Quelles destinations sont officiellement desservies ?
8. Quels délais peuvent être communiqués ?
9. Quelles règles douanières ont été validées par DANEMO ?
10. Le bot crée-t-il un lead, une demande de devis ou une commande ?
11. Quelle durée de conservation est validée ?
12. Les messages marketing font-ils partie du périmètre ? Recommandation MVP : non.
13. Quelles langues après FR/EN ?
14. Quel budget mensuel maximum Twilio + Meta + n8n + IA ?

---

## 18. Message d’accompagnement prêt à envoyer

**Objet : Cahier des charges — Agent WhatsApp Business + n8n pour DANEMO**

Bonjour Steve,

Je te transmets le cahier des charges complet pour mettre en place l’assistant client WhatsApp Business de DANEMO, orchestré par n8n et connecté à notre plateforme.

L’objectif est de livrer une solution de bout en bout : réponses aux questions courantes, services et tarifs, suivi sécurisé des envois, collecte des demandes de devis, notifications transactionnelles, transfert vers un conseiller, journalisation et supervision.

Le projet contient déjà Supabase, les clients, commandes, conteneurs, événements de suivi, tarifs, consentements ainsi qu’une intégration Twilio compatible WhatsApp. La recommandation est donc de partir sur Twilio pour le MVP et de construire les workflows n8n autour d’API internes DANEMO sécurisées.

Merci de commencer par la phase de cadrage et de me retourner :

- tes questions et hypothèses ;
- l’architecture détaillée proposée ;
- le planning par jalon ;
- les accès nécessaires ;
- l’estimation de charge et de coût ;
- les risques ou arbitrages à valider.

Je peux t’accompagner sur les règles métier, les cas clients, la validation des contenus et la recette. Le but est que tu puisses l’implémenter de bout en bout, avec des validations courtes à chaque jalon.

Bien à toi,

DANEMO

---

## 19. Références techniques

- Plateforme : `https://danemo.app`
- Twilio WhatsApp : `https://www.twilio.com/docs/whatsapp/api`
- Templates Twilio : `https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates`
- Erreur de fenêtre WhatsApp 63016 : `https://www.twilio.com/docs/api/errors/63016`
- Intégration n8n WhatsApp : `https://n8n.io/integrations/whatsapp-business-cloud/`

