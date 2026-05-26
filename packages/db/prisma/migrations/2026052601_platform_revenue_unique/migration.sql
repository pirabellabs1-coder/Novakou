-- Migration : unique partial index sur PlatformRevenue
-- Bureau Novakou session 2 (vote 22) + session 3 (vote 27, blocker Henrik #2).
--
-- Pourquoi : empêcher tout double-comptage de commission si un webhook
-- Moneroo/PayGenius/Stripe re-fire après un crash partiel. Sans cet index,
-- une race entre webhook et payment/verify pouvait créer 2 PlatformRevenue
-- pour la même commande, doublant le crédit `totalEarned` du vendeur.
--
-- Partial : on n'indexe QUE les rows positifs (achats réels). Les rows
-- négatifs (refunds — `grossAmount < 0`) doivent rester indépendants de
-- l'achat original sans déclencher une violation de contrainte.
--
-- Préalable : vérifié 0 doublon via scripts/check-platform-revenue-dupes.mjs

CREATE UNIQUE INDEX "PlatformRevenue_orderId_orderType_unique_positive"
  ON "PlatformRevenue" ("orderId", "orderType")
  WHERE "grossAmount" > 0;
