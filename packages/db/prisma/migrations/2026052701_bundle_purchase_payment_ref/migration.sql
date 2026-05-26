-- Migration : ProductBundlePurchase — ajout paymentRef + provider + status + refundedAt
-- Bureau Novakou session 4 (P1 Marcus / Karim).
--
-- Pourquoi :
--   Avant, l'idempotence du webhook bundle reposait sur findFirst({bundleId,userId}).
--   Si un user achète, est remboursé, puis rachète plus tard → blocage faux-positif
--   (le findFirst trouve la première ligne et skip le 2e achat légitime).
--   On ajoute :
--     - paymentRef : ref provider (paymentId Moneroo / reference PayGenius) UNIQUE
--                    pour idempotence vraie sur retry webhook
--     - provider   : "moneroo" | "paygenius" | "stripe" | "gift"
--     - status     : "PAID" | "REFUNDED" | "CANCELLED"
--     - refundedAt : timestamp du refund (NULL = actif)
--
-- Sûr en prod : pre-check 0 row (cf. scripts/inspect-bundle-purchases.mjs).
-- Pour des DB avec rows existantes, paymentRef reste NULL → l'unique partial
-- index accepte autant de NULL qu'on veut (Postgres standard).

ALTER TABLE "ProductBundlePurchase"
  ADD COLUMN IF NOT EXISTS "paymentRef" TEXT,
  ADD COLUMN IF NOT EXISTS "provider"   TEXT,
  ADD COLUMN IF NOT EXISTS "status"     TEXT NOT NULL DEFAULT 'PAID',
  ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);

-- Unique partial : un même paymentRef ne peut être consommé qu'une fois.
-- NULL ne déclenche pas la contrainte (Postgres standard) — backfill possible
-- ultérieurement sans casser les rows historiques.
CREATE UNIQUE INDEX IF NOT EXISTS "ProductBundlePurchase_paymentRef_unique"
  ON "ProductBundlePurchase" ("paymentRef")
  WHERE "paymentRef" IS NOT NULL;

-- Index simple pour les lookups par paymentRef côté webhook
CREATE INDEX IF NOT EXISTS "ProductBundlePurchase_paymentRef_idx"
  ON "ProductBundlePurchase" ("paymentRef");
