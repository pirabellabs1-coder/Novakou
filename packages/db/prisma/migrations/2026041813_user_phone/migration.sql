-- User.phone : numéro de téléphone (stocké tel que saisi par l'utilisateur).
ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "phone" TEXT;
