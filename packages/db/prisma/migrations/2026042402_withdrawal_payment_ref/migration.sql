-- Add payment reference and provider fields to InstructorWithdrawal
-- so we can track Moneroo payout IDs and know which provider processed each withdrawal.
--
-- paymentRef       : Moneroo payout id (returned by /payouts/initialize)
-- paymentProvider  : "moneroo" | "manual" (manual = admin a fait le virement à la main)
-- errorMessage     : en cas d'échec (status=REFUSE), message technique de Moneroo

ALTER TABLE "InstructorWithdrawal"
  ADD COLUMN IF NOT EXISTS "paymentRef" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;

CREATE INDEX IF NOT EXISTS "InstructorWithdrawal_paymentRef_idx" ON "InstructorWithdrawal"("paymentRef");
