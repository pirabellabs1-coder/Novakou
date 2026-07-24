-- Idempotence des factures d'abonnement : un paymentRef ne peut apparaître
-- qu'une fois. En Postgres, un index unique autorise plusieurs NULL, donc les
-- factures sans référence (pending/failed) ne sont pas contraintes.
-- Additif : la table est vide en prod, aucune donnée touchée.
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionInvoice_paymentRef_key"
  ON "SubscriptionInvoice" ("paymentRef");
