-- Migration : ajoute Snapchat et Pinterest aux types de pixels marketing.
-- Additif, idempotent. NB : ALTER TYPE ... ADD VALUE ne peut pas tourner dans
-- une transaction — prisma db execute exécute le script sans transaction.

ALTER TYPE "PixelType" ADD VALUE IF NOT EXISTS 'SNAPCHAT';
ALTER TYPE "PixelType" ADD VALUE IF NOT EXISTS 'PINTEREST';
