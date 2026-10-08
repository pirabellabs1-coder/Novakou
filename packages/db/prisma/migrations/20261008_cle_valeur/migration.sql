-- Table clé/valeur à expiration (compteurs anti-force-brute, jetons courts).
-- Idempotent. RLS activée comme sur toutes les tables ; Prisma (propriétaire) passe outre.
CREATE TABLE IF NOT EXISTS "CleValeur" (
  "cle" TEXT NOT NULL,
  "valeur" TEXT NOT NULL,
  "expireLe" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CleValeur_pkey" PRIMARY KEY ("cle")
);
CREATE INDEX IF NOT EXISTS "CleValeur_expireLe_idx" ON "CleValeur"("expireLe");
ALTER TABLE "CleValeur" ENABLE ROW LEVEL SECURITY;
