-- Table PaymentGateway : passerelles de paiement branchées depuis l'admin.
-- Idempotent et CIBLÉ : on ne touche qu'à cette table, jamais au reste du
-- schéma (la base est partagée et porte de la dérive préexistante — un
-- `prisma db push` global appliquerait cette dérive par accident).

CREATE TABLE IF NOT EXISTS "PaymentGateway" (
  "id"              TEXT         NOT NULL,
  "provider"        TEXT         NOT NULL,
  "label"           TEXT         NOT NULL,
  "credentials"     TEXT,
  "canCollect"      BOOLEAN      NOT NULL DEFAULT false,
  "canPayout"       BOOLEAN      NOT NULL DEFAULT false,
  "isActive"        BOOLEAN      NOT NULL DEFAULT false,
  "priority"        INTEGER      NOT NULL DEFAULT 100,
  "isSandbox"       BOOLEAN      NOT NULL DEFAULT false,
  "lastTestAt"      TIMESTAMP(3),
  "lastTestOk"      BOOLEAN,
  "lastTestMessage" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentGateway_provider_key"
  ON "PaymentGateway" ("provider");

CREATE INDEX IF NOT EXISTS "PaymentGateway_isActive_priority_idx"
  ON "PaymentGateway" ("isActive", "priority");
