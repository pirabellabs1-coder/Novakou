# Tasks: Fix Admin Role + Visibility

## P0 — Le role check bloque TOUT l'espace admin

- [x] 1. ROLE FIX GLOBAL: Dans lib/auth/config.ts, normaliser le role en lowercase dans le JWT callback: `token.role = ((user.role as string) ?? "client").toLowerCase()` — corrige les 40+ routes admin d'un coup
- [x] 2. ROLE FIX SAFETY: Dans api/admin/services/route.ts et api/admin/services/[id]/route.ts, ajouter aussi le check `|| role === "ADMIN"` comme filet de sécurité (au cas où un token existant n'a pas encore été rafraîchi)
- [x] 3. ROLE FIX SAFETY: Toutes les 48 routes admin fixées — `role !== "admin"` → `!["admin", "ADMIN"].includes(role)` en backup

## P1 — Données manquantes dans les réponses admin

- [x] 4. DISPUTES: reason et clientArgument déjà dans la réponse API — étendu AdminDispute interface dans store avec orderId, reason, clientArgument, freelanceArgument, verdict, verdictNote, partialPercent, resolvedAt
- [x] 5. KYC: Dans api/admin/kyc/route.ts GET branche Prisma, ajouté metadata avec toutes les URLs documents (front, back, selfie, registration, representative) + submissionType dans la réponse queue
- [x] 6. KYC STORE: Étendu AdminKycRequest avec 8 nouveaux champs (documentType, documentSubmitted, submissionType, submittedAt, nextLevelLabel, metadata avec toutes les URLs) + mis à jour syncKyc mapping

## P2 — Notifications et confirmations croisées

- [x] 7. NOTIFICATION LITIGE: Notification freelance améliorée — inclut le motif du litige dans le message + lien contextuel correct
- [x] 8. CLIENT LITIGE STATUS: Vérifié — syncOrders() déjà appelé après openDispute() dans client store (ligne 660) — le statut "litige" apparaît immédiatement
