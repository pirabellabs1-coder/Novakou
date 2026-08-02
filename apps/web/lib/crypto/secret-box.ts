import "server-only";
import crypto from "crypto";

// Chiffrement des SECRETS stockés en base (identifiants de passerelles de
// paiement). AES-256-GCM : confidentialité + authentification (une valeur
// altérée en base est rejetée au déchiffrement au lieu d'être silencieusement
// acceptée).
//
// POURQUOI : ces clés déplacent de l'argent réel. Les stocker en clair
// signifierait qu'une fuite de la base (dump, sauvegarde égarée, accès en
// lecture d'un tiers) donne immédiatement le droit d'encaisser et de verser au
// nom de Novakou. Le chiffrement rend le dump inexploitable sans la clé, qui
// elle ne vit que dans les variables d'environnement.
//
// La clé : PAYMENT_CREDENTIALS_KEY = 32 octets en base64 ou hex.
// Générer avec :  openssl rand -base64 32
//
// ⚠️ Si la clé est absente, on LÈVE une erreur au lieu de retomber sur du clair.
// Un repli silencieux en clair est exactement le genre de « dégradation
// pratique » qui finit par mettre des secrets à nu sans que personne le voie.

const FORMAT = "v1";

function loadKey(): Buffer {
  const raw = process.env.PAYMENT_CREDENTIALS_KEY?.trim();
  if (!raw) {
    throw new Error(
      "PAYMENT_CREDENTIALS_KEY manquante : impossible de chiffrer/déchiffrer les identifiants de passerelle. " +
        "Générez-la avec `openssl rand -base64 32` puis posez-la dans les variables d'environnement.",
    );
  }
  // base64 (44 car. avec padding) ou hex (64 car.)
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `PAYMENT_CREDENTIALS_KEY invalide : 32 octets attendus, ${key.length} obtenus. Utilisez \`openssl rand -base64 32\`.`,
    );
  }
  return key;
}

/** Vrai si la clé de chiffrement est correctement configurée (pour le diagnostic admin). */
export function isSecretBoxReady(): boolean {
  try {
    loadKey();
    return true;
  } catch {
    return false;
  }
}

/** Chiffre une chaîne. Retourne `v1:<iv>:<tag>:<données>` en base64. */
export function encryptSecret(plaintext: string): string {
  const key = loadKey();
  const iv = crypto.randomBytes(12); // 96 bits, taille recommandée pour GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [FORMAT, iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

/** Déchiffre une valeur produite par encryptSecret. Lève si altérée ou illisible. */
export function decryptSecret(payload: string): string {
  const key = loadKey();
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== FORMAT) {
    throw new Error("Secret illisible : format inattendu.");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

/** Chiffre un objet d'identifiants ({apiKey, shopId, ...}). */
export function encryptCredentials(creds: Record<string, string>): string {
  return encryptSecret(JSON.stringify(creds));
}

/** Déchiffre un objet d'identifiants. Retourne {} si la valeur est vide. */
export function decryptCredentials(payload: string | null | undefined): Record<string, string> {
  if (!payload) return {};
  const parsed: unknown = JSON.parse(decryptSecret(payload));
  return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
}

/**
 * Version masquée d'un secret, pour l'afficher à l'admin sans le révéler.
 * `sk_live_9f2c8ab31` → `sk_live_…ab31`
 */
export function maskSecret(value: string): string {
  const v = value.trim();
  if (v.length <= 8) return "••••";
  return `${v.slice(0, 6)}…${v.slice(-4)}`;
}
