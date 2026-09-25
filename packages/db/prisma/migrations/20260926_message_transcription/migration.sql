-- Texte des messages vocaux. La route de transcription l'écrivait déjà sans
-- que la colonne existe : chaque transcription (payée à Whisper) échouait
-- au moment de l'enregistrer.
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "transcription" TEXT;
