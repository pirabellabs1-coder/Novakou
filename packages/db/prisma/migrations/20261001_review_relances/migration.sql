-- Suivi des relances « laissez un avis » (idempotent, sûr à rejouer).
ALTER TABLE "DigitalProductPurchase" ADD COLUMN IF NOT EXISTS "reviewAskedAt" TIMESTAMP(3);
ALTER TABLE "DigitalProductPurchase" ADD COLUMN IF NOT EXISTS "reviewReminderAt" TIMESTAMP(3);
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "reviewAskedAt" TIMESTAMP(3);
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "reviewReminderAt" TIMESTAMP(3);
