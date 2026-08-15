"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { chatIA } from "@/lib/ai/client";

/**
 * Assistant d'achat IA (v2 Phase 3) — recherche en langage naturel.
 *
 * L'acheteur décrit son besoin (« je veux apprendre à monter mes vidéos
 * TikTok ») ; l'IA en extrait 2–4 mots-clés, puis on lance la recherche
 * existante du marketplace via `onKeywords`.
 *
 * L'appel passe par NOTRE serveur (`/api/ai/chat`) : la clé ne descend jamais
 * dans le navigateur, et l'usage est compté. En cas d'échec — quota atteint,
 * IA indisponible — on cherche la requête brute : la recherche marche
 * toujours, seule l'aide à la formulation disparaît.
 */

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
      const { titles, categories } = catalogRef.current;
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
      const texte = await chatIA(prompt, { usage: "recherche" });
      const kw = texte
        .replace(/["'\n.,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      onKeywords(kw || q);
    } catch {
      onKeywords(q);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
