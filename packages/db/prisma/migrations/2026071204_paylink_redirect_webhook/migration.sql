-- Migration : liens de paiement intégrés (redirection + webhook signé).
--
-- Additif, idempotent : trois colonnes optionnelles sur DigitalProduct.
--  - redirectUrl   : URL de retour après paiement (site du vendeur)
--  - webhookUrl    : URL notifiée (POST signé HMAC) à chaque vente du lien
--  - webhookSecret : clé de signature du webhook

ALTER TABLE "DigitalProduct" ADD COLUMN IF NOT EXISTS "redirectUrl" TEXT;
ALTER TABLE "DigitalProduct" ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT;
ALTER TABLE "DigitalProduct" ADD COLUMN IF NOT EXISTS "webhookSecret" TEXT;
