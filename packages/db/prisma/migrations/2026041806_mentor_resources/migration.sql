-- Mentor : bibliothèque de ressources + partages
CREATE TABLE IF NOT EXISTS "MentorResource" (
    "id"          TEXT PRIMARY KEY,
    "mentorId"    TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "kind"        TEXT NOT NULL,
    "url"         TEXT NOT NULL,
    "fileSize"    INTEGER,
    "tags"        TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublic"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "MentorResource_mentorId_createdAt_idx"
    ON "MentorResource" ("mentorId", "createdAt");
CREATE INDEX IF NOT EXISTS "MentorResource_mentorId_isPublic_idx"
    ON "MentorResource" ("mentorId", "isPublic");

CREATE TABLE IF NOT EXISTS "MentorResourceShare" (
    "id"         TEXT PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "bookingId"  TEXT,
    "studentId"  TEXT NOT NULL,
    "sharedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt"   TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "MentorResourceShare_studentId_sharedAt_idx"
    ON "MentorResourceShare" ("studentId", "sharedAt");
CREATE INDEX IF NOT EXISTS "MentorResourceShare_bookingId_idx"
    ON "MentorResourceShare" ("bookingId");
CREATE INDEX IF NOT EXISTS "MentorResourceShare_resourceId_idx"
    ON "MentorResourceShare" ("resourceId");
