# Workflow 05 — Inscription et parcours public

**Priorité :** P1 / P2 · **Rôle :** client public

```mermaid
flowchart TD
    A[Visiteur] --> B[Découvrir services, tarifs, blog ou contact]
    B --> C{Souhaite-t-il s'inscrire ?}
    C -- Non --> D["Consulter un suivi<br/>ou contacter DANEMO"]
    C -- Oui --> E["Ouvrir le formulaire<br/>depuis le site ou le QR code"]
    E --> F[Choisir les articles ou prestations]
    F --> G[Renseigner expédition et destinataire]
    G --> H{Formulaire complet et valide ?}
    H -- Non --> I[Signaler les champs à corriger]
    I --> F
    H -- Oui --> J[Confirmer l'envoi]
    J --> K[Créer les données côté administration]
    K --> L["Afficher la confirmation<br/>et la prochaine étape"]

    classDef public fill:#dcfce7,stroke:#16a34a,color:#111827;
    classDef internal fill:#dbeafe,stroke:#2563eb,color:#111827;
    classDef control fill:#ffedd5,stroke:#ea580c,color:#111827;
    class A,B,D,E,F,G,J,L public;
    class K internal;
    class C,H,I control;
```

À valider : formulaire, pièces éventuelles, protection anti-abus, consentements et traitement administratif.
