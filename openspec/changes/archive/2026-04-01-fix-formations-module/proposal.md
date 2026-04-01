## Why

Le module formations est inutilisable : les boutons "Acheter" et "Ajouter au panier" ne fonctionnent pas sur la page détail formation, le panier ne se met pas à jour, le checkout mock redirige vers un mauvais port (3450 au lieu de 3000), et le dashboard apprenant ("Mes formations") affiche tout à zéro (formations en cours, complétées, certifications, heures d'apprentissage) car aucun enrollment ne se crée jamais. **Version cible : MVP.**

## What Changes

- **Fix checkout redirect URL** : Le `baseUrl` dans `/api/formations/checkout` utilise `process.env.NEXTAUTH_URL ?? "http://localhost:3450"` alors que l'app tourne sur le port 3000. Le mock payment crée les enrollments mais redirige vers un URL qui ne répond pas → l'utilisateur ne voit jamais la page succès.
- **Fix "Ajouter au panier" UX** : Le bouton fonctionne côté API mais le feedback utilisateur est silencieux (pas de toast, pas d'indicateur de succès), et le redirect `/formations/panier` échoue si l'apprenant n'est pas dans le bon layout group `(apprenant)`.
- **Fix "Acheter" flow** : Le `buyNow` ajoute au panier puis appelle checkout, mais en mock mode le `data.url` contient un URL vers le port 3450 qui ne fonctionne pas. Quand `checkoutUrl` est `null` (mock provider), le code devrait rediriger localement vers la page succès au lieu d'attendre un URL Stripe.
- **Fix dashboard stats** : Si aucun enrollment n'existe (à cause du flow cassé), tous les stats sont 0. Fixer le flow d'achat résoudra ce problème en cascade. Vérifier aussi que le calcul `totalHours` divise correctement par 60 (minutes → heures).
- **Fix progression** : La progression individuelle dépend d'enrollments existants + la page "apprendre" met à jour via PUT `/api/formations/[id]/progress`. Corriger le flow d'achat débloquera la progression.
- **Ajouter un toast de confirmation** pour "Ajouter au panier" (feedback immédiat avant redirection).

## Capabilities

### New Capabilities
- `cart-purchase-flow`: Corrige le flux complet ajout panier → checkout → enrollment → redirection succès, incluant le baseUrl, le handling mock payment, et le feedback UX.
- `learner-dashboard-stats`: S'assure que les stats du dashboard apprenant (en cours, complétées, certifications, heures) reflètent les données réelles et gère les edge cases (0 enrollments, données manquantes).

### Modified Capabilities
_(Pas de specs existantes modifiées — c'est un bug fix, pas un changement de requirements.)_

## Impact

### Code impacté
- `apps/web/app/api/formations/checkout/route.ts` — baseUrl fix + handling mock payment URL
- `apps/web/app/formations/[slug]/page.tsx` — buyNow() et addToCart() error handling + toast feedback
- `apps/web/app/formations/(apprenant)/panier/page.tsx` — checkout() handling mock result
- `apps/web/app/formations/(apprenant)/mes-formations/page.tsx` — edge case stats
- `apps/web/app/api/apprenant/enrollments/route.ts` — vérification calculs stats

### Pas d'impact sur :
- Schéma Prisma (pas de migration)
- Marketplace / services / commandes
- Espace admin, freelance, client, agence
- Aucun job BullMQ, handler Socket.io, ou template email nécessaire
