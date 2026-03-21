"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEntityTracker } from "@/lib/tracking/useEntityTracker";
import { Star, Clock, Users, Award, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface Formation {
  id: string;
  title: string;
  shortDesc: string | null;
  description: string | null;
  slug: string;
  thumbnail: string | null;
  previewVideo: string | null;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  duration: number;
  level: string;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  hasCertificate: boolean;
  learnPoints: string[];
  instructeur: {
    user: { name: string; image: string | null };
    bio: string | null;
  };
}

interface FunnelData {
  id: string;
  slug: string;
  blocks: Block[];
  formation: Formation;
}

function VideoEmbed({ url }: { url: string }) {
  let embedUrl = url;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return (
    <div className="aspect-video rounded-xl overflow-hidden">
      <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
        <span className="font-medium text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400">{a}</div>}
    </div>
  );
}

function BlockRenderer({ block, formation, onBuy }: { block: Block; formation: Formation; onBuy: () => void }) {
  const d = block.data;

  switch (block.type) {
    case "HERO":
      return (
        <div className="relative py-20 px-6 text-center rounded-2xl overflow-hidden" style={{ backgroundImage: d.bgImage ? `url(${d.bgImage})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
          {d.bgImage && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">{String(d.title || formation.title)}</h1>
            {d.subtitle && <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">{String(d.subtitle)}</p>}
            <button onClick={onBuy} className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-xl">
              {String(d.ctaText || "Acheter maintenant")}
            </button>
          </div>
        </div>
      );

    case "TEXT":
      return (
        <div className="prose dark:prose-invert max-w-none py-8 px-4" dangerouslySetInnerHTML={{ __html: String(d.content ?? "") }} />
      );

    case "IMAGE": {
      const sizeClass = d.size === "small" ? "max-w-sm mx-auto" : d.size === "full" ? "w-full" : "max-w-2xl mx-auto";
      return d.url ? (
        <div className={`py-6 ${sizeClass}`}>
          <img src={String(d.url)} alt={String(d.alt ?? "")} className="w-full rounded-xl" />
          {d.alt && <p className="text-center text-sm text-slate-500 mt-2">{String(d.alt)}</p>}
        </div>
      ) : null;
    }

    case "VIDEO":
      return d.url ? <div className="py-6 max-w-3xl mx-auto"><VideoEmbed url={String(d.url)} /></div> : null;

    case "COLUMNS": {
      const count = Number(d.count ?? 2);
      return (
        <div className={`py-8 grid gap-6 ${count === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-sm text-slate-700 dark:text-slate-300">
              {String(d[`col${i}`] ?? "")}
            </div>
          ))}
        </div>
      );
    }

    case "PRICING":
      return (
        <div className="py-12 text-center">
          <div className="inline-block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-lg">
            <h3 className="text-lg font-bold mb-2">{formation.title}</h3>
            <div className="flex items-center justify-center gap-3 mb-4">
              {formation.originalPrice && formation.originalPrice > formation.price && (
                <span className="text-2xl text-slate-400 line-through">{formation.originalPrice}€</span>
              )}
              <span className="text-4xl font-black text-primary">{formation.isFree ? "Gratuit" : `${formation.price}€`}</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-6">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {Math.round(formation.duration / 60)}h</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {formation.studentsCount} inscrits</span>
              {formation.hasCertificate && <span className="flex items-center gap-1"><Award className="w-4 h-4" /> Certificat</span>}
            </div>
            {formation.learnPoints.length > 0 && (
              <ul className="text-left space-y-2 mb-6">
                {formation.learnPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {p}</li>
                ))}
              </ul>
            )}
            <button onClick={onBuy} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl text-lg transition-colors">
              {formation.isFree ? "S'inscrire gratuitement" : "Acheter maintenant"}
            </button>
          </div>
        </div>
      );

    case "TESTIMONIALS": {
      const items = Array.isArray(d.items) ? d.items : [];
      return items.length > 0 ? (
        <div className="py-10">
          <h2 className="text-2xl font-bold text-center mb-8">Ce qu&apos;en disent nos étudiants</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((t: { name: string; text: string; rating: number }, i: number) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating || 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">&ldquo;{t.text}&rdquo;</p>
                <p className="text-sm font-semibold">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null;
    }

    case "FAQ": {
      const items = Array.isArray(d.items) ? d.items : [];
      return items.length > 0 ? (
        <div className="py-10 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-2">
            {items.map((item: { q: string; a: string }, i: number) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      ) : null;
    }

    case "CTA":
      return (
        <div className="py-10 text-center">
          <button onClick={onBuy} className="bg-primary hover:bg-primary/90 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg">
            {String(d.text || "Commencer la formation")}
          </button>
        </div>
      );

    default:
      return null;
  }
}

export default function SalesFunnelPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  // Track formation view
  useEntityTracker("formation", data?.formation?.id ?? null);

  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/formations/vente/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setData(d.funnel);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  const handleBuy = () => {
    if (!data) return;
    router.push(`/formations/checkout?formationId=${data.formation.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
        <p className="text-slate-500">Cette page de vente n&apos;existe pas ou n&apos;est pas publiée.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4">
        {data.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} formation={data.formation} onBuy={handleBuy} />
        ))}
      </div>
    </div>
  );
}
