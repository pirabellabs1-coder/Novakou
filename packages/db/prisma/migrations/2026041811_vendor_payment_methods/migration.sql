-- Vendeur : méthodes de paiement acceptées (pour les clients qui achètent)
-- + méthodes de retrait (où le vendeur reçoit son argent)

ALTER TABLE "InstructeurProfile"
    ADD COLUMN IF NOT EXISTS "acceptedPaymentMethods" TEXT[]
        DEFAULT ARRAY['orange_money','wave','mtn_momo','moov_money','card']::TEXT[],
    ADD COLUMN IF NOT EXISTS "payoutMethods" JSONB;
