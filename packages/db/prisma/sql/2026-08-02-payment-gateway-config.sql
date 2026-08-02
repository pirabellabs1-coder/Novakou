-- Ajoute la « recette d'intégration » aux passerelles de paiement.
-- C'est elle qui rend le système générique : décrire une nouvelle passerelle
-- depuis l'admin, sans écrire ni déployer de code.
--
-- Idempotent et ciblé (base partagée avec de la dérive préexistante : pas de
-- `prisma db push` global).

ALTER TABLE "PaymentGateway"
  ADD COLUMN IF NOT EXISTS "config" JSONB;
