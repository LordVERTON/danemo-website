# Workflow 06 — Inventaire et suppression contrôlée

**Priorité :** P1 · **Rôles :** administrateur, opérateur (suppression : administrateur)

```mermaid
flowchart TD
    A[Administrateur ou opérateur] --> B[Rechercher ou filtrer un article]
    B --> C{Article existant ?}
    C -- Non --> D["Créer l'article<br/>ou préremplir par scan QR"]
    C -- Oui --> E[Ouvrir et modifier l'article]
    D --> F[Enregistrer l'article]
    E --> F
    F --> G[Associer l'article à un conteneur si nécessaire]
    G --> H{Suppression demandée ?}
    H -- Non --> I[Conserver l'article et son historique]
    H -- Oui --> J{"Suppression autorisée<br/>et sans conséquence bloquante ?"}
    J -- Non --> K[Proposer archivage ou désactivation]
    J -- Oui --> L[Afficher une confirmation explicite]
    L --> M{Confirmer la suppression ?}
    M -- Non --> I
    M -- Oui --> N[Supprimer et tracer l'opération]

    classDef internal fill:#dbeafe,stroke:#2563eb,color:#111827;
    classDef control fill:#ffedd5,stroke:#ea580c,color:#111827;
    class A,B,D,E,F,G,I,K,L,N internal;
    class C,H,J,M control;
```

Ce même contrôle s'applique aux collaborateurs et aux contenus de blog, suivant leurs règles d'autorisation.
