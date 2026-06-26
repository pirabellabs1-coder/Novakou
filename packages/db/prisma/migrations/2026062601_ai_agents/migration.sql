-- Agents IA autonomes : AiAgent, AgentRun, AgentAction. Idempotent.

CREATE TABLE IF NOT EXISTS "AiAgent" (
  "id"          TEXT NOT NULL,
  "key"         TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "enabled"     BOOLEAN NOT NULL DEFAULT false,
  "autonomy"    TEXT NOT NULL DEFAULT 'mixed',
  "config"      JSONB,
  "lastRunAt"   TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentRun" (
  "id"             TEXT NOT NULL,
  "agentKey"       TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'ok',
  "summary"        TEXT,
  "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
  "actionsCreated" INTEGER NOT NULL DEFAULT 0,
  "tokensUsed"     INTEGER NOT NULL DEFAULT 0,
  "error"          TEXT,
  "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"     TIMESTAMP(3),
  CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentAction" (
  "id"         TEXT NOT NULL,
  "agentKey"   TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'proposed',
  "risk"       TEXT NOT NULL DEFAULT 'sensitive',
  "title"      TEXT NOT NULL,
  "reasoning"  TEXT,
  "targetType" TEXT,
  "targetId"   TEXT,
  "payload"    JSONB,
  "result"     JSONB,
  "decidedBy"  TEXT,
  "decidedAt"  TIMESTAMP(3),
  "executedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AiAgent_key_key" ON "AiAgent"("key");
CREATE INDEX IF NOT EXISTS "AiAgent_enabled_idx" ON "AiAgent"("enabled");
CREATE INDEX IF NOT EXISTS "AgentRun_agentKey_startedAt_idx" ON "AgentRun"("agentKey", "startedAt");
CREATE INDEX IF NOT EXISTS "AgentAction_agentKey_status_idx" ON "AgentAction"("agentKey", "status");
CREATE INDEX IF NOT EXISTS "AgentAction_status_createdAt_idx" ON "AgentAction"("status", "createdAt");

DO $$ BEGIN
  ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_agentKey_fkey"
    FOREIGN KEY ("agentKey") REFERENCES "AiAgent"("key") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_agentKey_fkey"
    FOREIGN KEY ("agentKey") REFERENCES "AiAgent"("key") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
