## Why

Quand un vendeur demande un retrait et que l'admin le confirme, Moneroo renvoie "fonds insuffisants" alors que le vendeur a de l'argent disponible. Deux bugs critiques identifiés : (1) quand l'appel Moneroo échoue, le retrait reste en statut `EN_ATTENTE` donc les fonds du vendeur restent bloqués indéfiniment — il ne peut plus retirer ; (2) aucun mécanisme de retry ou de libération manuelle des fonds côté admin.

Version cible : **MVP** — le flux de retrait est critique pour la confiance des vendeurs.

## What Changes

- **Fix : libérer les fonds quand Moneroo échoue** — quand `initPayout()` échoue, passer le retrait en statut `REFUSE` au lieu de le laisser en `EN_ATTENTE`, pour débloquer le solde du vendeur
- **Fix : ajouter des logs diagnostiques** — logger le montant, la devise et la méthode envoyés à Moneroo pour faciliter le débugage
- **Ajout : boutons admin Retry/Refuser** — permettre à l'admin de relancer un payout échoué ou de refuser manuellement le retrait
- **Ajout : message d'erreur explicite** — distinguer "fonds insuffisants chez Moneroo" (problème de float du compte marchand) vs "erreur de validation" (numéro invalide, etc.)
- **Vérification : format du montant Moneroo** — s'assurer que le montant est envoyé dans le bon format (unité de base XOF, pas en centimes)

## Capabilities

### New Capabilities
- `withdrawal-failure-recovery`: Gestion des échecs de payout Moneroo — libération automatique des fonds, retry admin, messages d'erreur explicites
- `withdrawal-diagnostics`: Logs et traçabilité des appels Moneroo pour diagnostiquer les erreurs de retrait

### Modified Capabilities

## Impact

- **API routes** : `app/api/formations/admin/withdrawals/[id]/route.ts` (logique d'approbation), `app/api/formations/wallet/route.ts` (calcul solde)
- **Lib** : `lib/moneroo.ts` (logging, validation montant)
- **UI Admin** : `app/(formations-dashboard)/admin/retraits-vendeurs/page.tsx` (boutons retry/refuser)
- **Aucune migration Prisma** : le champ `status` et `errorMessage` existent déjà sur `InstructorWithdrawal`
- **Aucun impact sur les autres rôles** sauf l'admin et le vendeur concerné
