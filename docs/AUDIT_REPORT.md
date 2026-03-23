# Rapport d'audit FreelanceHigh — 23 mars 2026

## Vue d'ensemble du projet

| Métrique | Valeur |
|---|---|
| Fichiers TypeScript | 742 |
| Pages (page.tsx) | ~200 |
| Routes API (route.ts) | ~180 |
| Schéma Prisma | 2447 lignes, 50+ modèles |
| Dépendances (web) | 60+ packages |

---

## Erreurs TypeScript trouvées

**33 erreurs TS6053** — toutes liées à des fichiers `.next/types` manquants (cache de build stale).
**0 erreur de code réelle** — `tsc --noEmit` sur le code source ne produit aucune erreur significative.

**Correction :** Supprimer le dossier `.next` et relancer le build.

---

## Changements non committés (16 fichiers)

| Fichier | Changement |
|---|---|
| `lib/auth/config.ts` | Cast type rôle OAuth |
| `lib/stripe.ts` | Cast `apiVersion` pour compatibilité Stripe |
| `lib/payments/service.ts` | Remplacement `uuid` par `crypto.randomUUID()`, cast Stripe API |
| `lib/notifications/service.ts` | Import `NotificationType` Prisma, ajout `read: false` |
| `sentry.client.config.ts` | Stub sans `@sentry/nextjs` (non installé) |
| `sentry.edge.config.ts` | Idem |
| `sentry.server.config.ts` | Idem |
| `components/CookieConsent.tsx` | Fix mineur |
| Fichiers formations (5) | Corrections mineures |

**Verdict :** Tous ces changements sont positifs et devraient être committés.

---

## APIs — État actuel

### Service Creation (`POST /api/services`)
- **Fonctionne** en mode dev (data-store) et production (Prisma)
- **Problème :** Le statut est toujours `EN_ATTENTE` — les services ne sont jamais `ACTIF` directement
- **Impact :** Les services publiés ne sont PAS visibles dans le feed/marketplace tant qu'un admin ne les approuve pas
- **Correction nécessaire :** Permettre la publication directe en `ACTIF` (au moins en dev)

### Service Listing (`GET /api/services`)
- **Problème :** Ne retourne que les services de l'utilisateur connecté (filtre `userId`)
- **Impact :** Pas de route publique pour le marketplace/feed
- **Note :** Une route publique séparée existe probablement ailleurs

### Admin Dashboard (`GET /api/admin/dashboard`)
- **Fonctionne** avec polling toutes les 30 secondes
- **Correct** en mode dev et production

### Draft Service (`POST /api/services/draft`)
- **Route non vérifiée** — StepPublish appelle cette route

---

## Pages avec problèmes responsive

### Pattern récurrent 1 : Stats grid trop dense
**Affecté :** commandes, projets, factures, avis, litiges
```
Actuel:  grid-cols-2 sm:grid-cols-4 (4 items sur tablette = trop serré)
Correct: grid-cols-2 sm:grid-cols-2 lg:grid-cols-4
```

### Pattern récurrent 2 : Flex row sans mobile wrap
**Affecté :** projets, commandes, avis, litiges
```
Actuel:  flex items-center gap-6
Correct: flex flex-col sm:flex-row gap-3 sm:gap-6
```

### Pattern récurrent 3 : Formulaire grid sans breakpoint mobile
**Affecté :** projets/nouveau (budget), paramètres (sécurité)
```
Actuel:  grid-cols-2 gap-4
Correct: grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4
```

### Pages spécifiques
| Page | Sévérité | Problème |
|---|---|---|
| `/client/projets/nouveau` L516 | Haute | Budget inputs grid-cols-2 sans mobile |
| `/client/factures` L233 | Haute | Table sans colonnes cachées sur mobile |
| `/client/parametres` L220 | Haute | Security grid-cols-3 sans breakpoint |
| `/client/commandes` L91 | Moyenne | Stats grid sm:grid-cols-5 trop dense |
| `/client/avis` L271 | Moyenne | Gap trop grand sur mobile |

---

## Plan de correction

1. **Service publication** — Ajouter route publique marketplace, permettre publication directe
2. **Responsive client** — Corriger les 5 patterns récurrents dans toutes les pages
3. **Admin sync** — Déjà fonctionnel, ajouter notifications admin sur événements clés
4. **Build** — Nettoyer .next, vérifier build propre
5. **Commit** — Committer les 16 changements non committés

---

*Audit réalisé le 23 mars 2026*
