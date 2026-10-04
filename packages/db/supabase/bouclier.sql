-- ════════════════════════════════════════════════════════════════════════════
-- BOUCLIER NOVAKOU — les tâches planifiées vivent dans la base, pas chez Vercel
-- ════════════════════════════════════════════════════════════════════════════
--
-- POURQUOI. Le plan Vercel gratuit (Hobby) refuse toute tâche plus fréquente
-- qu'une fois par jour, et chaque appel consomme des invocations et du temps
-- CPU plafonnés. Or nos tâches fréquentes (rattrapage des ventes, versements,
-- relances) tournent presque toujours À VIDE : mesuré le 2026-10-04, toutes
-- leurs files étaient vides, pour ~3 tentatives de paiement par jour. Les
-- appeler toutes les 5 ou 10 minutes revenait à payer ~30 000 réveils par mois
-- pour constater « rien à faire ».
--
-- COMMENT. pg_cron (planificateur intégré à Supabase) exécute ici un PORTIER :
-- une requête SQL qui pose, en base, la même question que la route Vercel
-- (« y a-t-il du travail ? »). Vercel n'est réveillé — par pg_net, avec
-- `Authorization: Bearer <CRON_SECRET>` comme l'exigeait Vercel — QUE si la
-- réponse est oui. Les tâches quotidiennes, elles, partent sans condition.
--
-- RÈGLE D'OR. Un portier ne doit JAMAIS être plus strict que la route : s'il
-- oublie un cas, ce travail n'est plus jamais fait (une vente payée non livrée,
-- un versement jamais lancé). Chaque condition ci-dessous recopie le `where` de
-- la route citée ; toute modification de l'une impose de relire l'autre.
-- Les portiers des files qui peuvent stagner (anciennes tentatives, retraits
-- anciens) sont ESPACÉS au lieu d'être supprimés : rien n'est abandonné.
--
-- Le secret n'est PAS dans ce fichier : il est dans le coffre Supabase (Vault)
-- sous le nom `novakou_cron_secret`, posé par `scripts/appliquer-bouclier.mjs`.
--
-- Fichier IDEMPOTENT : on le rejoue tel quel après toute modification.
-- Hors Prisma volontairement : pg_cron n'existe pas dans la base fantôme de
-- `migrate dev`, et le schéma `bouclier` n'est pas déclaré dans schema.prisma,
-- donc Prisma ne le voit ni ne le touche.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create schema if not exists bouclier;
-- Jamais exposé à l'API publique Supabase (anon / authenticated).
revoke all on schema bouclier from public, anon, authenticated;

-- ── Journal des réveils ─────────────────────────────────────────────────────
-- Une ligne par appel réellement envoyé à Vercel. Les passages « rien à faire »
-- ne laissent aucune trace ici (pg_cron les garde dans cron.job_run_details).
create table if not exists bouclier.reveil (
  id         bigserial primary key,
  chemin     text        not null,
  motif      text        not null,
  requete_id bigint,
  statut     int,          -- code HTTP rapatrié par le job nk-bilan
  erreur     text,
  le         timestamptz not null default now()
);
create index if not exists reveil_le_idx on bouclier.reveil (le);
revoke all on bouclier.reveil from public, anon, authenticated;

create or replace function bouclier.base_url() returns text
language sql immutable as $$ select 'https://www.novakou.com' $$;

-- Réveille une route de Vercel. Asynchrone : pg_net met la requête en file et
-- rend la main aussitôt — un passage de pg_cron dure quelques millisecondes,
-- quelle que soit la durée de la route appelée.
create or replace function bouclier.reveiller(chemin text, motif text default 'planifie', delai_ms int default 60000)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
  rid    bigint;
begin
  select decrypted_secret into secret
    from vault.decrypted_secrets
   where name = 'novakou_cron_secret';
  if secret is null then
    raise exception 'bouclier : secret novakou_cron_secret absent du coffre Supabase';
  end if;

  select net.http_get(
           url                  := bouclier.base_url() || chemin,
           headers              := jsonb_build_object('Authorization', 'Bearer ' || secret),
           timeout_milliseconds := delai_ms
         ) into rid;

  insert into bouclier.reveil (chemin, motif, requete_id) values (chemin, motif, rid);
  return rid;
end
$$;
revoke all on function bouclier.reveiller(text, text, int) from public, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- PORTIERS — chacun recopie le `where` de la route qu'il garde
-- ════════════════════════════════════════════════════════════════════════════

