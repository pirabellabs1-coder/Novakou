-- Borne de révocation des sessions (idempotent) : toute session ouverte avant
-- cet instant est invalidée au prochain rafraîchissement du jeton (≤ 5 min).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionsRevoquesLe" TIMESTAMP(3);
