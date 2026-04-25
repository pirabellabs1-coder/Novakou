## Why

Plusieurs bugs critiques rendent l'espace client presque inutilisable, les boosts non-fonctionnels, et les litiges invisibles. Ces bugs bloquent le flux monétaire (commandes, paiements, litiges) et l'expérience utilisateur sur les 3 espaces (client, freelance, agence).

**Version cible : MVP** — Ces corrections sont indispensables pour que la plateforme soit fonctionnelle.

## What Changes

### A. Détection du plan utilisateur (boost)
- **Fix** : La page `/dashboard/boost` ne lit jamais `currentPlan` du store et n'appelle jamais `canBoost()` de `lib/plans.ts`. Résultat : le message "plan Gratuit ne permet pas de booster" s'affiche pour tout le monde.
- **Action** : Importer `currentPlan` depuis le dashboard store, appeler `canBoost()`, et n'afficher le blocage que si le plan réel ne le permet pas.

### B. Espace client — Dashboard vide
- **Fix** : `store/client.ts` → `syncAll()` fetch `financesApi.summary()` mais ne stocke jamais le résultat dans `financeSummary`. La page `/client/page.tsx` accède à `stats.summary.totalSpent` qui n'existe pas.
- **Action** : Stocker `financeSummary` dans le store lors du sync, et connecter le dashboard aux bonnes données (commandes actives, dépenses, projets).

### C. Suspension de projet client
- **Fix** : Le client n'a aucun moyen de suspendre/mettre en pause un projet publié. Seul "supprimer" existe.
- **Action** : Ajouter une action "Suspendre" dans la liste des projets + méthode `pauseProject()` dans le store client + route API `PATCH /api/projects/[id]` avec `status: "suspendu"`.

### D. Litiges bloquent les avis
- **Fix** : L'API `/api/reviews` POST vérifie `status === "termine"` mais ne bloque pas `status === "litige"/"DISPUTE"`. Un client peut laisser un avis sur une commande en litige.
- **Action** : Ajouter validation côté API + filtrer côté UI les commandes en litige de la liste des avis à donner.

### E. Diagramme mobile (répartition commandes)
- **Fix** : Les labels du pie chart se superposent en version mobile (180px trop petit).
- **Action** : Masquer les labels inline sur mobile, afficher uniquement la légende en dessous avec retour à la ligne.

### F. Erreur publication avis client
- **Fix** : `store/client.ts` → `submitReview()` catch vide, retourne `false` sans message. La page affiche un message d'erreur générique.
- **Action** : Retourner le message d'erreur de l'API, l'afficher dans le toast.

### G. Paiement & facturation client vides
- **Fix** : `/client/factures` ne sync pas le `financeSummary`. Les totaux (dépensé, en attente, crédits) restent à 0.
- **Action** : Syncer `financeSummary` au chargement de la page factures + afficher les données correctement.

### H. Préparer le système de crédits client
- **Fix** : Aucune implémentation du wallet client (dépôt de fonds, utilisation pour achats).
- **Action** : Ajouter le champ `credits` dans le store client, UI de solde dans la page paiements, et préparer l'endpoint de dépôt (sans intégration Stripe pour l'instant, structure seulement).

### I. Litiges client vides
- **Fix** : La page `/client/litiges` sync les disputes depuis les commandes mais les statuts sont incohérents (lowercase "litige" en dev vs uppercase "DISPUTE" en Prisma).
- **Action** : Normaliser les statuts dans `syncDisputes()` et afficher correctement les compteurs (en cours, en attente, résolus, total).

### J. Boosts freelance/agence non-fonctionnels
- **Fix** : La page boost existe mais les services ne montrent pas leur statut boosted. Pas de badge "Boosted" dans la liste des services, pas de stats visibles.
- **Action** : Intégrer le statut boost dans la liste des services (badge + date expiration), afficher les stats boost dans le dashboard.

**Impact sur les rôles :**
- **Client** : Dashboard, avis, paiements, litiges, projets — tout est impacté
- **Freelance** : Boosts, détection plan
- **Agence** : Boosts
- **Admin** : Pas d'impact direct

**Pas de migration Prisma requise** — Les tables et champs existent déjà.
**Pas de job BullMQ, Socket.io ou template email nécessaire.**

## Capabilities

### New Capabilities
- `client-credits-wallet`: Système de crédits client — solde, affichage dans l'UI paiements, structure pour dépôt futur
- `client-project-suspension`: Permettre au client de suspendre/reprendre un projet publié

### Modified Capabilities
_(Aucune spec existante dans `openspec/specs/`)_

## Impact

**Fichiers principaux impactés :**
- `apps/web/app/dashboard/boost/page.tsx` — fix détection plan
- `apps/web/app/dashboard/services/page.tsx` — badge boost
- `apps/web/app/agence/services/page.tsx` — badge boost agence
- `apps/web/app/client/page.tsx` — dashboard données + chart mobile
- `apps/web/app/client/projets/page.tsx` — bouton suspendre
- `apps/web/app/client/avis/page.tsx` — filtrer litiges + erreur détaillée
- `apps/web/app/client/factures/page.tsx` — sync financeSummary
- `apps/web/app/client/litiges/page.tsx` — normalisation statuts + affichage
- `apps/web/app/api/reviews/route.ts` — validation litige
- `apps/web/app/api/projects/[id]/route.ts` — PATCH suspend
- `apps/web/store/client.ts` — financeSummary sync, submitReview erreur, pauseProject, credits
- `apps/web/store/dashboard.ts` — currentPlan utilisé dans boost
