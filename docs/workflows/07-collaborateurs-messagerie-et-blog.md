# Workflow 07 — Collaborateurs, messagerie et blog

**Priorité :** P1 · **Rôles :** administrateur ; administrateur ou opérateur pour le blog

```mermaid
flowchart LR
    A[Administrateur] --> B[Gérer un collaborateur]
    B --> C[Créer ou modifier le compte, le rôle et l'état d'activation]
    C --> D["Consulter les activités<br/>et revoir les accès"]

    A --> E[Préparer un message]
    E --> F[Choisir modèle, destinataires et canal]
    F --> G[Envoyer]
    G --> H{Envoi réussi ?}
    H -- Non --> I["Consulter l'erreur<br/>et corriger ou réessayer"]
    H -- Oui --> J[Conserver l'historique de délivrabilité]

    K[Administrateur ou opérateur] --> L[Créer ou modifier un article de blog]
    L --> M[Composer sections, blocs et médias]
    M --> N[Relire et enregistrer une révision]
    N --> O{Publication validée ?}
    O -- Non --> P[Conserver en brouillon ou corriger]
    O -- Oui --> Q[Publier le contenu]
    Q --> R[Modifier, dépublier ou supprimer selon les droits]

    classDef internal fill:#dbeafe,stroke:#2563eb,color:#111827;
    classDef control fill:#ffedd5,stroke:#ea580c,color:#111827;
    class A,B,C,D,E,F,G,I,J,K,L,M,N,P,Q,R internal;
    class H,O control;
```

À valider : droits d'administration, règles de publication, destinataires et erreurs d'envoi.
