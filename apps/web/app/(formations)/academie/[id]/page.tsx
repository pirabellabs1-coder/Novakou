import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Page publique, accessible sans connexion. DYNAMIQUE (le layout racine lit les
// en-têtes via next-intl → pas d'ISR statique sous peine de DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}
function embedUrl(url: string): string | null {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  const vm = vimeoId(url);
  if (vm) return `https://player.vimeo.com/video/${vm}`;
  return null;
}

async function getResource(id: string) {
  return prisma.academyResource
    .findFirst({
      where: { id, published: true },
      select: { id: true, title: true, description: true, type: true, url: true, thumbnail: true, category: true, views: true },
    })
    .catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = await getResource(id);
  if (!r) return { title: "Ressource introuvable — Académie Novakou" };
  const desc = (r.description ?? "").slice(0, 160) || `Ressource gratuite de l'Académie Novakou : ${r.title}.`;
  return {
    title: `${r.title} — Académie Novakou`,
    description: desc,
    openGraph: { title: r.title, description: desc, ...(r.thumbnail ? { images: [r.thumbnail] } : {}) },
  };
}

export default async function AcademieResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getResource(id);
  if (!r) notFound();

  // Compteur de vues (best-effort, n'impacte pas le rendu).
  prisma.academyResource.update({ where: { id: r.id }, data: { views: { increment: 1 } } }).catch(() => null);

  const embed = r.type === "VIDEO" ? embedUrl(r.url) : null;
  const typeLabel = r.type === "VIDEO" ? "Vidéo" : r.type === "PDF" ? "Guide PDF" : "Ressource";
  const ctaLabel =
    r.type === "VIDEO" ? "Regarder la vidéo" : r.type === "PDF" ? "Télécharger / Lire le guide" : "Ouvrir la ressource";

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="max-w-[1080px] mx-auto px-5 md:px-7 py-8 md:py-12">
        <Link href="/academie" className="inline-flex items-center gap-1 text-[13px] font-bold text-[#006e2f] hover:underline mb-6">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Retour à l'Académie
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-10 items-start">
          {/* Visuel / vidéo */}
          <div className="rounded-2xl overflow-hidden border border-[#e8ede9] bg-gradient-to-br from-[#06231a] to-[#0c3a26]">
            {embed ? (
              <div className="relative aspect-video">
                <iframe src={embed} title={r.title} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : r.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.thumbnail} alt={r.title} className="w-full aspect-[3/4] object-cover" />
            ) : (
              <div className="aspect-[3/4] flex flex-col items-center justify-center text-white p-8 text-center">
                <span className="text-[13px] font-bold tracking-[0.2em] opacity-80 mb-3">NOVAKOU</span>
                <span className="text-[22px] font-extrabold leading-tight">{r.title}</span>
                <span className="mt-4 text-[12px] font-bold px-3 py-1 rounded-full bg-white/15">{typeLabel} gratuit</span>
              </div>
            )}
          </div>

          {/* Infos + CTA */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#e6f5eb] text-[#006e2f]">{r.category}</span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#eef2ef] text-[#5c6b62]">{typeLabel}</span>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-[#d8a13a]/15 text-[#946312]">Gratuit</span>
            </div>

            <h1 className="text-[26px] md:text-[32px] font-extrabold text-[#13241b] leading-tight">{r.title}</h1>

            {r.description && (
              <p className="text-[15px] text-[#46514b] leading-relaxed mt-4 whitespace-pre-line">{r.description}</p>
            )}

            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center justify-center gap-2 w-full sm:w-auto text-white font-extrabold text-[15px] px-7 py-3.5 rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-transform"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[20px]">{r.type === "VIDEO" ? "play_circle" : "download"}</span>
              {ctaLabel}
            </a>

            <p className="text-[12px] text-[#5c6b62] mt-3">Ressource offerte par l'équipe Novakou — partagez-la librement.</p>

            <div className="mt-7 pt-5 border-t border-[#e8ede9] flex items-center gap-4 text-[12px] text-[#5c6b62]">
              <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">visibility</span> {r.views} consultations</span>
              <Link href="/academie" className="font-bold text-[#006e2f] hover:underline">Voir toutes les ressources →</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
