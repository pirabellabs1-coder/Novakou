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
  -- Le Bearer ne doit partir QUE vers notre domaine : un chemin comme
  -- '@autre-hote.tld/' ferait de la base l'expéditrice du secret ailleurs.
  if chemin !~ '^/[^/@]' then
    raise exception 'bouclier : chemin refusé (%)', chemin;
  end if;

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

-- Réveille la route SI son portier dit qu'il y a du travail.
--
-- Un portier qui PLANTE (colonne renommée par une migration Prisma, valeur de
-- configuration illisible…) réveille QUAND MÊME : la route fait son propre
-- tri, on retombe sur le comportement d'avant le Bouclier au lieu d'arrêter
-- en silence la livraison des ventes. Le motif garde l'erreur, et
-- /api/cron/garde-conso alerte dessus.
create or replace function bouclier.reveiller_si(condition text, chemin text, motif text default 'travail', delai_ms int default 60000)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  ouvert boolean;
begin
  begin
    execute 'select ' || condition into ouvert;
  exception when others then
    return bouclier.reveiller(chemin, left('portier en erreur : ' || sqlerrm, 300), delai_ms);
  end;
  if ouvert then
    return bouclier.reveiller(chemin, motif, delai_ms);
  end if;
  return null;
end
$$;
revoke all on function bouclier.reveiller_si(text, text, text, int) from public, anon, authenticated;

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
-- (AUTO_PAYOUT_DELAY_MINUTES, absente sur Vercel au 2026-10-04 → 10 min ; à
-- reporter ici si on la pose). `recents` = moins de 2 h,
-- repris toutes les 10 min ; plus anciens (passerelle en panne, solde
-- insuffisant…) repris toutes les heures au lieu de marteler le fournisseur.
create or replace function bouclier.retraits_a_envoyer(recents boolean) returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  with r as (
    select "createdAt" c from public."InstructorWithdrawal"
     where status = 'EN_ATTENTE' and "paymentRef" is null and "envoiDemarreLe" is null
    union all
    select "createdAt" from public."AffiliateWithdrawal"
     where status = 'EN_ATTENTE' and "paymentRef" is null and "envoiDemarreLe" is null
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

-- ── Agents ──────────────────────────────────────────────────────────────────
-- INUTILISÉS depuis le 2026-10-06 : les agents IA ne passent plus que deux
-- fois par semaine (job nk-agents, plus bas), par décision de coût. Ces
-- portiers réveillaient chaque agent dès qu'un élément nouveau apparaissait ;
-- ils restent définis (et vérifiés par scripts/verifier-bouclier.mjs) pour
-- revenir à une cadence événementielle si le budget IA le permet.

-- Début du dernier passage TERMINÉ (AgentRun.startedAt) — pas lastRunAt, écrit
-- à la FIN : un dossier arrivé pendant un passage, après la lecture de l'agent,
-- serait sinon resté invisible jusqu'au passage complet. NULL si l'agent est
-- désactivé (recordRun ne fait alors rien : inutile de réveiller Vercel).
create or replace function bouclier.dernier_passage(cle text) returns timestamp
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select case
           when not exists (select 1 from public."AiAgent" where key = cle and not enabled)
           then coalesce((select max("startedAt") from public."AgentRun"
                           where "agentKey" = cle and "finishedAt" is not null),
                         '-infinity'::timestamp)
         end
$$;

-- lib/agents/impl/kyc-verification.ts : dossiers EN_ATTENTE.
create or replace function bouclier.kyc_nouveaux() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (
    select 1 from public."KycRequest"
     where status = 'EN_ATTENTE'
       and "createdAt" > bouclier.dernier_passage('kyc_verification')
  )
$$;

-- lib/agents/impl/product-verification.ts : formations et produits EN_ATTENTE.
create or replace function bouclier.fiches_nouvelles() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (select 1 from public."Formation"
                  where status = 'EN_ATTENTE' and "updatedAt" > bouclier.dernier_passage('product_verification'))
      or exists (select 1 from public."DigitalProduct"
                  where status = 'EN_ATTENTE' and "updatedAt" > bouclier.dernier_passage('product_verification'))
$$;

-- lib/agents/impl/fraud-detection.ts : un nouveau retrait. Vérifié toutes les
-- 5 min : l'agent doit passer AVANT le versement automatique (délai de grâce
-- de 10 min, cf. retraits_a_envoyer).
create or replace function bouclier.retraits_nouveaux() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (select 1 from public."InstructorWithdrawal"
                  where "createdAt" > bouclier.dernier_passage('fraud_detection'))
      or exists (select 1 from public."AffiliateWithdrawal"
                  where "createdAt" > bouclier.dernier_passage('fraud_detection'))
$$;

-- lib/agents/impl/dispute-resolution.ts : demandes de remboursement PENDING.
create or replace function bouclier.litiges_nouveaux() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (
    select 1 from public."RefundRequest"
     where status = 'PENDING'
       and "createdAt" > bouclier.dernier_passage('dispute_resolution')
  )
$$;

-- lib/agents/impl/account-deletion.ts : demandes AWAITING_REVIEW.
create or replace function bouclier.suppressions_a_examiner() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (
    select 1 from public."AccountDeletionRequest"
     where status = 'AWAITING_REVIEW'
       and "updatedAt" > bouclier.dernier_passage('account_deletion')
  )
