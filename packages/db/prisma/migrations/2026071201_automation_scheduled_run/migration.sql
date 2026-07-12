-- Migration : reprise différée des workflows après une action DELAY.
--
-- Additive et idempotente : ne touche aucune table existante, aucune FK
-- bloquante. Un cron (`/api/cron/automation-scheduled`) lit les lignes dont
-- `runAt` est atteint et `processedAt` est NULL, exécute les actions restantes,
-- puis marque `processedAt`. Sans file de jobs (BullMQ non déployé).

CREATE TABLE IF NOT EXISTS "AutomationScheduledRun" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "triggerType" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "remainingActions" JSONB NOT NULL,
  "results" JSONB NOT NULL,
  "runAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationScheduledRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AutomationScheduledRun_processedAt_runAt_idx"
  ON "AutomationScheduledRun"("processedAt", "runAt");
