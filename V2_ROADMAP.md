# Novakou — Roadmap v2.0

> Document de référence · Juin 2026 · Fondateur : Lissanon Gildas
> Plateforme : marketplace de formations et produits digitaux pour l'Afrique francophone.

---

## 1. Audit de l'existant (v1)

### 1.1 Architecture réelle

| Élément | État |
|---|---|
| Stack | **Next.js 14 unique** (`apps/web`) — pas de backend Fastify séparé. 310 routes API en route handlers. |
| Base de données | Supabase Postgres · **126 modèles Prisma** |
| Pages | 171 (65 publiques + 106 dashboard) |
| Paiement | Stripe (international) + Moneroo + PayGenius (Mobile Money Afrique) |
| Monitoring | Sentry · 21 crons Vercel |
| i18n | Français + Anglais (arabe / RTL non actif) |
| Design | Système « Stitch » unifié — vert Novakou `#006e2f → #22c55e`, icônes Lucide React |

### 1.2 Forces (la v1 est déjà mature)

La v1 couvre un périmètre large et fonctionnel :

- **Catalogue** : formations (sections, leçons, ressources, quiz), produits digitaux, bundles, abonnements.
- **Mentorat** : profils, disponibilités, réservations, packs de séances, abonnements mentor, salle visio (WebRTC).
- **Marketing** : séquences email, funnels de vente, A/B tests, popups intelligents, order bumps, codes promo, campagnes UTM, pixels (Meta/Google/TikTok).
- **Croissance** : programme d'affiliation complet, multi-boutique, cohortes.
- **Confiance** : KYC progressif, certificats vérifiables, badges, streaks apprenant, litiges, remboursements.
- **Vendeur pro** : clés API, webhooks sortants, AI Studio.
- **Paiement & finance** : escrow, retraits Mobile Money, réconciliation, factures.

### 1.3 Faiblesses et manques — par axe v2.0

| Axe | État v1 | Manque / Opportunité |
|---|---|---|
| **Temps réel** | Messagerie en **polling** (15 s) ; `socket.io-client` installé mais **aucun serveur socket** ; **Supabase Realtime inutilisé** | Messagerie temps réel, notifications live, présence en ligne, indicateurs de frappe |
| **Recherche** | Filtre Postgres basique (ILIKE), pas de moteur dédié | Recherche rapide tolérante aux fautes (Meilisearch) → recherche **sémantique** (pgvector + embeddings) |
| **IA** | Puter.ai (Claude gratuit) : AI Studio, support, génération fiche/funnel | **Recommandations personnalisées**, matching acheteur ↔ produit, assistant d'achat IA |
| **Mobile / PWA** | `manifest.ts` seul, **pas de service worker** | PWA installable, **notifications push natives**, offline, perf mobile 3G |
| **Performance** | Build lourd, bundles publics volumineux | Code splitting, LCP mobile, images optimisées, ISR étendu |

---

## 2. Plan v2.0 — 4 phases

### Phase 1 — Temps réel & confiance
**Objectif** : rendre la plateforme vivante.

- Messagerie temps réel via **Supabase Realtime** (déjà disponible, aucun nouveau serveur, aucun coût additionnel).
- Notifications in-app en direct (nouvelle vente, message, commande).
- Présence « en ligne » + indicateurs de frappe.
- Badges de confiance enrichis (vendeur vérifié, top vendeur, réactif).

**Pourquoi en premier** : c'est la fondation, ça s'appuie sur Supabase Realtime déjà présent, et le polling est le manque le plus visible.

### Phase 2 — Recherche & découverte
**Objectif** : aider l'acheteur à trouver.

- Moteur de recherche rapide et tolérant aux fautes (Meilisearch sur Railway, ~15 $/mois).
- Synchronisation depuis Postgres.
- Puis recherche **sémantique** : `pgvector` + embeddings (`text-embedding-3-small`) → « décris ton besoin en langage naturel ».
- Recommandations « produits pour toi » basées sur l'historique.

### Phase 3 — IA qui vend
**Objectif** : différencier et automatiser.

- Assistant d'achat IA (NLP : besoin décrit → suggestions de produits/vendeurs).
- Matching acheteur ↔ produit.
- Génération de contenu vendeur améliorée (titres SEO, descriptions, emails).
- Support client IA 24/7 (déjà amorcé, à étendre).

