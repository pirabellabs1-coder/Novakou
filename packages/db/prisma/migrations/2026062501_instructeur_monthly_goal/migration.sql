-- Objectif de revenu mensuel fixé par le vendeur (FCFA). Nullable = défaut auto.
ALTER TABLE "InstructeurProfile" ADD COLUMN IF NOT EXISTS "monthlyGoal" INTEGER;
