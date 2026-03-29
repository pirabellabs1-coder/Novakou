## ADDED Requirements

### Requirement: Client can suspend a published project
The system SHALL allow a client to suspend (pause) a project that has status "ouvert" (open). Suspended projects SHALL NOT appear in the public project explorer.

#### Scenario: Client suspends an open project
- **WHEN** a client clicks "Suspendre" on an open project
- **THEN** the project status SHALL change to "suspendu" and the project SHALL no longer appear in public search results

#### Scenario: Client resumes a suspended project
- **WHEN** a client clicks "Reprendre" on a suspended project
- **THEN** the project status SHALL change back to "ouvert" and the project SHALL reappear in public search results

### Requirement: Suspend/Resume button in project list
The client projects page (`/client/projets`) SHALL display a "Suspendre" button for open projects and a "Reprendre" button for suspended projects, in addition to the existing delete action.

#### Scenario: Button visibility
- **WHEN** a project has status "ouvert"
- **THEN** the system SHALL show a "Suspendre" button
- **WHEN** a project has status "suspendu"
- **THEN** the system SHALL show a "Reprendre" button

### Requirement: API supports project status update
The API endpoint `PATCH /api/projects/[id]` SHALL accept a `status` field with values "ouvert" or "suspendu" to toggle project visibility.

#### Scenario: PATCH with suspend status
- **WHEN** a PATCH request is sent with `{ status: "suspendu" }` for an open project owned by the authenticated client
- **THEN** the API SHALL return 200 with the updated project
- **WHEN** a PATCH request is sent for a project NOT owned by the authenticated client
- **THEN** the API SHALL return 403 Forbidden
