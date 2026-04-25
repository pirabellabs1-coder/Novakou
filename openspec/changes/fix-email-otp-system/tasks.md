## 1. Fix Resend — Adresse FROM fonctionnelle

- [x] 1.1 Modifier `lib/email/index.ts` : utiliser `onboarding@resend.dev` comme FROM par défaut, et le domaine custom uniquement si `RESEND_DOMAIN_VERIFIED=true`
- [x] 1.2 Ajouter `RESEND_DOMAIN_VERIFIED=false` dans `.env.local` et `.env.example`
- [x] 1.3 Tester l'envoi d'un email réel via le code modifié (curl ou script)
- [x] 1.4 Créer un script/guide `scripts/setup-resend-domain.ts` pour ajouter le domaine `freelancehigh.com` via l'API Resend et afficher les enregistrements DNS à configurer

## 2. OTP en base de données

- [x] 2.1 Ajouter le modèle `OtpCode` dans `schema.prisma` (id, email unique, code, expiresAt, attempts, createdAt)
- [x] 2.2 Modifier `lib/auth/otp.ts` : remplacer le `Map` en mémoire par des opérations Prisma (storeOTP, verifyOTP, deleteExpiredOTPs)
- [x] 2.3 Mettre à jour `/api/auth/verify-email` (POST et PUT) pour utiliser les nouvelles fonctions OTP basées sur Prisma
- [x] 2.4 Mettre à jour `/api/auth/register` pour utiliser le nouveau storeOTP basé sur Prisma
- [x] 2.5 Ajouter un nettoyage périodique des OTP expirés (cron ou à chaque requête)

## 3. Emails de bienvenue — Tous les cas

- [x] 3.1 Vérifier que `sendWelcomeEmail` est bien appelé dans `/api/auth/register` pour les inscriptions credentials (déjà fait, valider)
- [x] 3.2 Vérifier que `sendWelcomeEmail` est bien appelé dans le callback `signIn` de NextAuth pour Google OAuth (déjà fait, valider)
- [x] 3.3 Vérifier que `sendWelcomeEmail` est bien appelé pour LinkedIn OAuth (même callback, valider)
- [x] 3.4 Vérifier le flux formations inscription (`/api/auth/register` avec formationsRole) : email bienvenue + OTP envoyés
- [x] 3.5 S'assurer qu'aucun email de bienvenue n'est envoyé lors d'une reconnexion (vérifier le flag `isNewUser` dans le callback OAuth)

## 4. Connexion des emails transactionnels aux actions

- [x] 4.1 Auditer et connecter l'email de confirmation de commande dans les routes de création de commande (freelance + formations)
- [x] 4.2 Auditer et connecter l'email de notification de nouveau message dans les routes de messagerie
- [x] 4.3 Auditer et connecter l'email de notification de livraison dans les routes de livraison de commande
- [x] 4.4 Auditer et connecter l'email de paiement reçu dans les routes de libération de fonds escrow
- [x] 4.5 Ajouter un email `sendKycApprovedEmail` et `sendKycRejectedEmail` dans `lib/email/index.ts`
- [x] 4.6 Connecter les emails KYC dans les routes admin KYC
- [x] 4.7 Ajouter un email `sendServiceApprovedEmail` et `sendServiceRejectedEmail` dans `lib/email/index.ts`
- [x] 4.8 Connecter les emails de modération de service dans les routes admin
- [x] 4.9 Ajouter un email `sendNewOrderFreelanceEmail` (notification au freelance quand il reçoit une commande)

## 5. Endpoint diagnostic admin

- [x] 5.1 Créer `POST /api/admin/email-test` : envoie un email de test à une adresse spécifiée, accessible uniquement aux admins
- [x] 5.2 Ajouter un bouton "Tester l'envoi d'email" dans le dashboard admin (ou page paramètres admin)

## 6. Vérification et tests

- [ ] 6.1 Tester le flux complet : inscription → OTP reçu par email → vérification → bienvenue reçu
- [ ] 6.2 Tester le flux Google OAuth : première connexion → bienvenue reçu
- [ ] 6.3 Vérifier que le build TypeScript passe (`pnpm build`)
