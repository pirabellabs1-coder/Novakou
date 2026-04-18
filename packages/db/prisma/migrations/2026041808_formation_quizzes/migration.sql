-- Formation : quiz multi-choix auto-corrigé + tentatives
CREATE TABLE IF NOT EXISTS "FormationQuiz" (
    "id"          TEXT PRIMARY KEY,
    "formationId" TEXT UNIQUE NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "passPct"     INTEGER NOT NULL DEFAULT 70,
    "questions"   JSONB NOT NULL,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormationQuiz_formationId_fkey"
        FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "FormationQuiz_formationId_idx"
    ON "FormationQuiz" ("formationId");

CREATE TABLE IF NOT EXISTS "QuizAttempt" (
    "id"        TEXT PRIMARY KEY,
    "quizId"    TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "scorePct"  INTEGER NOT NULL,
    "passed"    BOOLEAN NOT NULL DEFAULT false,
    "answers"   JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizAttempt_quizId_fkey"
        FOREIGN KEY ("quizId") REFERENCES "FormationQuiz"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuizAttempt_quizId_userId_createdAt_idx"
    ON "QuizAttempt" ("quizId", "userId", "createdAt");
CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_idx"
    ON "QuizAttempt" ("userId");
