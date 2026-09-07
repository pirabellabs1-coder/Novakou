import "server-only";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";

/**
 * Secret TOTP (2FA) chiffré au repos.
 *
 * POURQUOI : la 2FA est obligatoire et non contournable pour les comptes
 * ADMIN. Stocker le secret en clair signifie qu'un dump de la base — une
 * sauvegarde égarée, un accès en lecture d'un prestataire — livre le SECOND
 * facteur en même temps que le mot de passe haché. Le deuxième facteur cesse
 * alors d'en être un.
 *
 * On réutilise volontairement `secret-box` et sa clé `PAYMENT_CREDENTIALS_KEY`
 * plutôt que d'introduire une clé de plus : une seule clé à poser, à faire
 * tourner et à auditer. Elle est déjà présente en production et en local.
 *
 * ⚠️ Fail-closed : sans la clé, `encryptSecret`/`decryptSecret` lèvent. On ne
 * retombe JAMAIS sur du clair — c'est ce repli « pratique » qui remettrait les
 * secrets à nu sans que personne le remarque.
 */

/**
 * Une valeur chiffrée est `v1:<iv>:<tag>:<données>`. Un secret otplib est du
 * base32 (`[A-Z2-7]`) et ne contient jamais de « : ». La distinction est donc
 * sans ambiguïté — pas besoin d'une colonne « chiffré ? » à tenir à jour.
 */
export function secretTotpEstChiffre(valeur: string): boolean {
  return valeur.startsWith("v1:") && valeur.split(":").length === 4;
}

/** Prépare un secret TOTP pour l'écriture en base. */
export function chiffrerSecretTotp(secret: string): string {
  return encryptSecret(secret);
}

/**
 * Lit un secret stocké.
 *
 * Tolère une valeur en clair : ce sont les enregistrements antérieurs au
 * chiffrement. Sans cette tolérance, les comptes déjà équipés perdraient leur
 * 2FA du jour au lendemain. Le script `scripts/chiffrer-secrets-2fa.mjs`
 * reprend ces lignes ; la tolérance reste ensuite comme filet, pas comme
 * chemin normal.
 */
export function lireSecretTotp(stocke: string | null | undefined): string | null {
  if (!stocke) return null;
  if (!secretTotpEstChiffre(stocke)) return stocke;
  return decryptSecret(stocke);
}
