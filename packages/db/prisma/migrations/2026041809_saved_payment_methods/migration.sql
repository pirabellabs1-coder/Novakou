-- Méthodes de paiement sauvegardées (1-click checkout)
CREATE TABLE IF NOT EXISTS "SavedPaymentMethod" (
    "id"        TEXT PRIMARY KEY,
    "userId"    TEXT NOT NULL,
    "provider"  TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "brand"     TEXT,
    "last4"     TEXT,
    "expMonth"  INTEGER,
    "expYear"   INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SavedPaymentMethod_userId_isDefault_idx"
    ON "SavedPaymentMethod" ("userId", "isDefault");
