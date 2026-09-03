# Workflow 08 — Analyses, exports et données de démonstration

**Priorité :** P2 · **Rôles :** administrateur, administrateur technique

```mermaid
flowchart TD
    A[Administrateur] --> B[Ouvrir les analyses]
    B --> C[Choisir une période et des filtres]
    C --> D[Lire indicateurs et répartition des statuts]
    D --> E{Export nécessaire ?}
    E -- Non --> F[Utiliser les résultats à l'écran]
    E -- Oui --> G{Droit d'export accordé ?}
    G -- Non --> H[Refuser l'export et journaliser si nécessaire]
    G -- Oui --> I[Exporter uniquement les données filtrées]

    J[Administrateur technique] --> K{Environnement hors production ?}
    K -- Non --> L[Interdire l'initialisation ou la réinitialisation]
    K -- Oui --> M{Validation préalable obtenue ?}
    M -- Non --> N[Demander la validation]
    M -- Oui --> O[Initialiser ou réinitialiser les données fictives]
    O --> P[Contrôler le résultat et consigner l'opération]

    classDef internal fill:#dbeafe,stroke:#2563eb,color:#111827;
    classDef control fill:#ffedd5,stroke:#ea580c,color:#111827;
    class A,B,C,D,F,I,J,O,P internal;
    class E,G,H,K,L,M,N control;
```

Les exports doivent cadrer le périmètre de données et leur conservation. Les opérations de démonstration ne visent jamais la production.
