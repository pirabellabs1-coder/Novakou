## 1. Schema Prisma — Champs KYC manquants

- [x] 1.1 Ajouter `firstName String?`, `lastName String?`, `city String?`, `address String?`, `dateOfBirth DateTime?` au modele User dans schema.prisma
- [x] 1.2 Regenerer le client Prisma — champs firstName, lastName, city, address, dateOfBirth reconnus
- [x] 1.3 GET et PATCH `/api/kyc/route.ts` fonctionneront maintenant car les champs existent dans le schema

## 2. Emails — Unifier et corriger

- [x] 2.1 Exporte sendEmail, emailLayout, button, getAppUrl depuis lib/email/index.ts
- [x] 2.2 admin-emails.ts reecrit — importe et utilise sendEmail de lib/email au lieu de dupliquer
- [x] 2.3 Supprime placeholder "re_placeholder" — throw Error si pas de cle API au lieu de silencieusement echouer

## 3. Notifications admin — Corriger le flux

- [x] 3.1 AdminNotificationLog.create wrappe dans try-catch — ne crashe plus si table pas migree
- [x] 3.2 Cree GET /api/admin/notifications/history — retourne logs depuis AdminNotificationLog avec fallback vide
- [x] 3.3 Type sendNotification corrige dans store : { success, count, failedEmails, message }
- [x] 3.4 Page notifications : charge historique depuis API au montage, toast success/warning/error correct, titre "Historique des envois"

## 4. Equipe admin — Corriger l'ajout

- [x] 4.1 POST /api/admin/team await l'email + retourne emailSent/emailError dans la reponse
- [x] 4.2 Page equipe : toast success/error apres invitation + import useToastStore
- [x] 4.3 syncTeam() appele dans inviteMember (store) ET dans handleInvite (page) — membre apparait immediatement

## 5. Tests & Verification

- [x] 5.1 KYC : champs firstName/lastName/city/address/dateOfBirth ajoutés au schema — Prisma régénéré
- [x] 5.2 Notifications : crash AdminNotificationLog corrigé (try-catch), historique charge depuis API, toast correct
- [x] 5.3 Équipe : toast success/error, syncTeam apres invite, email awaited
- [x] 5.4 Emails : admin-emails réutilise sendEmail de lib/email, placeholder supprimé, erreurs propagées