-- app/api/cron/collect-reconcile : tentatives non conclues interrogeables.
-- `recentes` = fenêtre rapide de 48 h ; au-delà, rattrapage espacé (horaire).
create or replace function bouclier.encaissements_ouverts(recentes boolean) returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (
    select 1 from public."CheckoutAttempt"
     where status in ('STARTED', 'ABANDONED')
       and "providerRef" is not null
       and "failureCode" is distinct from 'verification_impossible'
       and (case when recentes then "createdAt" >= now() - interval '48 hours'
                 else "createdAt" <  now() - interval '48 hours' end)
  )
$$;

-- app/api/cron/alerte-ventes-bloquees : non conclues, âgées de 15 min à 72 h.
create or replace function bouclier.ventes_bloquees() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (
    select 1 from public."CheckoutAttempt"
     where status in ('STARTED', 'ABANDONED')
       and "providerRef" is not null
       and "createdAt" between now() - interval '72 hours' and now() - interval '15 minutes'
  )
$$;

-- app/api/cron/auto-payout : retraits jamais envoyés, passé le délai de grâce
-- (AUTO_PAYOUT_DELAY_MINUTES, 10 min par défaut). `recents` = moins de 2 h,
-- repris toutes les 10 min ; plus anciens (passerelle en panne, solde
-- insuffisant…) repris toutes les heures au lieu de marteler le fournisseur.
create or replace function bouclier.retraits_a_envoyer(recents boolean) returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  with r as (
    select "createdAt" c from public."InstructorWithdrawal"
     where status = 'EN_ATTENTE' and "paymentRef" is null
    union all
    select "createdAt" from public."AffiliateWithdrawal"
     where status = 'EN_ATTENTE' and "paymentRef" is null
  )
  select exists (
    select 1 from r
     where c <= now() - interval '10 minutes'
       and (case when recents then c >= now() - interval '2 hours'
                 else c <  now() - interval '2 hours' end)
  )
$$;

-- app/api/cron/payout-reconcile : versements envoyés, sans confirmation, de
-- moins de 14 jours. FeexPay est espacé par la route (lib/payout/cadence-sonde.ts :
-- chaque passage la 1re heure, puis à chaque début d'heure le 1er jour, puis
-- aux heures 1, 7, 13, 19 UTC) : on recopie ce palier, sinon on réveillerait
-- Vercel toutes les 10 min pendant 14 jours pour une route qui ne fait rien.
create or replace function bouclier.versements_a_verifier() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  with r as (
    select "paymentProvider" p, "createdAt" c from public."InstructorWithdrawal"
     where status = 'EN_ATTENTE' and "paymentRef" is not null
       and "paymentProvider" in ('feexpay', 'fedapay', 'pawapay')
       and "createdAt" >= now() - interval '14 days'
    union all
    select "paymentProvider", "createdAt" from public."AffiliateWithdrawal"
     where status = 'EN_ATTENTE' and "paymentRef" is not null
       and "paymentProvider" in ('feexpay', 'fedapay', 'pawapay')
       and "createdAt" >= now() - interval '14 days'
  )
  select exists (
    select 1 from r
     where p <> 'feexpay'
        or now() - c < interval '1 hour'
        or (extract(minute from now() at time zone 'utc') < 10
            and (now() - c < interval '24 hours'
                 or extract(hour from now() at time zone 'utc') in (1, 7, 13, 19)))
  )
$$;

-- app/api/cron/mentor-bookings-expire : réservations impayées depuis 2 h.
create or replace function bouclier.reservations_expirees() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (
    select 1 from public."MentorBooking"
     where status = 'PAYMENT_PENDING'
       and "createdAt" <= now() - interval '2 hours'
       and "paymentRef" is null and "paidAt" is null
       and "escrowStatus" = 'NONE'
  )
$$;

-- lib/marketing/automation-engine.ts (resumeScheduledRuns) : étapes échues.
create or replace function bouclier.automatisations_echues() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (
    select 1 from public."AutomationScheduledRun"
     where "processedAt" is null and "runAt" <= now()
  )
$$;

