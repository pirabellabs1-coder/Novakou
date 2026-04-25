## ADDED Requirements

### Requirement: Le certificat PDF DOIT avoir un design professionnel premium
Le certificat téléchargeable DOIT être visuellement attrayant avec un design premium incluant : bordures décoratives, logo de la plateforme, nom de l'apprenant en grande typographie, titre de la formation, date de complétion, score obtenu, numéro de certificat unique, nom de l'instructeur, et mention "FreelanceHigh Formations".

#### Scenario: Téléchargement d'un certificat avec le nouveau design
- **WHEN** un apprenant télécharge son certificat après complétion d'une formation
- **THEN** le PDF DOIT contenir : un en-tête avec le logo FreelanceHigh Formations, un titre "CERTIFICAT DE RÉUSSITE", le nom complet de l'apprenant en typographie large, le titre de la formation, la date de complétion formatée, le score obtenu, le nom de l'instructeur, le numéro unique du certificat, et un pied de page avec l'URL de vérification

### Requirement: Le certificat DOIT inclure un QR code de vérification
Le certificat PDF DOIT inclure un QR code qui, une fois scanné, redirige vers la page de vérification du certificat à l'URL `freelancehigh.com/formations/verification/[code]`.

#### Scenario: QR code de vérification sur le certificat
- **WHEN** le certificat est généré
- **THEN** un QR code DOIT être présent dans le coin inférieur droit, encodant l'URL de vérification complète du certificat

### Requirement: Le format du code certificat DOIT être standardisé
Tous les certificats DOIVENT utiliser le format `FH-XXXX-XXXX-XXXX` (3 segments de 4 caractères alphanumériques sans ambiguïté) comme identifiant unique.

#### Scenario: Génération d'un nouveau code certificat
- **WHEN** un certificat est créé dans la base de données
- **THEN** le code DOIT suivre le format `FH-XXXX-XXXX-XXXX` avec des caractères parmi `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sans 0, O, 1, I pour éviter la confusion)

#### Scenario: Consolidation des fonctions de génération
- **WHEN** le code de génération de certificat est exécuté
- **THEN** une seule fonction `generateCertificateCode()` DOIT être utilisée dans tout le codebase (supprimer le doublon dans prisma-helpers.ts)

### Requirement: Le certificat DOIT être bilingue
Le certificat DOIT supporter le français et l'anglais, avec la langue déterminée par la préférence de l'apprenant ou la langue principale de la formation.

#### Scenario: Certificat en français
- **WHEN** un apprenant francophone télécharge son certificat
- **THEN** tous les textes DOIVENT être en français : "CERTIFICAT DE RÉUSSITE", "Décerné à", "Pour avoir complété avec succès", "Score obtenu", "Date de délivrance"

#### Scenario: Certificat en anglais
- **WHEN** un apprenant anglophone télécharge son certificat
- **THEN** tous les textes DOIVENT être en anglais : "CERTIFICATE OF COMPLETION", "Awarded to", "For successfully completing", "Score achieved", "Date of issue"
