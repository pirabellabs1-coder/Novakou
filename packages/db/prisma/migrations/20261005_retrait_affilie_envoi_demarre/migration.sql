-- Marqueur « envoi de versement commencé » sur les retraits affiliés (idempotent).
-- Empêche toute relance automatique d'un versement coupé en plein vol : sans lui,
-- cron/auto-payout renvoyait l'argent avec une nouvelle référence fournisseur.
ALTER TABLE "AffiliateWithdrawal" ADD COLUMN IF NOT EXISTS "envoiDemarreLe" TIMESTAMP(3);
