-- KYC — identité DÉCLARÉE par la personne au moment de la soumission.
--
-- L'agent de vérification autonome (lib/agents/impl/kyc-verification.ts) doit
-- pouvoir comparer ce qu'il LIT sur la pièce à ce qui a été DÉCLARÉ à la
-- soumission — le nom du COMPTE (User.name) peut être un pseudo, ces
-- champs-ci, non : ils sont annoncés comme « ce qui est écrit sur ma pièce ».
--
-- Colonnes NULLABLES : les demandes déjà déposées restent valides telles
-- quelles. L'obligation s'applique aux nouvelles soumissions, côté applicatif.
ALTER TABLE "KycRequest" ADD COLUMN IF NOT EXISTS "nomLegal" TEXT;
ALTER TABLE "KycRequest" ADD COLUMN IF NOT EXISTS "prenomLegal" TEXT;
ALTER TABLE "KycRequest" ADD COLUMN IF NOT EXISTS "dateNaissance" TIMESTAMP(3);
ALTER TABLE "KycRequest" ADD COLUMN IF NOT EXISTS "numeroDocument" TEXT;
