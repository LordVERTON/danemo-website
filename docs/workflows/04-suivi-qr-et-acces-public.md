# Workflow 04 — Suivi, QR code et accès public

**Priorité :** P0 · **Rôles :** équipe interne, client public

```mermaid
flowchart LR
    subgraph Interne[Équipe interne]
        A[Rechercher ou filtrer une commande] --> B[Ajouter un événement de suivi]
        B --> C[Mettre à jour le statut]
        C --> D[Consulter l'historique]
        C --> E[Déclencher la notification prévue]
        A --> F[Générer le QR code de suivi]
        F --> G[Imprimer ou copier le QR code]
        G --> H[Scanner le QR code]
    end

    subgraph Public[Client public]
        I["Scanner le QR code<br/>ou saisir la référence"] --> J[Accéder au suivi public]
        J --> K[Consulter uniquement les informations autorisées]
    end

    H --> J
    D --> J
    J --> L{"Référence disponible<br/>et accès autorisé ?"}
    L -- Oui --> K
    L -- Non --> M["Afficher un message neutre<br/>sans exposer de données"]

    classDef internal fill:#dbeafe,stroke:#2563eb,color:#111827;
    classDef public fill:#dcfce7,stroke:#16a34a,color:#111827;
    classDef control fill:#ffedd5,stroke:#ea580c,color:#111827;
    class A,B,C,D,E,F,G,H internal;
    class I,J,K public;
    class L,M control;
```

À valider : informations publiées, durée de validité, erreurs de scan et corrections de suivi.
