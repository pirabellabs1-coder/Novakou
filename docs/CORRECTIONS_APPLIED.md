# Corrections appliquees — 23 mars 2026

## Services
- [x] API POST /api/services — status change `EN_ATTENTE` -> `ACTIF` (publication directe)
- [x] API GET /api/feed — ajout support Prisma (production) en plus du dev-store
- [x] API /api/feed — pagination ajoutee (page, limit, totalPages)
- [x] Notification freelance mise a jour : "Service publie" au lieu de "Service soumis"
- [x] Notification admin ajoutee lors de chaque publication de service
- [x] Admin notify helper cree (`lib/admin/notify.ts`) — broadcast a tous les admins

## Responsive — Espace Client
- [x] `/client/commandes` — stats grid: `sm:grid-cols-5` -> `sm:grid-cols-3 lg:grid-cols-5`
- [x] `/client/avis` — stats grid: `sm:grid-cols-4` -> `sm:grid-cols-2 lg:grid-cols-4`
- [x] `/client/factures` — stats grid: idem + colonne N° Facture cachee sur mobile
- [x] `/client/litiges` — stats grid: idem
- [x] `/client/propositions` — stats grid: idem
- [x] `/client/projets` — stats grid: idem
- [x] `/client/projets/[id]` — stats grid: idem (2 occurrences)
- [x] `/client/projets/nouveau` — budget inputs: `grid-cols-2` -> `grid-cols-1 sm:grid-cols-2`
- [x] `/client/projets/nouveau` — categories: `sm:grid-cols-4` -> `sm:grid-cols-3 lg:grid-cols-4`
- [x] `/client/parametres` — security form: `sm:grid-cols-3` -> `sm:grid-cols-2 lg:grid-cols-3`

## Responsive — Espace Agence
- [x] `/agence/finances` — stats grid corrige
- [x] `/agence/offres` — stats grid corrige
- [x] `/agence/avis` — stats grid corrige
- [x] `/agence/abonnement` — stats grid corrige
- [x] `/agence/portfolio` — stats grid corrige
- [x] `/agence/candidatures` — stats grid corrige

## Responsive — Espace Public
- [x] `/projets/[id]` — stats grid corrige

## Admin Sync
- [x] Admin dashboard deja fonctionnel avec polling 30s
- [x] Event registry admin mis a jour avec vrais messages de notification
- [x] Helper `notifyAdmins()` cree pour broadcast a tous les admins

## Audit
- [x] Rapport d'audit complet genere (`docs/AUDIT_REPORT.md`)
- [x] 0 erreur TypeScript reelle (33 TS6053 = cache stale `.next/types`)
- [x] Build precedent reussi sans erreur

## Fichiers modifies
1. `apps/web/app/api/services/route.ts` — status ACTIF + admin notify
2. `apps/web/app/api/feed/route.ts` — support Prisma + pagination
3. `apps/web/app/client/commandes/page.tsx` — responsive grid
4. `apps/web/app/client/avis/page.tsx` — responsive grid
5. `apps/web/app/client/factures/page.tsx` — responsive grid + table
6. `apps/web/app/client/litiges/page.tsx` — responsive grid
7. `apps/web/app/client/propositions/page.tsx` — responsive grid
8. `apps/web/app/client/projets/page.tsx` — responsive grid
9. `apps/web/app/client/projets/[id]/page.tsx` — responsive grid
10. `apps/web/app/client/projets/nouveau/page.tsx` — responsive form
11. `apps/web/app/client/parametres/page.tsx` — responsive form
12. `apps/web/app/(public)/projets/[id]/page.tsx` — responsive grid
13. `apps/web/app/agence/finances/page.tsx` — responsive grid
14. `apps/web/app/agence/offres/page.tsx` — responsive grid
15. `apps/web/app/agence/avis/page.tsx` — responsive grid
16. `apps/web/app/agence/abonnement/page.tsx` — responsive grid
17. `apps/web/app/agence/portfolio/page.tsx` — responsive grid
18. `apps/web/app/agence/candidatures/page.tsx` — responsive grid
19. `apps/web/lib/events/registry.ts` — admin event notifications
20. `apps/web/lib/admin/notify.ts` — NEW: admin broadcast helper
21. `docs/AUDIT_REPORT.md` — NEW: audit report
22. `docs/CORRECTIONS_APPLIED.md` — NEW: this file
