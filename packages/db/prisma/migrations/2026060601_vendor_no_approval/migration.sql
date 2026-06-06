-- Migration : suppression du statut "en attente d'approbation" des vendeurs
--
-- Pourquoi : Novakou n'a PAS de workflow d'approbation des vendeurs. Tout
-- compte instructeur peut vendre immediatement (cf. getOrCreateInstructeur,
-- lib/formations/active-user.ts qui creent deja APPROUVE ; aucun gate ne
-- bloque la vente sur EN_ATTENTE ; aucune page admin pour approuver).
-- Seuls l'inscription et l'ancien defaut du schema laissaient les profils
-- en EN_ATTENTE, ce qui faisait remonter de faux "vendeurs en attente
-- d'approbation" dans le rapport IA admin.
--
-- Ce qu'on fait :
--   1. Reclasser tous les profils EN_ATTENTE existants en APPROUVE.
--   2. Changer le defaut de la colonne en APPROUVE.
--
-- On ne touche PAS les profils SUSPENDU (seul vrai etat desactive, pose
-- manuellement par l'admin).

UPDATE "InstructeurProfile"
  SET "status" = 'APPROUVE'
  WHERE "status" = 'EN_ATTENTE';

ALTER TABLE "InstructeurProfile"
  ALTER COLUMN "status" SET DEFAULT 'APPROUVE';
