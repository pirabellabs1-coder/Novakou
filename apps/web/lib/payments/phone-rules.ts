// ═══════════════════════════════════════════════════════════════════════════
// FORME DES NUMÉROS MOBILES, pays par pays : longueur + préfixes.
// ═══════════════════════════════════════════════════════════════════════════
//
// POURQUOI. Le 2026-08-08, un acheteur a choisi « Sénégal » puis saisi son
// numéro ivoirien à 10 chiffres. L'écran acceptait (≥ 8 chiffres), l'API a
// envoyé 221 + 0556090489 à la passerelle, qui a répondu « The MSISDN is too
// long for the identified country SEN » — un message brut, incompréhensible,
// après l'échec. La forme du numéro est vérifiable AVANT d'appeler qui que ce
// soit, avec un message qui dit quoi corriger.
//
// La longueur seule ne suffit pas : ce même numéro, amputé de son 0 de tête,
// fait 9 chiffres — la longueur exacte d'un numéro sénégalais. Seul le
// préfixe (7 au Sénégal) le démasque. D'où les deux règles ensemble.
//
// Ce module est volontairement importable des deux côtés (écran ET serveur) :
// la même règle doit refuser le même numéro aux deux endroits.
//
// ─── RÈGLE DE SÛRETÉ ───────────────────────────────────────────────────────
// On n'inscrit que des valeurs CONFIRMÉES par le plan de numérotation du pays
// (relevées le 2026-08-08). Préfixes : uniquement là où ils sont stables et
// documentés — dans le doute, on n'en met PAS (longueur seule). Pays absent
// de la table : on ne bloque pas. Un numéro valide refusé est une vente
// perdue ; un numéro douteux laissé passer, la passerelle le refusera.
//
// ─── LE ZÉRO DE TÊTE, DEUX RÉALITÉS ────────────────────────────────────────
// Dans certains pays le 0 initial FAIT PARTIE du numéro international
// (Côte d'Ivoire 07…, Bénin 01…, Gabon, Congo) : on ne touche à rien.
// Ailleurs c'est un préfixe de composition nationale (Kenya 0712… → +254
// 712…) : un acheteur qui le tape n'a pas « faux », on le retire pour lui —
// mais seulement si le numéro ainsi obtenu est plausible (longueur ET
// préfixe), sinon retirer ce 0 maquillerait justement un numéro d'un autre
// pays en numéro local.

import { COUNTRIES } from "@/lib/countries";

type PhoneRule = {
  /** Chiffres du numéro national, tel qu'il part APRÈS l'indicatif pays. */
  length: number;
  /**
   * Débuts possibles du numéro national mobile (« 7 » = commence par 7).
   * Absent = non vérifié pour ce pays → la longueur seule tranche.
   */
  prefixes?: string[];
  /** Vrai si le numéro national commence légitimement par 0 (CI, BJ, GA, CG). */
  zeroIsPartOfNumber?: boolean;
  /** Exemple montré dans le message d'erreur. */
  example: string;
};

/** Clé = pays ISO-2 minuscule (même convention que le registre des paiements). */
const PHONE_RULES: Record<string, PhoneRule> = {
  // ── Zone franc ouest ─────────────────────────────────────────────────────
  sn: { length: 9, prefixes: ["7"], example: "77 123 45 67" },
  ci: { length: 10, prefixes: ["01", "05", "07"], zeroIsPartOfNumber: true, example: "07 12 34 56 78" },
  bj: { length: 10, prefixes: ["01"], zeroIsPartOfNumber: true, example: "01 57 33 57 26" },
  tg: { length: 8, example: "90 12 34 56" },
  ml: { length: 8, example: "76 12 34 56" },
  bf: { length: 8, example: "70 12 34 56" },
  ne: { length: 8, example: "96 12 34 56" },
  // ── Afrique centrale ─────────────────────────────────────────────────────
  cm: { length: 9, prefixes: ["6"], example: "671 234 567" },
  ga: { length: 8, zeroIsPartOfNumber: true, example: "07 12 34 56" },
  cg: { length: 9, prefixes: ["04", "05", "06"], zeroIsPartOfNumber: true, example: "06 123 45 67" },
  cd: { length: 9, prefixes: ["8", "9"], example: "811 234 567" },
  // ── Reste du continent (opérateurs servis par nos passerelles) ───────────
  gn: { length: 9, prefixes: ["6"], example: "621 123 456" },
  gh: { length: 9, prefixes: ["2", "5"], example: "24 123 4567" },
  ng: { length: 10, prefixes: ["7", "8", "9"], example: "803 123 4567" },
  ke: { length: 9, prefixes: ["1", "7"], example: "712 345 678" },
  tz: { length: 9, prefixes: ["6", "7"], example: "754 123 456" },
  ug: { length: 9, prefixes: ["7"], example: "772 123 456" },
  rw: { length: 9, prefixes: ["7"], example: "781 234 567" },
  zm: { length: 9, prefixes: ["7", "9"], example: "97 123 45 67" },
  mw: { length: 9, prefixes: ["8", "9"], example: "991 234 567" },
  mz: { length: 9, prefixes: ["8"], example: "84 123 4567" },
  sl: { length: 8, example: "76 123 456" },
  lr: { length: 9, example: "886 123 456" },
  et: { length: 9, prefixes: ["7", "9"], example: "911 234 567" },
  ls: { length: 8, prefixes: ["5", "6"], example: "5812 3456" },
};

