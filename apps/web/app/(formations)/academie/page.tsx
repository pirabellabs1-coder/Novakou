"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Resource {
  id: string; title: string; description: string | null; type: string; url: string; thumbnail: string | null; category: string;
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function thumbOf(r: Resource): string | null {
  if (r.thumbnail) return r.thumbnail;
  const yt = youtubeId(r.url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return null;
}

export default function AcademiePage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [status, setStatus] = useState<"loading" | "ok">("loading");

  useEffect(() => {
    fetch("/api/formations/academy")
      .then(async (r) => {
        const j = await r.json().catch(() => ({ data: [] }));
        setItems(j.data ?? []); setStatus("ok");
      })
      .catch(() => setStatus("ok"));
  }, []);

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="max-w-[1100px] mx-auto px-5 md:px-7 py-8 md:py-12">
        <div className="mb-8">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#006e2f] mb-2">Académie Novakou</p>
          <h1 className="text-[30px] md:text-[38px] font-extrabold text-[#13241b] leading-tight">Apprenez à vendre et à réussir</h1>
          <p className="text-[15px] text-[#5c6b62] mt-2 max-w-2xl">Formations vidéo, guides PDF et ressources gratuites — pour tirer le meilleur de Novakou. Accessible à tous, même sans compte. Mis à jour régulièrement par l'équipe.</p>
        </div>

        {status === "loading" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-56 rounded-2xl bg-white animate-pulse border border-[#e8ede9]" />)}
          </div>
        )}

        {status === "ok" && items.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e8ede9] p-10 text-center">
            <p className="text-[15px] text-[#13241b] font-bold">Les premières ressources arrivent bientôt 🎓</p>
            <p className="text-[13px] text-[#5c6b62] mt-1">Revenez très vite — l'équipe Novakou prépare du contenu pour vous aider à vendre plus.</p>
          </div>
        )}

        {status === "ok" && categories.map((cat) => (
          <section key={cat} className="mb-10">
            <h2 className="text-[18px] font-extrabold text-[#13241b] mb-4">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.filter((i) => i.category === cat).map((r) => {
                const thumb = thumbOf(r);
                const badge = r.type === "VIDEO" ? "▶ Vidéo" : r.type === "PDF" ? "PDF" : "Lien";
                const cta = r.type === "VIDEO" ? "Regarder" : r.type === "PDF" ? "Lire le guide" : "Ouvrir";
                return (
                  <Link key={r.id} href={`/academie/${r.id}`} className="flex flex-col text-left bg-white rounded-2xl border border-[#e8ede9] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="relative aspect-video bg-gradient-to-br from-[#06231a] to-[#0c3a26] flex items-center justify-center overflow-hidden">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <span className="text-white/90 font-extrabold text-[20px]">Novakou</span>
                      )}
                      <span className="absolute top-2 left-2 text-[10.5px] font-extrabold px-2 py-1 rounded-full bg-white/90 text-[#13241b]">{badge}</span>
                      <span className="absolute top-2 right-2 text-[10px] font-extrabold px-2 py-1 rounded-full bg-[#d8a13a] text-[#052e16]">Gratuit</span>
                    </div>
                    <div className="p-3.5 flex flex-col flex-1">
                      <p className="font-extrabold text-[14px] text-[#13241b] leading-snug">{r.title}</p>
                      {r.description && <p className="text-[12px] text-[#5c6b62] mt-1 line-clamp-2 flex-1">{r.description}</p>}
                      <span className="inline-flex items-center gap-1 mt-3 text-[12.5px] font-extrabold text-[#006e2f] group-hover:gap-2 transition-all">
                        {cta} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
