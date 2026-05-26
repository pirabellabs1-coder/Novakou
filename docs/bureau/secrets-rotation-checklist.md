# Checklist rotation secrets prod — Novakou

> **Action Lissanon avant ouverture publique** (blocker Henrik #1, session 3 / vote 27).
> Le bureau ne peut pas pousser à ta place dans les dashboards tiers ni dans Vercel.

---

## ✅ Déjà fait (par le bureau)

- [x] `.env.local` dédoublonné (19 lignes redondantes retirées). Backup automatique `.env.local.bak-2026-05-26T18-54-28` gitignoré.
- [x] Script `scripts/dedupe-env.mjs` réutilisable.

---

## 🔑 NEXTAUTH_SECRET — valeur fraîche à copier dans Vercel

**Action** : pousse cette valeur dans Vercel → Settings → Environment Variables → `NEXTAUTH_SECRET` (production). Ne touche PAS ton `.env.local` actuel pour ne pas casser ta session dev — change-le seulement le jour J de l'ouverture publique.

```
NEXTAUTH_SECRET=5mGCMi+AdM5f0Rqc34+gVaJvy9C8hk2DHRCJFJki2EA=
```

Effet : invalide toutes les sessions en cours (chaque user devra se reconnecter une fois). Acceptable pour un lancement.

---

## 🔑 Secrets tiers à rotater dans LEURS dashboards (je ne peux pas y accéder)

### Moneroo
1. Connecte-toi à dashboard.moneroo.io.
2. **Settings → Webhooks** → générer un nouveau secret de signature.
3. Copie la nouvelle valeur dans Vercel → `MONEROO_WEBHOOK_SECRET`.
4. Garde l'ancien webhook actif pendant 5-10 min (le temps que Vercel redéploie), puis supprime-le côté Moneroo.

### PayGenius
1. dashboard.paygenius — section API.
2. Régénère le webhook secret + l'API key si elle date.
3. Copie dans Vercel : `PAYGENIUS_WEBHOOK_SECRET`, `PAYGENIUS_API_SECRET` (et `PAYGENIUS_API_KEY` si rotatée).
4. Redéploie Vercel pour activer.

### Stripe (international)
1. dashboard.stripe.com → Developers → Webhooks.
2. Sur l'endpoint Novakou prod, "Roll signing secret".
3. Copie dans Vercel : `STRIPE_WEBHOOK_SECRET`.
4. La clé secrète Stripe (`STRIPE_SECRET_KEY`) — si jamais commitée par accident, la rotater aussi via "Roll key".

### Resend (transactional email)
1. resend.com → API Keys.
2. "Create new API key" puis révoque l'ancienne après confirmation de l'envoi du prochain email.
3. Copie dans Vercel : `RESEND_API_KEY`.

### Supabase (service role + DB)
1. supabase.com → Project Settings → API.
2. Si la `service_role` key a été exposée : "Reset service role" (génère une nouvelle key, l'ancienne devient invalide).
3. Copie dans Vercel : `SUPABASE_SERVICE_ROLE_KEY`.
4. `DATABASE_URL` / `DIRECT_URL` — uniquement à rotater si le password Postgres a été exposé (Database → Settings → Reset password).

---

## 🧪 Test post-rotation (5 min)

Une fois tout poussé sur Vercel et redéployé :
1. Visiter https://novakou.com → 200, navigation OK.
2. Essayer un mini-achat sandbox sur Moneroo → webhook arrive, fulfillment crée enrollment.
3. Vérifier qu'un email de confirmation est envoyé via Resend.
4. Se connecter → reconnexion forcée (NEXTAUTH_SECRET nouveau).

Si KO : restaurer les anciennes valeurs dans Vercel (gardes les copiées quelque part avant rotation) + redéployer.

---

## 🚨 Règle d'or

Ne committe **jamais** les valeurs ci-dessus dans Git. Si elles fuitent (ex : copier-collé dans un ticket public), rotater à nouveau immédiatement.

---

## ✅ Sentry sourcemap upload (déjà câblé)

- `next.config.ts` enveloppe maintenant la config dans `withSentryConfig` (org, project, authToken lus depuis env, no-op silencieux si absents).
- À ajouter sur Vercel (Production + Preview) :
  - `SENTRY_ORG` (le slug de ton org Sentry — ex : `novakou`)
  - `SENTRY_PROJECT` (le slug du projet — ex : `novakou-web`)
  - `SENTRY_AUTH_TOKEN` (créer un token "Project Source Map Upload" sur sentry.io → Settings → Auth Tokens, scope `project:releases` + `project:write`)
- Au prochain `vercel build`, les sourcemaps seront uploadées → stack traces lisibles en prod.

## ✅ Migration PlatformRevenue unique partial (déjà appliquée)

- Fichier : `packages/db/prisma/migrations/2026052601_platform_revenue_unique/migration.sql`
- Index créé sur la DB Supabase (`PlatformRevenue_orderId_orderType_unique_positive`), vérifié via `pg_indexes`.
- Empêche définitivement le double-comptage de commission sur retry webhook.