export type PhoneCheck =
  | {
      ok: true;
      /** Numéro national normalisé (zéro de composition retiré s'il y a lieu). */
      national: string;
    }
  | { ok: false; error: string };

/** Nom français du pays, pour un message que l'acheteur comprend. */
function countryName(iso2: string): string {
  return COUNTRIES.find((c) => c.code.toLowerCase() === iso2)?.name ?? iso2.toUpperCase();
}

function matchesRule(digits: string, rule: PhoneRule): boolean {
  if (digits.length !== rule.length) return false;
  if (rule.prefixes && !rule.prefixes.some((p) => digits.startsWith(p))) return false;
  return true;
}

/**
 * Vérifie (et normalise) le numéro NATIONAL saisi pour un pays donné.
 *
 * - Pays inconnu de la table : on accepte dès 8 chiffres (comportement
 *   historique) — on ne bloque jamais sur une règle qu'on n'a pas vérifiée.
 * - Trop court : refusé, mais SANS message (l'acheteur est en train de taper ;
 *   le bouton reste simplement désactivé).
 * - Numéro complet mais faux : message clair, avec l'exemple du pays.
 */
export function checkNationalNumber(countryIso2: string, raw: string): PhoneCheck {
  const country = (countryIso2 ?? "").trim().toLowerCase();
  const digits = (raw ?? "").replace(/\D/g, "");
  const rule = PHONE_RULES[country];

  if (!rule) {
    return digits.length >= 8 ? { ok: true, national: digits } : { ok: false, error: "" };
  }

  if (matchesRule(digits, rule)) return { ok: true, national: digits };

  // Zéro de composition nationale (Kenya « 0712… ») : on le retire — mais
  // SEULEMENT si le numéro obtenu est plausible. Le retirer aveuglément
  // transformait le numéro ivoirien du 2026-08-08 (0556090489) en un
  // « 9 chiffres » de la bonne longueur pour le Sénégal.
  if (!rule.zeroIsPartOfNumber && digits.startsWith("0") && matchesRule(digits.slice(1), rule)) {
    return { ok: true, national: digits.slice(1) };
  }

  // En cours de saisie : pas encore de quoi juger, pas de message.
  if (digits.length < rule.length) return { ok: false, error: "" };

  const attendu = rule.prefixes
    ? `un numéro compte ${rule.length} chiffres et commence par ${rule.prefixes.join(", ")}`
    : `un numéro compte ${rule.length} chiffres`;
  return {
    ok: false,
    error:
      `${countryName(country)} : ${attendu} (ex. ${rule.example}). ` +
      `Vérifiez le pays choisi et votre numéro.`,
  };
}

/**
 * Variante SERVEUR : reçoit le numéro INTERNATIONAL complet (indicatif
 * compris), retire l'indicatif du pays attendu, puis applique la même règle.
 * Renvoie le numéro international normalisé — c'est lui qui part en passerelle.
 */
export function checkInternationalNumber(
  countryIso2: string,
  rawIntl: string,
): { ok: true; intl: string } | { ok: false; error: string } {
  const country = (countryIso2 ?? "").trim().toLowerCase();
  const digits = (rawIntl ?? "").replace(/\D/g, "");

  const dial = COUNTRIES.find((c) => c.code.toLowerCase() === country)?.dial.replace(/\D/g, "");
  // Indicatif introuvable ou numéro qui ne le porte pas : on n'invente pas de
  // découpage — on laisse passer tel quel (les passerelles restent le filet).
  if (!dial || !digits.startsWith(dial)) return { ok: true, intl: digits };

  const check = checkNationalNumber(country, digits.slice(dial.length));
  if (!check.ok) {
    return check.error
      ? { ok: false, error: check.error }
      : {
          ok: false,
          error:
            `${countryName(country)} : ce numéro est trop court. ` +
            `Vérifiez le pays choisi et votre numéro.`,
        };
  }
  return { ok: true, intl: dial + check.national };
}
