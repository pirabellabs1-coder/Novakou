## Purpose

Garantir que les projets publiés par les clients apparaissent immédiatement sur la page publique `/offres-projets` visible par tous les visiteurs, freelances et agences. Corriger le désalignement de statut entre le formulaire client (`"actif"`) et le filtre API publique (`"ouvert"`).

## Requirements

- R1: Client project creation form SHALL save published projects with `status: "ouvert"`
- R2: Client project creation form SHALL save draft projects with `status: "brouillon"`
- R3: Client store project type SHALL use `"ouvert" | "pourvu" | "ferme" | "brouillon"` as status values
- R4: Public projects API SHALL filter by `status === "ouvert"` to display active projects
- R5: Projects API POST SHALL accept and store the correct status values
- R6: Published projects SHALL appear immediately on `/offres-projets` without admin moderation

## Scenarios

### Scénario 1 : Client publie un projet
1. Le client remplit le formulaire dans `/client/projets/nouveau`
2. Clique "Publier"
3. L'API POST `/api/projects` crée le projet avec `status: "ouvert"`
4. Le projet apparaît immédiatement dans la liste du client

### Scénario 2 : Projet visible publiquement
1. Un freelance visite `/offres-projets`
2. L'API GET `/api/public/projects` filtre par `status === "ouvert"`
3. Le projet du client est affiché avec son budget, sa deadline et ses compétences requises
4. Le freelance peut cliquer "Postuler"
