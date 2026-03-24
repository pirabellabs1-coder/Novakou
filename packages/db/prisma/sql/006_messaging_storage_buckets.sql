-- 006 — Buckets Supabase Storage pour la messagerie et les fichiers
-- Appliquer via Supabase SQL Editor

-- ============================================================
-- Creer les buckets prives pour la messagerie
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('message-attachments', 'message-attachments', false, 26214400, -- 25MB
    ARRAY[
      -- Images
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      -- Documents
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      -- Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      -- Audio (messages vocaux)
      'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/m4a',
      -- Video
      'video/mp4', 'video/webm', 'video/quicktime'
    ]),
  ('kyc-documents', 'kyc-documents', false, 10485760, -- 10MB
    ARRAY['image/png', 'image/jpeg', 'application/pdf']),
  ('order-deliveries', 'order-deliveries', false, 104857600, -- 100MB
    ARRAY[
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      'application/pdf', 'application/zip', 'application/x-rar-compressed',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/mp4',
      'text/plain'
    ]),
  ('agency-resources', 'agency-resources', false, 104857600, -- 100MB
    ARRAY[
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      'application/pdf', 'application/zip',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/webm',
      'text/plain'
    ]),
  ('contracts', 'contracts', false, 10485760, -- 10MB
    ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Policies : message-attachments
-- Le service_role (backend) uploade — pas de RLS necessaire pour INSERT.
-- Les participants a la conversation peuvent lire via signed URLs.
-- ============================================================

-- Tout utilisateur authentifie peut lire (les signed URLs controlent l'acces)
CREATE POLICY "authenticated_read_message_attachments" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'message-attachments'
    AND auth.uid() IS NOT NULL
  );

-- Service role gere les uploads (pas besoin de policy INSERT — service_role bypass RLS)

-- Admin acces total
CREATE POLICY "admin_all_message_attachments" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'message-attachments'
    AND EXISTS (
      SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================
-- Policies : kyc-documents
-- ============================================================

CREATE POLICY "own_read_kyc_documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "admin_all_kyc_documents" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'kyc-documents'
    AND EXISTS (
      SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================
-- Policies : order-deliveries
-- ============================================================

CREATE POLICY "own_read_order_deliveries" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'order-deliveries'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "admin_all_order_deliveries" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'order-deliveries'
    AND EXISTS (
      SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================
-- Policies : contracts
-- ============================================================

CREATE POLICY "own_read_contracts" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "admin_all_contracts" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'contracts'
    AND EXISTS (
      SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'admin'
    )
  );