-- Agents KYC / fiches : un dossier ou une fiche EN_ATTENTE arrivé(e) depuis le
-- dernier passage de l'agent. Les dossiers déjà examinés et laissés à l'humain
-- ne réveillent plus Vercel toutes les 15 min (mesuré : ~5 réexamens par
-- passage, 5 s chacun, pour 17 décisions en 14 jours) ; le passage complet
-- toutes les 6 h les reprend quand même.
create or replace function bouclier.kyc_nouveaux() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (
    select 1 from public."KycRequest" k
     where k.status = 'EN_ATTENTE'
       and k."createdAt" > coalesce(
             (select "lastRunAt" from public."AiAgent" where key = 'kyc_verification'),
             '-infinity')
  )
$$;

create or replace function bouclier.fiches_nouvelles() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  with dernier as (
    select coalesce((select "lastRunAt" from public."AiAgent" where key = 'product_verification'),
                    '-infinity'::timestamp) t
  )
  select exists (select 1 from public."Formation", dernier
                  where status = 'EN_ATTENTE' and "updatedAt" > dernier.t)
      or exists (select 1 from public."DigitalProduct", dernier
                  where status = 'EN_ATTENTE' and "updatedAt" > dernier.t)
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- PLANNING (UTC, comme l'était vercel.json)
-- ════════════════════════════════════════════════════════════════════════════
do $$
declare
  t     record;
  noms  text[] := '{}';
begin
  for t in
    select * from (values
      -- ── Fréquentes, gardées par un portier ──────────────────────────────
      ('nk-collect-reconcile',          '*/5 * * * *',  $c$select bouclier.reveiller('/api/cron/collect-reconcile', 'travail') where bouclier.encaissements_ouverts(true)$c$),
      ('nk-collect-reconcile-anciennes','17 * * * *',   $c$select bouclier.reveiller('/api/cron/collect-reconcile', 'anciennes') where bouclier.encaissements_ouverts(false)$c$),
      ('nk-alerte-ventes-bloquees',     '*/15 * * * *', $c$select bouclier.reveiller('/api/cron/alerte-ventes-bloquees', 'travail') where bouclier.ventes_bloquees()$c$),
      ('nk-auto-payout',                '*/10 * * * *', $c$select bouclier.reveiller('/api/cron/auto-payout', 'travail') where bouclier.retraits_a_envoyer(true)$c$),
      ('nk-auto-payout-anciens',        '5 * * * *',    $c$select bouclier.reveiller('/api/cron/auto-payout', 'anciens') where bouclier.retraits_a_envoyer(false)$c$),
      ('nk-payout-reconcile',           '*/10 * * * *', $c$select bouclier.reveiller('/api/cron/payout-reconcile', 'travail') where bouclier.versements_a_verifier()$c$),
      ('nk-mentor-bookings-expire',     '*/15 * * * *', $c$select bouclier.reveiller('/api/cron/mentor-bookings-expire', 'travail') where bouclier.reservations_expirees()$c$),
      ('nk-automation-scheduled',       '*/15 * * * *', $c$select bouclier.reveiller('/api/cron/automation-scheduled', 'travail') where bouclier.automatisations_echues()$c$),
      ('nk-agent-kyc',                  '*/15 * * * *', $c$select bouclier.reveiller('/api/cron/agents?agent=kyc_verification', 'travail', 300000) where bouclier.kyc_nouveaux()$c$),
      ('nk-agent-fiches',               '*/15 * * * *', $c$select bouclier.reveiller('/api/cron/agents?agent=product_verification', 'travail', 300000) where bouclier.fiches_nouvelles()$c$),
      -- ── Sans condition ──────────────────────────────────────────────────
      ('nk-agents',                     '0 */6 * * *',  $c$select bouclier.reveiller('/api/cron/agents', 'planifie', 300000)$c$),
      -- Sonde de santé du trajet de versement : son rôle est justement de
      -- tourner quand il ne se passe rien.
      ('nk-sonde-versements',           '30 * * * *',   $c$select bouclier.reveiller('/api/cron/sonde-versements')$c$),
      -- Bloquée tant que novakou.com n'est pas réclamé par l'équipe Vercel :
      -- quotidienne en attendant (23 s d'appels à l'API Vercel par passage).
      ('nk-sous-domaines-boutiques',    '20 5 * * *',   $c$select bouclier.reveiller('/api/cron/sous-domaines-boutiques')$c$),
      ('nk-mentor-reminders',           '0 6 * * *',    $c$select bouclier.reveiller('/api/cron/mentor-reminders')$c$),
      ('nk-flash-promo-expiry',         '0 6 * * *',    $c$select bouclier.reveiller('/api/cron/flash-promo-expiry')$c$),
      ('nk-deadline-reminder',          '0 7 * * *',    $c$select bouclier.reveiller('/api/cron/deadline-reminder')$c$),
      ('nk-sequences-process',          '0 7 * * *',    $c$select bouclier.reveiller('/api/marketing/sequences/process')$c$),
      ('nk-cohort-status',              '0 8 * * *',    $c$select bouclier.reveiller('/api/cron/cohort-status')$c$),
      ('nk-abandoned-cart-check',       '0 8 * * *',    $c$select bouclier.reveiller('/api/cron/abandoned-cart-check')$c$),
      ('nk-lesson-start-reminder',      '0 9 * * *',    $c$select bouclier.reveiller('/api/cron/lesson-start-reminder')$c$),
      ('nk-subscription-reminder',      '0 9 * * *',    $c$select bouclier.reveiller('/api/cron/subscription-reminder')$c$),
      ('nk-qualite-fiches',             '0 9 * * *',    $c$select bouclier.reveiller('/api/cron/qualite-fiches')$c$),
      ('nk-churn-alert',                '0 10 * * *',   $c$select bouclier.reveiller('/api/cron/churn-alert')$c$),
      ('nk-review-request',             '0 10 * * *',   $c$select bouclier.reveiller('/api/cron/review-request')$c$),
      ('nk-abandoned-cart-email',       '0 11 * * *',   $c$select bouclier.reveiller('/api/cron/abandoned-cart-email')$c$),
      ('nk-abandon-stale-checkouts',    '0 11 * * *',   $c$select bouclier.reveiller('/api/cron/abandon-stale-checkouts')$c$),
      ('nk-send-abandon-reminders',     '0 12 * * *',   $c$select bouclier.reveiller('/api/cron/send-abandon-reminders')$c$),
      ('nk-mentor-escrow',              '0 14 * * *',   $c$select bouclier.reveiller('/api/cron/mentor-escrow')$c$),
      ('nk-weekly-vendor-recap',        '0 18 * * 0',   $c$select bouclier.reveiller('/api/cron/weekly-vendor-recap')$c$),
      ('nk-monthly-vendor-recap',       '0 9 1 * *',    $c$select bouclier.reveiller('/api/cron/monthly-vendor-recap')$c$),
      ('nk-subscription-renewal',       '0 3 * * *',    $c$select bouclier.reveiller('/api/cron/subscription-renewal')$c$),
      ('nk-subscription-expire',        '30 3 * * *',   $c$select bouclier.reveiller('/api/cron/subscription-expire')$c$),
      ('nk-approve-affiliate-comm',     '0 3 * * *',    $c$select bouclier.reveiller('/api/cron/approve-affiliate-commissions')$c$),
      ('nk-account-deletion-cooldown',  '0 2 * * *',    $c$select bouclier.reveiller('/api/cron/account-deletion-cooldown')$c$),
      ('nk-audit-livraisons',           '0 4 * * *',    $c$select bouclier.reveiller('/api/cron/audit-livraisons')$c$),
      ('nk-chiffrer-secrets-2fa',       '40 4 * * *',   $c$select bouclier.reveiller('/api/cron/chiffrer-secrets-2fa')$c$),
      -- `/api/cron/affiliate-payout` figurait dans vercel.json mais la route
      -- n'existe pas (404 à chaque passage) : non reprise.

      -- ── Entretien, 100 % en base (aucun appel à Vercel) ─────────────────
      -- Rapatrie le code HTTP de chaque réveil (pg_net ne garde ses réponses
      -- que 6 h) : c'est ce qui rend visible une route en échec.
      ('nk-bilan',                      '*/15 * * * *', $c$update bouclier.reveil r set statut = h.status_code, erreur = left(coalesce(h.error_msg, case when h.status_code >= 400 then h.content end), 300) from net._http_response h where h.id = r.requete_id and r.statut is null and r.erreur is null$c$),
      ('nk-purge',                      '50 2 * * *',   $c$delete from cron.job_run_details where end_time < now() - interval '7 days'; delete from bouclier.reveil where le < now() - interval '90 days'$c$)
    ) as v(nom, quand, commande)
  loop
    perform cron.schedule(t.nom, t.quand, t.commande);
    noms := noms || t.nom;
  end loop;

  -- Une tâche retirée de la liste ci-dessus est retirée du planificateur :
  -- le fichier reste la seule source de vérité.
  perform cron.unschedule(j.jobid)
     from cron.job j
    where j.jobname like 'nk-%' and not (j.jobname = any (noms));
end
$$;
