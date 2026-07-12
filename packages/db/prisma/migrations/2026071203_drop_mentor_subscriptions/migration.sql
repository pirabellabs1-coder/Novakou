-- Migration : suppression des tables d'abonnement mentor jamais branchées.
--
-- MentorSubscriptionPlan / MentorSubscription n'avaient aucune route, UI, cron
-- ni relation dans le code — retirés du schéma le 2026-07-12. Le mentorat vivant
-- repose sur MentorBooking (séances ponctuelles). On drope l'enfant avant le
-- parent (FK). Idempotent.

DROP TABLE IF EXISTS "MentorSubscription";
DROP TABLE IF EXISTS "MentorSubscriptionPlan";
