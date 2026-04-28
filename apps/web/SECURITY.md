# Novakou — Security Notes & Migration Plans

This document tracks known security debt that affects production data and the
plan to remediate it. Each entry has an owner, a target version, and a
step-by-step migration so the work can be picked up later without re-discovery.

---

## 1. `User.twoFactorSecret` — encrypt at rest

### Status

**Open — MVP debt.** The TOTP secret used to derive 2FA codes is currently
stored in plain text in the `User.twoFactorSecret` column (see
`packages/db/prisma/schema.prisma`).

### Threat

If the production database is leaked (backup theft, SQL injection, rogue DBA,
compromised read replica), an attacker can:

1. Read every `twoFactorSecret`.
2. Generate valid TOTP codes for any 2FA-enabled user.
3. Bypass the second factor entirely on the next login.

This effectively reduces 2FA to a no-op for any user whose secret was in a
leaked dump. The application secret (`NEXTAUTH_SECRET`) is unrelated and does
not protect this column.

### Why it was deferred

Encrypting in place requires:

- Picking and provisioning a key (KMS or env-injected secret).
- Migrating every existing `twoFactorSecret` row to the encrypted form.
- Deploying read/write code paths that understand both formats during the
  rollout window.

This was out of scope for the MVP cut. The TODO comment in `schema.prisma`
points here so the next maintainer doesn't miss it.

### Migration plan

Two recommended options. Pick one and follow the rollout below.

#### Option A — Application-level encryption (libsodium)

- Library: `libsodium-wrappers` (or `@noble/ciphers` for a smaller bundle).
- Algorithm: XChaCha20-Poly1305, per-row random 24-byte nonce.
- Key: 32-byte secret stored in `TFA_SECRET_ENCRYPTION_KEY` env var (base64),
  rotated via a key-id prefix on the ciphertext.
- Storage format: `v1:<base64-nonce>:<base64-ciphertext>`.

Pros: no infra dependency, easy to test, easy to rotate via key-id prefix.
Cons: key lives in env vars — losing it bricks every 2FA user.

#### Option B — `@prisma/client-extension-encrypt` (or equivalent)

- Wrap Prisma client with the extension; declare `twoFactorSecret` as an
  encrypted field in the extension config.
- Key management identical to Option A (env var or KMS).

Pros: transparent encrypt/decrypt; no scattered call sites.
Cons: extension version coupling; less control over format.

### Rollout (zero-downtime)

1. **Add the new column.**
   - Add `twoFactorSecretEnc String?` to `User` in `schema.prisma`.
   - Run `pnpm --filter=db migrate:dev` then deploy the migration to prod.
2. **Dual-write phase.**
   - Update every write site (2FA enrollment, secret regeneration) to write
     the new encrypted column **and** keep the old plain column populated.
   - Update every read site (TOTP verification in `apps/web/lib/auth/*`) to
     prefer `twoFactorSecretEnc` and fall back to `twoFactorSecret`.
3. **Backfill.**
   - One-shot script: read each user where `twoFactorEnabled = true` and
     `twoFactorSecretEnc IS NULL`, encrypt the existing secret, write it to
     the new column. Run in batches with progress logging.
4. **Switch reads.**
   - Drop the fallback to `twoFactorSecret`; reads now require the encrypted
     column.
5. **Stop dual-write.**
   - Stop populating the plain column on new enrollments.
6. **Retire the old column.**
   - Add a Prisma migration that nulls `twoFactorSecret` for all rows, then
     drops the column entirely. Verify with `pnpm --filter=db studio`.
7. **Rotate the encryption key once** to prove the rotation path before
   declaring done.

### Acceptance criteria

- [ ] `twoFactorSecret` no longer exists in the schema.
- [ ] All TOTP verifications go through the encrypted field.
- [ ] A leaked DB dump does not yield usable TOTP secrets without the key.
- [ ] Key rotation has been exercised in staging at least once.

### Owner / target

- Owner: TBD
- Target: V1 (post-MVP), before public 2FA enrollment is opened to all roles.

---

## Logging changes

When a security debt item is closed, move it to a `## Resolved` section at the
bottom of this file with the commit SHA and date so the audit trail survives.
