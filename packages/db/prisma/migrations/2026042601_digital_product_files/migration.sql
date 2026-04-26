-- DigitalProductFile — fichiers attachés à un produit digital (multi-files)

CREATE TABLE IF NOT EXISTS "DigitalProductFile" (
  "id"              TEXT PRIMARY KEY,
  "productId"       TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "url"             TEXT NOT NULL,
  "storagePath"     TEXT,
  "size"            INTEGER,
  "mimeType"        TEXT,
  "order"           INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DigitalProductFile_productId_fkey" FOREIGN KEY ("productId")
    REFERENCES "DigitalProduct"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "DigitalProductFile_productId_order_idx"
  ON "DigitalProductFile"("productId", "order");

-- Backfill : pour les produits qui ont déjà un fileUrl, créer une ligne
-- DigitalProductFile correspondante pour ne pas perdre la donnée existante.
INSERT INTO "DigitalProductFile" ("id", "productId", "name", "url", "storagePath", "size", "mimeType", "order", "createdAt")
SELECT
  'dpf_' || substring(md5(random()::text || clock_timestamp()::text), 1, 24) AS id,
  p."id",
  COALESCE(NULLIF(regexp_replace(p."fileUrl", '^.*/([^/?]+)(\?.*)?$', '\1'), ''), 'fichier') AS name,
  p."fileUrl",
  p."fileStoragePath",
  p."fileSize",
  p."fileMimeType",
  0,
  p."createdAt"
FROM "DigitalProduct" p
WHERE p."fileUrl" IS NOT NULL
  AND p."fileUrl" <> '';
