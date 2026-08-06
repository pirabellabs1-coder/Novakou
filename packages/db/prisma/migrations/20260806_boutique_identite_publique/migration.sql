-- Identité PUBLIQUE de la boutique : remplace le profil personnel du vendeur.
-- Purement ADDITIF (colonnes nullables + un booléen à défaut faux) : aucune
-- donnée existante n'est touchée, aucune contrainte n'est resserrée.
ALTER TABLE "VendorShop"
  ADD COLUMN IF NOT EXISTS "contactEmail"    TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp"        TEXT,
  ADD COLUMN IF NOT EXISTS "websiteUrl"      TEXT,
  ADD COLUMN IF NOT EXISTS "socialFacebook"  TEXT,
  ADD COLUMN IF NOT EXISTS "socialInstagram" TEXT,
  ADD COLUMN IF NOT EXISTS "socialLinkedin"  TEXT,
  ADD COLUMN IF NOT EXISTS "socialYoutube"   TEXT,
  ADD COLUMN IF NOT EXISTS "showSalesCount"  BOOLEAN NOT NULL DEFAULT false;