### Phase 4 — Mobile-first & PWA
**Objectif** : capturer le trafic mobile africain.

- PWA installable (écran d'accueil iOS/Android).
- Notifications push natives (Web Push API + service worker).
- Mode offline (consultation des achats, cache).
- Optimisation performance (LCP mobile 3G, lazy-load, images `next/image`).

---

## 3. Ordre d'exécution recommandé

1. **Phase 1** (temps réel) — fondation, coût nul, impact immédiat.
2. **Phase 4** (PWA/perf) en parallèle léger — le push natif amplifie la Phase 1.
3. **Phase 2** (recherche) — impact conversion.
4. **Phase 3** (IA) — différenciation, s'appuie sur les embeddings de la Phase 2.

---

## 4. Principes de mise en œuvre

- **Zéro régression** : la logique métier existante est préservée à chaque étape.
- **Incrémental** : chaque phase est livrable et apporte de la valeur seule.
- **Pas de nouveau vendeur coûteux** sans justification (Supabase Realtime d'abord, Meilisearch seulement si nécessaire).
- **Vérification systématique** : typecheck + déploiement vérifié (commit réellement servi par le domaine) avant de confirmer.

---

---

## 5. Journal d'avancement

### Nuit du 14 juin 2026 — premiers incréments v2 (livrés et déployés)

**Phase 1 — Temps réel** ✅
- Chat temps réel via Supabase Realtime Broadcast (réception instantanée,
  dédup) — `338ad882`
- Indicateur « écrit… » (frappe en direct)
- Présence « en ligne » (pastille verte dans l'en-tête) — `135f6781`
- Notifications live : la cloche s'allume sans rafraîchir, et **le vendeur
  est notifié EN DIRECT de chaque vente** — `5316f7ea`
- Liste des conversations rafraîchie en temps réel
- Polling de secours conservé partout (robustesse)

**Phase 4 — PWA** ✅ (installable + offline)
- Manifest enrichi (raccourcis), service worker conservateur manuel
  (offline, network-first, jamais d'API/auth en cache) — `b78eb17a`
- « Ajouter à l'écran d'accueil » fonctionnel
- Reste à faire : notifications push natives (besoin de clés VAPID)

**Phase 2 — Découverte** ✅ (premiers pas, sans infra)
- Section « Vous aimerez aussi » (recos par catégorie) sur les fiches
  produit + formation — `a5aab75e`
- Recherche élargie (titre + description + nom du vendeur + catégorie)
  — `e5ac997d`
- « Recommandé pour toi » PERSONNALISÉ sur le dashboard apprenant (selon
  l'historique d'achat) — `b3aaefeb`
- Reste à faire : moteur Meilisearch puis recherche sémantique pgvector

### 22 juin 2026 — confiance + IA

**Phase 1 — Confiance** ✅
- Badge « Vendeur vérifié » (KYC ≥ 3, identité confirmée) sur les fiches
  produit + formation — `ba4c82a2`
- Même badge dans le **catalogue** (cartes de l'explorer) — cohérence sur
  tout le parcours d'achat

**Phase 3 — IA qui vend** ✅ (premier pas)
- **Assistant d'achat IA** sur l'explorer : l'acheteur décrit son besoin en
  langage naturel, l'IA (Puter.ai/Claude, gratuit) extrait les mots-clés et
  lance la recherche — repli robuste sur la requête brute — `ad27a688`

**Phase 4 — Notifications push natives** ✅ (de bout en bout)
- Table `PushSubscription` (migration prod appliquée), clés VAPID (local +
  Vercel), dépendance `web-push` — `1c1abfe8`
- Envoi serveur branché sur toutes les notifs in-app + sur « Nouvelle vente »
  (le vendeur est prévenu app fermée 🎉)
- SW : handlers push + clic ; bouton « Activer les notifications » dans la
  cloche ; resync silencieux si déjà accordé
- Bouton « Installer l'app » (`beforeinstallprompt`) + lazy-loading images

**Prochaines étapes**
- Phase 2 : Meilisearch (~15 $/mois) → embeddings sémantiques pgvector
- Phase 3 : étendre l'IA (matching acheteur↔produit, suggestions de vendeurs)
- Badges enrichis : « Top vendeur », « Réactif » (basés sur stats)
- Push : notifications aux acheteurs (nouveau message, commande livrée…)

---

*© 2026 Novakou. Document maintenu par le fondateur.*
