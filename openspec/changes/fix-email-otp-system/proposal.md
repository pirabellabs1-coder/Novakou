## Why

Les emails transactionnels et les codes OTP de FreelanceHigh ne fonctionnent pas en production. Le domaine `noreply@freelancehigh.com` n'est pas vérifié dans Resend (0 domaines configurés), ce qui fait que tous les emails échouent. Le fallback `onboarding@resend.dev` est un sandbox qui n'envoie qu'au propriétaire du compte Resend. Sur l'historique Resend du compte, un seul email "Hello World" a été envoyé — aucun OTP, aucun email de bienvenue, aucune notification n'a jamais atteint un utilisateur réel. Cela bloque complètement l'inscription (OTP impossible) et toute l'expérience utilisateur.

## What Changes

### Configuration Resend — Domaine vérifié
- Ajouter le domaine `freelancehigh.com` dans Resend via l'API et guider la configuration DNS
- Utiliser un domaine de fallback fonctionnel (`resend.dev`) correctement en attendant la vérification
- Modifier le `sendEmail()` pour utiliser `onboarding@resend.dev` comme FROM par défaut tant que le domaine custom n'est pas vérifié (pas en fallback, en principal)

### OTP — Fonctionnel en production
- S'assurer que le code OTP est bien envoyé par email après inscription
- Ajouter un endpoint de diagnostic `/api/admin/email-test` pour tester l'envoi d'emails
- Afficher le code OTP dans l'UI en mode développement pour faciliter les tests
- Stocker les OTP en base de données (table `otp_codes`) au lieu de la mémoire pour survivre aux redéploiements Vercel

### Emails de bienvenue — Tous les cas couverts
- Email de bienvenue après inscription par email/mot de passe (déjà codé, vérifier que ça fonctionne)
- Email de bienvenue après connexion Google OAuth (première connexion uniquement)
- Email de bienvenue après connexion LinkedIn OAuth
- Email de bienvenue après inscription sur la partie formations (apprenant/instructeur)

### Notifications email manquantes — Connexion complète
- Ajouter l'envoi réel d'emails dans les routes qui créent des commandes, des messages, des livraisons, etc.
- Vérifier que chaque `sendXxxEmail()` du fichier `lib/email/index.ts` est bien appelé au bon endroit dans les API routes
- Ajouter les emails manquants : nouveau service publié, KYC approuvé/refusé, rappel de délai

### Monitoring emails
- Logger les succès/échecs d'envoi dans la console serveur avec contexte
- Ajouter un compteur d'emails envoyés dans le dashboard admin

## Capabilities

### New Capabilities
- `email-delivery-fix`: Correction de l'infrastructure d'envoi d'emails (domaine Resend, fallback fonctionnel, OTP en DB, diagnostic)
- `email-notifications-complete`: Tous les emails transactionnels connectés aux bonnes actions (inscription, commande, message, livraison, KYC, OAuth)

### Modified Capabilities
- (Aucun spec existant directement impacté)

## Impact

### Version cible
- **MVP** — Critique, les emails sont le fondement de l'inscription et de l'expérience utilisateur.

### Impact sur les autres rôles
- **Tous les rôles** (Freelance, Client, Agence) : inscription OTP, emails de bienvenue, notifications
- **Admin** : endpoint de diagnostic email, monitoring

### Impact sur le schéma Prisma
- Nouvelle table `OtpCode` (email, code, expiresAt, attempts, createdAt) pour remplacer le stockage en mémoire
- Pas d'autres changements de schéma

### Templates email existants
- 6 templates dans `lib/email/index.ts` : bienvenue, OTP, mot de passe oublié, commande, message, paiement
- Templates formations dans `lib/email/formations.ts`
- Tous fonctionnels mais jamais envoyés à cause du domaine non vérifié

### Pas de job BullMQ nécessaire pour le MVP (envoi synchrone acceptable). À passer en BullMQ pour V1.
