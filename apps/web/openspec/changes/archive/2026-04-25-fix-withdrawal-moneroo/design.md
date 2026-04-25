## Context

Le flux de retrait vendeur suit ce chemin :
1. Vendeur POST `/api/formations/wallet` → crée `InstructorWithdrawal` avec status `EN_ATTENTE`
2. Le solde `available` est calculé comme : `netReleased (>24h) - somme des withdrawals EN_ATTENTE et TRAITE`
3. Admin PATCH `/api/formations/admin/withdrawals/[id]` avec `action=approve` → appelle `initPayout()` Moneroo
4. Si Moneroo répond OK → webhook met à jour le status en `TRAITE`
5. **Bug actuel : Si Moneroo échoue → withdrawal reste `EN_ATTENTE` → fonds bloqués indéfiniment**

Fichiers clés :
- `lib/moneroo.ts` : wrapper API Moneroo (`initPayout`)
- `app/api/formations/admin/withdrawals/[id]/route.ts` : approbation admin (lignes 174-210)
- `app/api/formations/wallet/route.ts` : calcul du solde (lignes 459-490)
- `app/api/webhooks/moneroo/route.ts` : webhook payout success/failure
- `app/(formations-dashboard)/admin/retraits-vendeurs/page.tsx` : UI admin

## Goals / Non-Goals

**Goals:**
- Débloquer les fonds du vendeur quand Moneroo rejette un payout
- Permettre à l'admin de relancer ou refuser un retrait échoué
- Logger les paramètres envoyés à Moneroo pour diagnostiquer les "insufficient funds"
- Afficher un message d'erreur explicite à l'admin

**Non-Goals:**
- Changer de provider de paiement (Moneroo reste)
- Modifier le calcul du solde wallet (il est correct)
- Ajouter le retrait automatique sans validation admin

## Decisions

### 1. Status `REFUSE` au lieu de `EN_ATTENTE` quand Moneroo échoue

**Choix :** Quand `initPayout()` lance une exception, le catch block met le status à `REFUSE` avec le message d'erreur dans `refusedReason`. Le solde du vendeur est automatiquement débloqué car le wallet exclut les `REFUSE` du calcul.

**Alternative rejetée :** Créer un nouveau status `ECHOUE` — ajoute de la complexité au schéma Prisma pour un cas déjà couvert par `REFUSE`.

### 2. Bouton "Relancer" dans l'admin

**Choix :** Ajouter un bouton "Relancer le payout" sur les retraits en status `REFUSE` qui ont un `errorMessage`. Ce bouton recrée un `InstructorWithdrawal` en `EN_ATTENTE` avec le même montant/méthode et rappelle l'approbation.

En fait, plus simple : le bouton "Relancer" re-PATCH le même retrait avec `action=approve`, en remettant le status à `EN_ATTENTE` puis en rappelant `initPayout()`.

**Alternative rejetée :** Faire retry automatique avec délai — risque de boucle infinie si le problème est côté Moneroo (float insuffisant).

### 3. Logging des appels Moneroo

**Choix :** Ajouter un `console.log` structuré avant chaque appel `initPayout()` avec : montant, devise, méthode, numéro destinataire (masqué). Stocker aussi ces infos dans le champ `errorMessage` du retrait en cas d'échec.

## Risks / Trade-offs

- **Risque : admin relance en boucle** → Mitigation : limiter à 3 tentatives max par retrait (compteur dans metadata ou un champ `retryCount`)
- **Risque : le problème est le float Moneroo** → Mitigation : le message d'erreur doit clairement indiquer "Vérifiez le solde de votre compte Moneroo" si l'erreur contient "insufficient"