$$;

-- lib/agents/impl/reviews-moderation.ts : avis publiés.
create or replace function bouclier.avis_nouveaux() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select exists (select 1 from public."DigitalProductReview"
                  where "createdAt" > bouclier.dernier_passage('reviews_moderation'))
      or exists (select 1 from public."FormationReview"
                  where "createdAt" > bouclier.dernier_passage('reviews_moderation'))
$$;

-- lib/agents/impl/buyer-support.ts : messages texte non lus depuis
-- `unrepliedHours` (réglage de l'agent, 2 h par défaut, 1 h minimum) devenus
-- éligibles depuis le dernier passage — créés dans ]passage − délai, maintenant − délai].
create or replace function bouclier.messages_sans_reponse() returns boolean
language sql stable set search_path = '' set timezone = 'UTC' as $$
  with delai as (
    select make_interval(hours => greatest(1, coalesce(
             (select case when (config->>'unrepliedHours') ~ '^[0-9]+([.][0-9]+)?$'
                               and (config->>'unrepliedHours')::numeric > 0
                          then (config->>'unrepliedHours')::numeric end
                from public."AiAgent" where key = 'buyer_support'),
             2))::int) d
  )
  select exists (
    select 1 from public."Message", delai
     where read = false and "deletedAt" is null and type = 'TEXT'
       and "createdAt" <= now() - delai.d
       and "createdAt" >  bouclier.dernier_passage('buyer_support') - delai.d
  )
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
      ('nk-collect-reconcile',          '*/5 * * * *',  $c$select bouclier.reveiller_si('bouclier.encaissements_ouverts(true)', '/api/cron/collect-reconcile', 'travail')$c$),
      ('nk-collect-reconcile-anciennes','17 * * * *',   $c$select bouclier.reveiller_si('bouclier.encaissements_ouverts(false)', '/api/cron/collect-reconcile', 'anciennes')$c$),
      ('nk-alerte-ventes-bloquees',     '*/15 * * * *', $c$select bouclier.reveiller_si('bouclier.ventes_bloquees()', '/api/cron/alerte-ventes-bloquees', 'travail')$c$),
      ('nk-auto-payout',                '*/10 * * * *', $c$select bouclier.reveiller_si('bouclier.retraits_a_envoyer(true)', '/api/cron/auto-payout', 'travail')$c$),
      ('nk-auto-payout-anciens',        '5 * * * *',    $c$select bouclier.reveiller_si('bouclier.retraits_a_envoyer(false)', '/api/cron/auto-payout', 'anciens')$c$),
      ('nk-payout-reconcile',           '*/10 * * * *', $c$select bouclier.reveiller_si('bouclier.versements_a_verifier()', '/api/cron/payout-reconcile', 'travail')$c$),
      ('nk-mentor-bookings-expire',     '*/15 * * * *', $c$select bouclier.reveiller_si('bouclier.reservations_expirees()', '/api/cron/mentor-bookings-expire', 'travail')$c$),
      ('nk-automation-scheduled',       '*/15 * * * *', $c$select bouclier.reveiller_si('bouclier.automatisations_echues()', '/api/cron/automation-scheduled', 'travail')$c$),
      -- ── Sans condition ──────────────────────────────────────────────────
      -- AGENTS IA : DEUX passages par semaine seulement (décision fondateur du
      -- 2026-10-06), lundi et jeudi 06:07 UTC — 07:07 au Bénin. Chaque passage
      -- est de l'IA payée : à 524 passages par jour, 6 000 réexamens KYC et
      -- 13 000 éléments « coach » par mois ont épuisé le crédit OpenRouter.
      -- Conséquence assumée : un dossier KYC, une fiche ou un litige attend
      -- jusqu'à 3-4 jours sa décision automatique — l'admin peut toujours
      -- valider à la main entre deux passages. Les portiers d'agents
      -- (kyc_nouveaux, fiches_nouvelles…) restent définis plus haut, inutilisés,
      -- pour revenir à une cadence événementielle si le budget le permet.
      ('nk-agents',                     '7 6 * * 1,4',  $c$select bouclier.reveiller('/api/cron/agents', 'planifie', 300000)$c$),
      -- Sonde de santé du trajet de versement : son rôle est justement de
      -- tourner quand il ne se passe rien.
      ('nk-sonde-versements',           '30 * * * *',   $c$select bouclier.reveiller('/api/cron/sonde-versements')$c$),
      -- Garde de consommation Vercel + santé de ce Bouclier : alerte avant
      -- que le plan gratuit ne suspende le site.
      ('nk-garde-conso',                '15 7 * * *',   $c$select bouclier.reveiller('/api/cron/garde-conso')$c$),
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
      -- Versement mensuel automatique des affiliés (route créée le 2026-10-05 :
      -- vercel.json l'appelait déjà, mais elle n'existait pas — 404 chaque mois).
      -- Trois passages : chacun s'arrête à 30 s pour ne jamais être coupé en
      -- plein versement, le suivant reprend (les affiliés déjà faits sont sautés).
      ('nk-affiliate-payout',           '0,20,40 5 5 * *', $c$select bouclier.reveiller('/api/cron/affiliate-payout')$c$),

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
