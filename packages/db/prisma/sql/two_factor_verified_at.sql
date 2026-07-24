-- Preuve serveur à usage unique du 2FA (anti-contournement du verrou tfaPending).
-- Additif : colonne nullable, aucune donnée existante touchée.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorVerifiedAt" TIMESTAMP(3);
