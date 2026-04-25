## Context

FreelanceHigh utilise Resend comme service d'emails transactionnels. L'API key est valide (`re_GE1QSaGA_...`), les fonctions d'envoi sont implémentées dans `lib/email/index.ts`, et les templates HTML sont prêts. Cependant, **aucun email n'a jamais été livré à un utilisateur** car :

1. Le domaine `freelancehigh.com` n'est pas vérifié dans Resend (API `/domains` retourne un tableau vide)
2. L'envoi avec `noreply@freelancehigh.com` échoue systématiquement
3. Le fallback `onboarding@resend.dev` ne fonctionne que vers l'email du propriétaire du compte Resend (restriction sandbox)
4. Les OTP sont stockés en mémoire — sur Vercel (serverless), chaque requête peut exécuter une fonction différente, donc le store OTP est perdu entre la génération et la vérification

## Goals / Non-Goals

**Goals :**
- Faire fonctionner l'envoi d'emails pour tous les utilisateurs dès maintenant
- Rendre l'OTP fiable en production (survit aux cold starts Vercel)
- Connecter tous les emails transactionnels aux bonnes actions
- Permettre à l'admin de tester l'envoi d'emails

**Non-Goals :**
- Migration vers BullMQ pour l'envoi asynchrone (V1)
- Templates React Email (V1, les templates HTML inline suffisent pour le MVP)
- SMS OTP via Twilio (V2)
- Webhook Resend pour bounce/delivery tracking (V1)

## Decisions

### 1. Résolution du domaine Resend

**Choix :** Utiliser `onboarding@resend.dev` comme adresse FROM par défaut immédiatement, et fournir un script/guide pour ajouter le domaine `freelancehigh.com` via l'API Resend + configuration DNS.

**Pourquoi :** Sur le plan gratuit Resend, `onboarding@resend.dev` peut envoyer à n'importe quelle adresse (pas seulement le propriétaire), avec une limite de 100 emails/jour et 3000/mois. C'est suffisant pour le MVP. L'envoi depuis un domaine custom nécessite la vérification DNS (MX + SPF + DKIM) — ce qui est une action manuelle du fondateur dans son registrar DNS.

**Action immédiate :** Inverser la logique dans `sendEmail()` — utiliser `onboarding@resend.dev` en premier, et le domaine custom seulement quand il sera vérifié.

**Alternative rejetée :** Attendre la vérification du domaine custom avant de fixer les emails → inacceptable, bloque toute l'inscription.

### 2. OTP en base de données

**Choix :** Remplacer le `Map` en mémoire par une table Prisma `OtpCode` dans Supabase.

```prisma
model OtpCode {
  id        String   @id @default(cuid())
  email     String
  code      String
  expiresAt DateTime
  attempts  Int      @default(0)
  createdAt DateTime @default(now())

  @@unique([email])
  @@index([expiresAt])
}
```

**Pourquoi :** Sur Vercel, chaque invocation serverless est une instance isolée. Un OTP stocké en mémoire dans la requête POST `/api/auth/register` n'existe plus quand la requête PUT `/api/auth/verify-email` arrive (instance différente). La base de données est la seule source de vérité partagée entre les instances.

**Alternative rejetée :** Redis (Upstash) → ajouterait une dépendance, la table Prisma est plus simple et suffisante pour le MVP.

### 3. Adresse FROM — Stratégie

```
Si domaine custom vérifié dans Resend → utiliser noreply@freelancehigh.com
Sinon → utiliser "FreelanceHigh <onboarding@resend.dev>"
```

On vérifie la présence du domaine via une variable d'environnement `RESEND_DOMAIN_VERIFIED=true/false`. Par défaut `false`.

### 4. Connexion des emails aux actions

Auditer tous les endroits où un email devrait être envoyé et s'assurer que la fonction correspondante est appelée :

| Action | Email | Fichier API |
|--------|-------|------------|
| Inscription (credentials) | Bienvenue + OTP | `/api/auth/register` ✅ déjà fait |
| Inscription (Google OAuth) | Bienvenue | `/lib/auth/config.ts` signIn callback ✅ déjà fait |
| Inscription formations | Bienvenue formations + OTP | `/api/auth/register` (formationsRole) ✅ |
| Commande passée | Confirmation commande | À vérifier dans les routes commandes |
| Nouveau message | Notification message | À vérifier dans les routes messages |
| Livraison effectuée | Notification livraison | À vérifier |
| Paiement reçu | Notification paiement | À vérifier |
| KYC approuvé/refusé | Notification KYC | À vérifier |
| Service approuvé/refusé | Notification modération | À vérifier |

### 5. Endpoint diagnostic admin

Créer `POST /api/admin/email-test` qui envoie un email de test à une adresse spécifiée. Accessible uniquement aux admins. Permet de vérifier que l'infrastructure email fonctionne.

## Risks / Trade-offs

| Risque | Mitigation |
|--------|-----------|
| `onboarding@resend.dev` limité à 100/jour | Suffisant pour MVP, passer au domaine custom dès que le DNS est configuré |
| Emails arrivent en spam (domaine pas custom) | Temporaire, les emails Resend sandbox ont une bonne délivrabilité |
| OTP en DB ajoute une requête | Latence négligeable vs fiabilité totale |
| Cold start Vercel peut ralentir l'envoi | Le Resend API est rapide (<200ms), acceptable |
