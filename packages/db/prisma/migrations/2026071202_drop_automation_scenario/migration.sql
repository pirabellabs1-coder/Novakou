-- Migration : suppression du système legacy AutomationScenario.
--
-- Ce système parallèle (CRUD via /api/automation + wrappers api-client) n'avait
-- AUCUN exécuteur ni UI active : il a été retiré du code le 2026-07-12, remplacé
-- par AutomationWorkflow (dashboard /vendeur/automatisations). On drope la table
-- orpheline. Idempotent.

DROP TABLE IF EXISTS "AutomationScenario";
