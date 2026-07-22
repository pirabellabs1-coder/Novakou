-- Historique des slugs : permet de repondre 301 au lieu de 404 quand une
-- boutique / un produit / une formation est renomme.
-- Additif uniquement (CREATE ... IF NOT EXISTS) : aucune donnee existante touchee.
CREATE TABLE IF NOT EXISTS "SlugHistory" (
  "id"        TEXT NOT NULL,
  "entity"    TEXT NOT NULL,
  "oldSlug"   TEXT NOT NULL,
  "newSlug"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SlugHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SlugHistory_entity_oldSlug_key"
  ON "SlugHistory" ("entity", "oldSlug");

CREATE INDEX IF NOT EXISTS "SlugHistory_entity_oldSlug_idx"
  ON "SlugHistory" ("entity", "oldSlug");
