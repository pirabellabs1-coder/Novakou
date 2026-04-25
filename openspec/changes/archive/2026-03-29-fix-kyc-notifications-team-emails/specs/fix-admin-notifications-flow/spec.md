## ADDED Requirements

### Requirement: Admin notification send SHALL not crash on AdminNotificationLog
L'API POST `/api/admin/notifications/send` MUST gerer le cas ou `prisma.adminNotificationLog` n'est pas disponible sans crasher. Le log d'historique est optionnel — l'envoi des notifications doit reussir meme si le log echoue.

#### Scenario: Notification sent successfully with log
- **WHEN** l'admin envoie une notification et AdminNotificationLog est disponible
- **THEN** les notifications in-app sont creees ET le log est enregistre ET l'API retourne `{ success: true, count }`

#### Scenario: Notification sent without log crash
- **WHEN** l'admin envoie une notification et AdminNotificationLog n'est pas disponible (table pas migree)
- **THEN** les notifications in-app sont quand meme creees ET l'API retourne `{ success: true, count }` avec un warning

### Requirement: Admin notification history SHALL be loaded from API
La page admin notifications MUST charger l'historique des notifications envoyees depuis un endpoint GET, pas depuis le state local React. L'historique MUST persister entre les recharges de page.

#### Scenario: Notification history loaded on page visit
- **WHEN** l'admin visite la page notifications
- **THEN** l'historique est charge depuis GET `/api/admin/notifications/history` et affiche dans le tableau

#### Scenario: New notification appears in history after send
- **WHEN** l'admin envoie une nouvelle notification
- **THEN** l'entree apparait immediatement dans le tableau d'historique sans rechargement de page

### Requirement: Admin notification response SHALL include success status clearly
L'API MUST retourner un statut clair que le frontend peut interpreter sans ambiguite. Le store Zustand MUST typer correctement la reponse.

#### Scenario: Successful send shows success toast
- **WHEN** l'admin envoie une notification et l'API retourne `{ success: true, count: 50 }`
- **THEN** l'interface affiche un toast vert "50 notification(s) envoyee(s)"

#### Scenario: Partial failure shows warning toast
- **WHEN** l'admin envoie via email et 3 emails sur 50 echouent
- **THEN** l'interface affiche un toast orange "50 notifications envoyees — 3 emails echoues"
