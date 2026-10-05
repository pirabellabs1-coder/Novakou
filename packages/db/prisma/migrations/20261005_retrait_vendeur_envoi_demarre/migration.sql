-- Marqueur « envoi de versement commencé » sur les retraits vendeurs/mentors (idempotent).
-- Même règle que AffiliateWithdrawal : un envoi coupé en plein vol n'est jamais relancé
-- automatiquement (risque de double paiement), l'admin tranche.
ALTER TABLE "InstructorWithdrawal" ADD COLUMN IF NOT EXISTS "envoiDemarreLe" TIMESTAMP(3);
