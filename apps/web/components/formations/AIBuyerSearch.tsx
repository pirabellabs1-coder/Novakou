"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

/**
 * Assistant d'achat IA (v2 Phase 3) — recherche en langage naturel.
 *
 * L'acheteur décrit son besoin (« je veux apprendre à monter mes vidéos
 * TikTok ») ; on demande à l'IA (Puter.ai / Claude, gratuit côté client)
 * d'en extraire 2–5 mots-clés, puis on lance la recherche existante du
 * marketplace via `onKeywords`. En cas d'échec IA : repli sur la requête
 * brute (le site reste utilisable). Aucune clé secrète, aucun coût serveur.
 */

interface PuterChatResponse {
  message?: { content?: string | Array<{ text?: string }> };
}
// On évite de re-déclarer `Window.puter` (déjà augmenté ailleurs) : accès
// via un cast local pour ne pas entrer en conflit de déclaration globale.
type PuterAI = {
  ai: {
    chat: (
      prompt: string,
      options?: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean },
    ) => Promise<PuterChatResponse>;
  };
};
function getPuter(): PuterAI | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { puter?: PuterAI }).puter;
}

function extractText(res: PuterChatResponse): string {
  const c = res.message?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c.map((b) => (b && typeof b.text === "string" ? b.text : "")).join("");
  }
  return "";
}

export function AIBuyerSearch({ onKeywords }: { onKeywords: (keywords: string) => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  // Catalogue réel (titres + catégories) pour ancrer l'IA
  const catalogRef = useRef<{ titles: string[]; categories: string[] }>({ titles: [], categories: [] });

  useEffect(() => {
    fetch("/api/formations/public/catalog-terms")
      .then((r) => r.json())
      .then((j) => {
        catalogRef.current = { titles: j.titles ?? [], categories: j.categories ?? [] };
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    try {
      const puter = getPuter();
      const { titles, categories } = catalogRef.current;
      if (puter?.ai) {
        // On donne à l'IA le catalogue RÉEL : elle choisit des mots-clés qui
        // existent vraiment dans les titres/catégories disponibles.
        const catalogBlock =
          titles.length || categories.length
            ? `\n\nProduits réellement disponibles (titres) :\n- ${titles.slice(0, 60).join("\n- ")}\n\nCatégories disponibles : ${categories.join(", ")}\n`
            : "";
        const prompt = `Tu es l'assistant d'achat d'une marketplace de formations et produits digitaux (Afrique francophone).
Un acheteur décrit son besoin en langage naturel. En t'appuyant UNIQUEMENT sur le catalogue réel ci-dessous, déduis les 2 à 4 mots-clés de recherche les plus pertinents qui apparaissent dans les titres ou catégories disponibles (mots du domaine, pas la phrase de l'acheteur). Si rien ne correspond vraiment, renvoie les mots-clés les plus proches du besoin.
Réponds UNIQUEMENT par les mots-clés séparés par des espaces, sans phrase, sans ponctuation, sans guillemets.${catalogBlock}
Besoin de l'acheteur : "${q}"

Mots-clés :`;
        const res = await puter.ai.chat(prompt, {
          model: "claude-sonnet-4-6",
          temperature: 0.2,
          max_tokens: 40,
        });
        const kw = extractText(res)
          .replace(/["'\n.,;:]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        onKeywords(kw || q);
      } else {
        // Puter pas chargé → on cherche la requête brute
        onKeywords(q);
      }
    } catch {
      onKeywords(q);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
      <form
        onSubmit={handleSubmit}
        className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-[#006e2f] to-[#22c55e]"
      >
        <div className="flex items-center gap-2 bg-white rounded-[15px] px-3 py-2">
          <Sparkles size={18} className="text-[#006e2f] flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Décrivez votre besoin, l'IA trouve… (ex : monter mes vidéos TikTok)"
            className="flex-1 min-w-0 bg-transparent text-sm text-[#191c1e] placeholder:text-[#8aa092] outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#006e2f] to-[#22c55e] text-white text-xs font-bold px-3 py-1.5 disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {loading ? "Recherche…" : "Trouver"}
          </button>
        </div>
      </form>
    </>
  );
}
