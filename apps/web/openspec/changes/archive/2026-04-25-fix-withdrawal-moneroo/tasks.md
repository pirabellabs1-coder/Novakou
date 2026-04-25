## 1. Fix critique — libérer les fonds sur échec Moneroo

- [x] 1.1 Dans `app/api/formations/admin/withdrawals/[id]/route.ts`, modifier le catch block de `initPayout()` : passer le status du retrait à `REFUSE` au lieu de laisser `EN_ATTENTE`, écrire le message dans `refusedReason`
- [x] 1.2 Ajouter un log structuré avant l'appel `initPayout()` : `[moneroo:payout] id=${id} amount=${w.amount} currency=${currency} method=${method}`
- [x] 1.3 Ajouter un log structuré dans le catch : `[moneroo:payout:error] id=${id} error=${msg}`

## 2. API — support retry et refus manuel

- [x] 2.1 Dans la route PATCH admin withdrawals, ajouter le support de `action=retry` : remettre un retrait `REFUSE` en `EN_ATTENTE`, incrémenter un compteur `retryCount` (stocker dans `accountDetails._retryCount`), et relancer `initPayout()`
- [x] 2.2 Ajouter le support de `action=reject` : passer un retrait `EN_ATTENTE` en `REFUSE` avec un `refusedReason` fourni par l'admin, sans appeler Moneroo
- [x] 2.3 Limiter les retries à 3 max : si `retryCount >= 3`, renvoyer une erreur 400

## 3. Messages d'erreur explicites

- [x] 3.1 Créer une fonction `classifyMonerooError(msg: string)` dans `lib/moneroo.ts` qui retourne un objet `{ category: 'insufficient_funds' | 'validation' | 'network' | 'unknown', userMessage: string }`
- [x] 3.2 Utiliser cette fonction dans le catch block pour stocker `category` et `userMessage` dans la réponse API

## 4. UI Admin — boutons Relancer et Refuser

- [x] 4.1 Dans la page admin retraits vendeurs, ajouter un bouton "Relancer" visible sur les retraits `REFUSE` avec `errorMessage`, qui appelle PATCH avec `action=retry`
- [x] 4.2 Ajouter un bouton "Refuser" visible sur les retraits `EN_ATTENTE`, qui ouvre un prompt pour le motif puis appelle PATCH avec `action=reject`
- [x] 4.3 Afficher le `errorMessage` classifié sous le retrait : fond rouge pour "insufficient_funds" avec conseil de recharger Moneroo, fond orange pour "validation" avec conseil de vérifier le numéro
- [x] 4.4 Désactiver le bouton "Relancer" si `retryCount >= 3` avec message "Contactez le support Moneroo"
