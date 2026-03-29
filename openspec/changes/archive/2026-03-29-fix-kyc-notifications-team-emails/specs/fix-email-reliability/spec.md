## ADDED Requirements

### Requirement: Admin email module SHALL reuse lib/email sendEmail function
Le module `lib/admin/admin-emails.ts` MUST importer et utiliser la fonction `sendEmail` exportee depuis `lib/email/index.ts` au lieu de dupliquer la logique Resend, le FROM address, et la gestion d'erreurs.

#### Scenario: Single source of truth for email sending
- **WHEN** un email admin est envoye (broadcast, suspension, invitation)
- **THEN** il passe par la meme fonction `sendEmail` de `lib/email/index.ts` qui gere le FROM address et la connexion Resend

### Requirement: Email errors SHALL be propagated to caller
Les fonctions email MUST retourner le statut d'envoi reel. Si l'envoi echoue, l'erreur MUST etre retournee a l'appelant, pas avalee silencieusement.

#### Scenario: Email failure is visible
- **WHEN** l'envoi via Resend echoue (cle invalide, domaine non verifie, erreur reseau)
- **THEN** la fonction retourne `{ data: null, error: "message d'erreur" }` et l'appelant peut afficher l'erreur

#### Scenario: No API key returns clear error
- **WHEN** `RESEND_API_KEY` n'est pas configure
- **THEN** la fonction retourne un resultat clairement identifie comme "dev mode" et ne simule pas un succes reel
