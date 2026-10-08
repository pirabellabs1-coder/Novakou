-- ════════════════════════════════════════════════════════════════════════════
-- DURCISSEMENT : la base Novakou n'est PAS une API publique
-- ════════════════════════════════════════════════════════════════════════════
--
-- Supabase expose chaque table du schéma `public` via son API REST (PostgREST)
-- aux rôles `anon` et `authenticated`, et accorde PAR DÉFAUT tous les droits à
-- ces rôles sur toute nouvelle table. Novakou n'utilise pas cette API : tout
-- passe par Prisma (rôle `postgres`), et les fichiers vivent dans un autre
-- projet Supabase. Ces droits ne servent donc à rien — mais une table créée par
-- une future migration Prisma, qui n'active pas la sécurité par ligne (RLS),
-- serait lisible ET modifiable par quiconque détient la clé « anon ».
--
-- Audit du 2026-10-08 : 134 tables, toutes avec RLS (donc fermées), mais les
-- privilèges par défaut ouvraient la 135e. On retire les droits existants ET les
-- droits par défaut. Prisma, pg_cron (Bouclier) et l'application ne passent
-- pas par ces rôles : aucun impact fonctionnel.
--
-- Fichier IDEMPOTENT : rejouable tel quel. Appliquer avec
--   node node_modules/prisma/build/index.js db execute --file supabase/durcissement-api.sql --url "$DIRECT_URL"
-- ════════════════════════════════════════════════════════════════════════════

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
revoke usage on schema public from anon, authenticated;

-- Les tables à venir (migrations Prisma, créées par `postgres`) :
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
