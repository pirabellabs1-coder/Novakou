"use client";

/**
 * Carousel horizontal infini de pills (types de produits vendables).
 * Style inspire de Chariow : 3 lignes qui defilent en sens alternes
 * pour un effet "showcase" immersif.
 * Pure CSS — aucune dependance externe.
 */

const ROW_1 = [
  "Formations vidéo", "Ebooks PDF", "Templates", "Coaching 1-to-1", "Mentorat",
  "Cours en ligne", "Masterclass", "Packs de ressources", "Bundles", "Membership",
  "Newsletters premium", "Abonnements", "Communautés privées",
];
const ROW_2 = [
  "Photos & presets", "Musiques & sons", "Illustrations", "Icônes & fonts",
  "Plugins", "Scripts", "Templates web", "Extensions", "Planificateurs Notion",
  "Guides pratiques", "Workbooks", "Checklists", "Tutoriels vidéo",
];
const ROW_3 = [
  "Certifications", "Webinaires", "Live events", "Podcasts premium", "Livres audio",
  "Plans de nutrition", "Programmes fitness", "Consulting", "Bilans de compétences",
  "Études de marché", "Rapports de recherche", "Cas pratiques", "Formations agréées",
];

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-[#191c1e] text-sm font-semibold whitespace-nowrap shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
      {label}
    </span>
  );
}

function MarqueeRow({ items, direction = "left" }: { items: string[]; direction?: "left" | "right" }) {
  // Double pour boucle seamless
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden relative" style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
      <div
        className="flex items-center gap-3 py-2"
        style={{
          animation: `nk-marquee-${direction} 50s linear infinite`,
          width: "max-content",
        }}
      >
        {doubled.map((label, i) => <Pill key={i} label={label} />)}
      </div>
      <style jsx>{`
        @keyframes nk-marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes nk-marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export function ProductCategoriesCarousel() {
  return (
    <div className="space-y-3">
      <MarqueeRow items={ROW_1} direction="left" />
      <MarqueeRow items={ROW_2} direction="right" />
      <MarqueeRow items={ROW_3} direction="left" />
    </div>
  );
}
