## Purpose

Garantir que les services publiés par freelances et agences suivent le flux complet : création (EN_ATTENTE) → modération admin → marketplace publique (ACTIF). Corriger les désalignements de statuts entre dev mode et production.

## Requirements

- R1: Service creation API SHALL save status as `EN_ATTENTE` in both dev and production modes
- R2: Admin services API SHALL return services with Prisma-compatible uppercase statuses
- R3: Admin approve action SHALL update service status to `ACTIF`
- R4: Admin refuse action SHALL update service status to `REFUSE`
- R5: Public services API SHALL filter by `status === "ACTIF"` in dev mode (matching Prisma enum)
- R6: Dev store service statuses SHALL use uppercase values matching Prisma ServiceStatus enum
- R7: Admin moderation page tabs SHALL filter using uppercase status values

## Scenarios

### Scénario 1 : Freelance publie un service
1. Le freelance remplit le wizard de création (8 étapes)
2. Clique "Publier"
3. L'API POST `/api/services` crée le service avec `status: "EN_ATTENTE"`
4. Le freelance voit le service dans sa liste avec statut "En attente de modération"

### Scénario 2 : Admin modère le service
1. L'admin ouvre `/admin/services`
2. L'onglet "En attente" affiche le service du freelance
3. L'admin clique "Approuver"
4. Le statut passe à `ACTIF`
5. Le service apparaît dans la marketplace publique `/explorer`

### Scénario 3 : Service visible publiquement
1. Un visiteur ouvre `/explorer`
2. L'API GET `/api/public/services` retourne les services avec `status === "ACTIF"`
3. Le service approuvé est affiché dans la grille
