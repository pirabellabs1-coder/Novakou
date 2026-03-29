## MODIFIED Requirements

### Requirement: Dispute status values are lowercase in API responses
The dispute API SHALL return status values in lowercase (`ouvert`, `en_examen`, `resolu`, `annule`) regardless of the Prisma enum casing used internally.

#### Scenario: GET /api/admin/disputes returns lowercase status
- **WHEN** the admin fetches the disputes list
- **THEN** each dispute object SHALL have `status` in lowercase (e.g., `"ouvert"` not `"OUVERT"`)

#### Scenario: Frontend filters work with lowercase status
- **WHEN** the admin clicks the "Ouverts" tab on the litiges page
- **THEN** disputes with `status === "ouvert"` SHALL be displayed

#### Scenario: Dispute stats compute correctly
- **WHEN** the litiges page computes stats from the disputes array
- **THEN** `disputes.filter(d => d.status === "ouvert").length` SHALL return the correct count

### Requirement: Partial verdict includes partialPercent parameter
The `resolveDispute` store function SHALL forward the `partialPercent` value to the API when the verdict is `partiel`.

#### Scenario: Admin adjusts partial percentage slider
- **WHEN** the admin moves the partial percentage slider to 70% and submits the verdict
- **THEN** the API call SHALL include `partialPercent: 70` in the request body
- **AND** the dispute SHALL be resolved with 70% refund to client and 30% (minus commission) to freelance

#### Scenario: Default partial percentage
- **WHEN** the admin submits a partial verdict without adjusting the slider
- **THEN** the API call SHALL include `partialPercent: 50` (default value)

### Requirement: Dispute verdict values are lowercase in API responses
The dispute API SHALL return verdict values in lowercase (`freelance`, `client`, `partiel`, `annulation`) in the GET response.

#### Scenario: Resolved dispute shows verdict
- **WHEN** the admin views a resolved dispute
- **THEN** the verdict field SHALL be lowercase (e.g., `"freelance"` not `"FREELANCE"`)
