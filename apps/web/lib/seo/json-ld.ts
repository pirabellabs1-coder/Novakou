/**
 * Sérialise des données structurées pour un `<script type="application/ld+json">`.
 *
 * `JSON.stringify` seul ne protège PAS : un titre de produit contenant
 * `</script><script>…` referme le bloc JSON-LD et le navigateur exécute ce
 * qui suit — sur novakou.com, pour tout visiteur. Les titres, descriptions et
 * noms de boutique sont saisis par les vendeurs : ils ne sont pas de confiance.
 *
 * On échappe donc `<`, `>` et `&` en séquences `\uXXXX` (du JSON valide,
 * lu à l'identique par les moteurs de recherche), ainsi que les séparateurs
 * de ligne Unicode (U+2028, U+2029) qui cassent un bloc script.
 */

// Construits par code, jamais écrits en clair : ces deux caractères sont des
// fins de ligne pour JavaScript et rendraient ce fichier même illisible.
const SEPARATEUR_LIGNE = String.fromCharCode(0x2028);
const SEPARATEUR_PARAGRAPHE = String.fromCharCode(0x2029);

export function jsonLdSafe(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(SEPARATEUR_LIGNE).join("\\u2028")
    .split(SEPARATEUR_PARAGRAPHE).join("\\u2029");
}
