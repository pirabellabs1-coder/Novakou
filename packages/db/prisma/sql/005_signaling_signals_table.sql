-- 005 — Table ephemere pour le signaling WebRTC (appels audio/video)
-- Les signaux sont temporaires (TTL 60s), nettoyes a chaque requete.
-- Appliquer via Supabase SQL Editor OU psql.

CREATE TABLE IF NOT EXISTS "signaling_signals" (
  "id"         SERIAL PRIMARY KEY,
  "type"       VARCHAR(32) NOT NULL,        -- offer | answer | ice-candidate | hangup | reject
  "from_user"  VARCHAR(255) NOT NULL,
  "to_user"    VARCHAR(255) NOT NULL,
  "payload"    JSONB NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour les polls rapides (GET /api/signaling?userId=xxx)
CREATE INDEX IF NOT EXISTS idx_signaling_to_user
  ON "signaling_signals" ("to_user", "id");

-- Index pour le nettoyage TTL
CREATE INDEX IF NOT EXISTS idx_signaling_created_at
  ON "signaling_signals" ("created_at");
