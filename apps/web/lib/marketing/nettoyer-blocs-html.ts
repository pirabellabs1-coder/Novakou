import { sanitizeRichHtml } from "@/lib/sanitize-html";

/**
 * Nettoie les blocs « HTML personnalisé » d'un tunnel de vente, où qu'ils se
 * trouvent dans la structure (étapes → contenu → sections → blocs).
 *
 * Le bloc `{ type: "html", data: { html } }` est rendu tel quel par la page
 * publique `/f/[slug]`, sur l'origine novakou.com : un vendeur y collait ce
 * qu'il voulait, script compris, exécuté chez chaque visiteur — un admin
 * connecté inclus (audit du 2026-10-08). On parcourt la structure sans
 * présumer de sa forme exacte et on passe chaque `html` au nettoyeur.
 *
 * Appliqué à l'ENREGISTREMENT (le contenu malveillant n'entre plus) et à la
 * LECTURE publique (les tunnels déjà enregistrés sont couverts aussi).
 */
export function nettoyerBlocsHtml<T>(valeur: T): T {
  return parcourir(valeur, 0) as T;
}

function parcourir(v: unknown, profondeur: number): unknown {
  if (profondeur > 12 || v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map((x) => parcourir(x, profondeur + 1));
  const o = v as Record<string, unknown>;
  const copie: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(o)) copie[k] = parcourir(val, profondeur + 1);
  const data = copie.data as Record<string, unknown> | undefined;
  if (copie.type === "html" && data && typeof data.html === "string") {
    copie.data = { ...data, html: sanitizeRichHtml(data.html) };
  }
  return copie;
}
