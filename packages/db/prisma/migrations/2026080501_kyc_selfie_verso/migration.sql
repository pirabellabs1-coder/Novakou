-- Vérification d'identité : exiger le VERSO de la pièce et une PHOTO DU VISAGE.
--
-- Le recto seul ne prouve rien : les informations de validité et le numéro
-- figurent souvent au dos, et une pièce trouvée ou empruntée suffisait à
-- passer sans photo du porteur.
--
-- Colonnes NULLABLES : les demandes déjà déposées restent valides telles
-- quelles. L'obligation s'applique aux nouvelles soumissions, côté applicatif.
ALTER TABLE "KycRequest" ADD COLUMN IF NOT EXISTS "documentVersoUrl" TEXT;
ALTER TABLE "KycRequest" ADD COLUMN IF NOT EXISTS "selfieUrl" TEXT;
