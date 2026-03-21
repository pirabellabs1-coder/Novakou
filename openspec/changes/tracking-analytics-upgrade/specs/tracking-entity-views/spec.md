## ADDED Requirements

### Requirement: Service pages SHALL track service_viewed with entityId
Chaque visite sur `/services/[slug]` MUST envoyer un event `service_viewed` avec `entityType: "service"` et `entityId` correspondant au service. L'event n'est envoye qu'une seule fois par session par service.

#### Scenario: Service view tracked
- **WHEN** un visiteur arrive sur `/services/web-design`
- **THEN** un event `service_viewed` est envoye avec `entityId: serviceId`

#### Scenario: No duplicate per session
- **WHEN** le meme visiteur revisite `/services/web-design` dans la meme session
- **THEN** aucun nouvel event `service_viewed` n'est envoye

### Requirement: Formation pages SHALL track formation_viewed
Chaque visite sur une page de formation MUST envoyer un event `formation_viewed` avec `entityId`.

#### Scenario: Formation view tracked
- **WHEN** un visiteur arrive sur `/formations/[slug]`
- **THEN** un event `formation_viewed` est envoye avec `entityId: formationId`

### Requirement: Profile pages SHALL track profile_viewed
Chaque visite sur `/freelances/[username]` MUST envoyer un event `profile_viewed` avec `entityId`.

#### Scenario: Profile view tracked
- **WHEN** un visiteur arrive sur `/freelances/john-doe`
- **THEN** un event `profile_viewed` est envoye avec `entityId: userId`
