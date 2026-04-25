## ADDED Requirements

### Requirement: Instructor SHALL reorder sections via drag-and-drop
Le wizard de création/modification de formation DOIT permettre à l'instructeur de réorganiser les sections par glisser-déposer vertical. L'ordre DOIT être persisté en base de données immédiatement.

#### Scenario: Réorganisation réussie des sections
- **WHEN** l'instructeur glisse une section vers une nouvelle position dans la liste des sections
- **THEN** la liste se réorganise visuellement en temps réel et l'ordre est sauvegardé via l'API de réordonnancement

#### Scenario: Persistance de l'ordre après rechargement
- **WHEN** l'instructeur recharge la page après avoir réorganisé les sections
- **THEN** les sections apparaissent dans le nouvel ordre sauvegardé

### Requirement: Instructor SHALL reorder lessons within a section via drag-and-drop
Le wizard de création/modification de formation DOIT permettre à l'instructeur de réorganiser les leçons à l'intérieur d'une section par glisser-déposer vertical.

#### Scenario: Réorganisation réussie des leçons
- **WHEN** l'instructeur glisse une leçon vers une nouvelle position dans sa section
- **THEN** la liste des leçons se réorganise visuellement et l'ordre est persisté en base de données

#### Scenario: Les leçons restent dans leur section
- **WHEN** l'instructeur tente de déplacer une leçon
- **THEN** la leçon ne peut être déplacée que dans sa section d'origine (pas de cross-section drag)

### Requirement: System SHALL provide a reorder API endpoint
Le système DOIT exposer un endpoint `PATCH /api/instructeur/formations/[id]/reorder` qui accepte la structure complète des ordres sections + leçons et met à jour les champs `order` en batch.

#### Scenario: Appel API de réordonnancement
- **WHEN** le frontend envoie un PATCH avec `{ sections: [{ id, order, lessons: [{ id, order }] }] }`
- **THEN** le système met à jour tous les champs `order` des sections et leçons en une transaction atomique

#### Scenario: Vérification d'autorisation
- **WHEN** un utilisateur non-propriétaire de la formation appelle l'endpoint
- **THEN** le système retourne une erreur 403
