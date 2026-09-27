import type { Metadata } from "next";
import Link from "next/link";
import { OldGuideJsonLd } from "@/components/formations/OldGuideJsonLd";
import {
  CarteActionGuide,
  CoqueGuide,
  SuiteGuides,
} from "@/components/formations/public/article/CoqueGuide";
import {
  Astuce,
  Attention,
  Etape,
  EtiquetteGuide,
  FigureGuide,
  ProAstuce,
  SectionGuide,
} from "@/components/formations/public/article/EncadresGuide";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Guide complet Novakou",
)}&subtitle=${encodeURIComponent(
  "De l'inscription à votre première vente : tout savoir sur Novakou",
)}`;

export const metadata: Metadata = {
  // `absolute` : « Novakou » est deja dans le titre. Sans ça, le template
  // du layout racine ajoute « | Novakou » et le nom sort deux fois.
  title: { absolute: "Guide complet Novakou : vendre formation" },
  description:
    "Tutoriel pas-à-pas pour créer votre boutique, publier formations et ebooks, configurer Mobile Money, et recevoir vos premiers paiements sur Novakou.",
  alternates: {
    canonical: "/guides/guide-complet-novakou",
  },
  openGraph: {
    title: "Guide complet Novakou : vendre formation | Novakou",
    description:
      "Tutoriel pas-à-pas : boutique, formations, Mobile Money, tunnels de vente. Tout pour démarrer sur Novakou.",
    type: "article",
    url: `${APP_URL}/guides/guide-complet-novakou`,
    siteName: "Novakou",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guide complet Novakou : vendre formation | Novakou",
    description:
      "Tutoriel pas-à-pas : boutique, formations, Mobile Money, tunnels de vente. Tout pour démarrer sur Novakou.",
    images: [OG_IMAGE],
  },
};

/* ------------------------------------------------------------------ */
/*  CSS-only interface mockups                                         */
/* ------------------------------------------------------------------ */
function MockDashboard() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/dashboard</span>
      </div>
      <div className="p-5">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#5c6b62" }}>Tableau de bord</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Ventes", value: "\u2014", sub: "Ce mois", color: "#006e2f" },
            { label: "Revenus", value: "\u2014 F", sub: "Ce mois", color: "#2563eb" },
            { label: "Clients", value: "\u2014", sub: "Cette semaine", color: "#7c3aed" },
            { label: "Taux conversion", value: "\u2014", sub: "Tunnel principal", color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 border" style={{ borderColor: "#e5eae1" }}>
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "#5c6b62" }}>{s.label}</div>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] mt-1" style={{ color: "#4c9a6b" }}>{s.sub}</div>
            </div>
          ))}
        </div>
        {/* Mini chart placeholder */}
        <div className="mt-4 rounded-xl p-4 border" style={{ borderColor: "#e5eae1" }}>
          <div className="text-xs font-bold mb-2" style={{ color: "#5c6b62" }}>Revenus des 7 derniers jours</div>
          <div className="flex items-end gap-1 h-16">
            {[40, 55, 35, 70, 60, 80, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === 6 ? "#006e2f" : "#d1fae5" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockBoutiqueConfig() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/boutique/personnaliser</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-4" style={{ color: "#0e1512" }}>Personnaliser ma boutique</div>
        <div className="grid gap-3">
          {["Nom de la boutique", "Description", "Couleur principale"].map((label) => (
            <div key={label}>
              <div className="text-xs font-semibold mb-1" style={{ color: "#5c6b62" }}>{label}</div>
              <div className="h-9 rounded-lg border px-3 flex items-center text-sm" style={{ borderColor: "#e5eae1", color: "#a3a3a3" }}>
                {label === "Couleur principale" ? (
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: "#006e2f", borderColor: "#e5eae1" }} />
                    <span>#006e2f</span>
                  </div>
                ) : (
                  `Entrez ${label.toLowerCase()}...`
                )}
              </div>
            </div>
          ))}
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "#5c6b62" }}>Logo</div>
            <div className="h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-xs" style={{ borderColor: "#d1d5db", color: "#5c6b62" }}>
              Glissez votre logo ici ou cliquez pour uploader
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockFormationEditor() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/formations/nouvelle</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-4" style={{ color: "#0e1512" }}>Editeur de formation</div>
        <div className="flex gap-4 flex-col md:flex-row">
          {/* Sidebar modules */}
          <div className="md:w-56 flex-shrink-0 rounded-xl border p-3" style={{ borderColor: "#e5eae1" }}>
            <div className="text-[11px] uppercase font-bold tracking-wider mb-2" style={{ color: "#5c6b62" }}>Modules</div>
            {["1. Introduction", "2. Les bases", "3. Pratique"].map((m, i) => (
              <div key={m} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-1" style={{ backgroundColor: i === 0 ? "#e5eae1" : "transparent", color: "#0e1512" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: i === 0 ? "#006e2f" : "#d1d5db" }} />
                {m}
              </div>
            ))}
            <div className="text-[11px] mt-2 px-2 py-1.5 rounded-lg cursor-pointer" style={{ color: "#4c9a6b" }}>+ Ajouter un module</div>
          </div>
          {/* Main area */}
          <div className="flex-1 space-y-3">
            <div className="h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center" style={{ borderColor: "#d1d5db", color: "#5c6b62" }}>
              <span className="text-2xl mb-1">&#x1F3AC;</span>
              <span className="text-xs">Uploadez votre video ou collez un lien YouTube</span>
            </div>
            <div className="h-8 rounded-lg border px-3 flex items-center text-sm" style={{ borderColor: "#e5eae1", color: "#a3a3a3" }}>Titre de la lecon...</div>
            <div className="h-20 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#e5eae1", color: "#a3a3a3" }}>Description de la lecon...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockFunnelBuilder() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/tunnels/builder</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-4" style={{ color: "#0e1512" }}>Builder de tunnel</div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[
            { label: "Page de capture", icon: "&#x1F4E7;", active: true },
            { label: "Page de vente", icon: "&#x1F4B0;", active: false },
            { label: "Checkout", icon: "&#x1F6D2;", active: false },
            { label: "Merci", icon: "&#x2705;", active: false },
          ].map((p) => (
            <div key={p.label} className="flex-shrink-0 w-36 rounded-xl border-2 p-3 text-center" style={{ borderColor: p.active ? "#006e2f" : "#e5eae1", backgroundColor: p.active ? "#f0f6f2" : "#ffffff" }}>
              <div className="text-xl mb-1" dangerouslySetInnerHTML={{ __html: p.icon }} />
              <div className="text-[11px] font-semibold" style={{ color: p.active ? "#006e2f" : "#5c6b62" }}>{p.label}</div>
            </div>
          ))}
        </div>
        {/* Block palette */}
        <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "#e5eae1" }}>
          <div className="text-[11px] uppercase font-bold tracking-wider mb-2" style={{ color: "#5c6b62" }}>Blocs disponibles</div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {["Hero", "Temoignages", "Prix", "FAQ", "Garantie", "CTA"].map((b) => (
              <div key={b} className="rounded-lg border p-2 text-center text-[11px] hover:border-green-400 cursor-pointer" style={{ borderColor: "#e5eae1", color: "#0e1512" }}>
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockPaymentConfig() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/paiements</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-4" style={{ color: "#0e1512" }}>Moyens de paiement</div>
        <div className="grid gap-3">
          {[
            { name: "Orange Money", region: "Senegal, Cote d'Ivoire, Cameroun", status: "Actif", color: "#f97316" },
            { name: "Wave", region: "Senegal, Cote d'Ivoire", status: "Actif", color: "#3b82f6" },
            { name: "MTN MoMo", region: "Cameroun, Cote d'Ivoire", status: "En attente", color: "#eab308" },
            { name: "Carte bancaire", region: "International", status: "Actif", color: "#7c3aed" },
          ].map((pm) => (
            <div key={pm.name} className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: "#e5eae1" }}>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: pm.color }}>
                  {pm.name[0]}
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#0e1512" }}>{pm.name}</div>
                  <div className="text-[11px]" style={{ color: "#5c6b62" }}>{pm.region}</div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: pm.status === "Actif" ? "#dcfce7" : "#fef3c7", color: pm.status === "Actif" ? "#006e2f" : "#92400e" }}>
                {pm.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockEmailAutomation() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/emails/sequences</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-4" style={{ color: "#0e1512" }}>Sequences email</div>
        <div className="space-y-2">
          {[
            { delay: "Immediat", subject: "Bienvenue ! Voici votre acces", status: "Envoye" },
            { delay: "J+1", subject: "Comment bien demarrer votre formation", status: "Programme" },
            { delay: "J+3", subject: "Avez-vous termine le Module 1 ?", status: "Programme" },
            { delay: "J+7", subject: "Votre certificat vous attend", status: "Programme" },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-16 text-right text-[11px] font-bold flex-shrink-0" style={{ color: "#006e2f" }}>{e.delay}</div>
              <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: "#e5eae1" }} />
              <div className="flex-1 rounded-lg border p-2 flex items-center justify-between" style={{ borderColor: "#e5eae1" }}>
                <span className="text-xs" style={{ color: "#0e1512" }}>{e.subject}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: i === 0 ? "#dcfce7" : "#e5eae1", color: i === 0 ? "#006e2f" : "#5c6b62" }}>{e.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockAffiliation() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/affiliation</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-4" style={{ color: "#0e1512" }}>Programme d&apos;affiliation</div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Affilies actifs", value: "24" },
            { label: "Clics ce mois", value: "1 842" },
            { label: "Commissions versees", value: "126 500 F" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-3 text-center" style={{ borderColor: "#e5eae1" }}>
              <div className="text-lg font-bold" style={{ color: "#006e2f" }}>{s.value}</div>
              <div className="text-[11px]" style={{ color: "#5c6b62" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: "#e5eae1" }}>
          <div className="text-[11px] font-bold mb-1" style={{ color: "#5c6b62" }}>Votre lien d&apos;affiliation</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xs bg-gray-50 rounded-lg px-3 py-2 font-mono" style={{ color: "#0e1512" }}>https://novakou.com/r/votre-code</div>
            <div className="text-[11px] font-bold px-3 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: "#006e2f", color: "#ffffff" }}>Copier</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockWithdrawal() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/finances/retraits</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-3" style={{ color: "#0e1512" }}>Demander un retrait</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border p-3" style={{ borderColor: "#e5eae1" }}>
            <div className="text-[11px]" style={{ color: "#5c6b62" }}>Solde disponible</div>
            <div className="text-lg font-bold" style={{ color: "#4c9a6b" }}>423 000 F</div>
          </div>
          <div className="rounded-xl border p-3" style={{ borderColor: "#e5eae1" }}>
            <div className="text-[11px]" style={{ color: "#5c6b62" }}>En attente</div>
            <div className="text-lg font-bold" style={{ color: "#f59e0b" }}>85 000 F</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold" style={{ color: "#5c6b62" }}>Methode de retrait</div>
          <div className="flex gap-2">
            {["Orange Money", "Wave", "Virement"].map((m, i) => (
              <div key={m} className="flex-1 text-center rounded-lg border-2 py-2 text-xs font-semibold cursor-pointer" style={{ borderColor: i === 0 ? "#006e2f" : "#e5eae1", color: i === 0 ? "#006e2f" : "#5c6b62", backgroundColor: i === 0 ? "#f0f6f2" : "#ffffff" }}>
                {m}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockEbookUpload() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/produits/nouveau</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-4" style={{ color: "#0e1512" }}>Nouveau produit numerique</div>
        <div className="flex gap-3 mb-4">
          {["Ebook / PDF", "Template", "Audio", "Autre"].map((t, i) => (
            <div key={t} className="flex-1 text-center rounded-lg border-2 py-2 text-xs font-semibold cursor-pointer" style={{ borderColor: i === 0 ? "#006e2f" : "#e5eae1", color: i === 0 ? "#006e2f" : "#5c6b62" }}>
              {t}
            </div>
          ))}
        </div>
        <div className="h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center mb-3" style={{ borderColor: "#d1d5db", color: "#5c6b62" }}>
          <span className="text-2xl mb-1">&#x1F4DA;</span>
          <span className="text-xs">Glissez votre fichier PDF, EPUB ou ZIP ici</span>
          <span className="text-[10px] mt-1" style={{ color: "#a3a3a3" }}>Max 500 Mo</span>
        </div>
        <div className="h-8 rounded-lg border px-3 flex items-center text-sm" style={{ borderColor: "#e5eae1", color: "#a3a3a3" }}>Prix en FCFA...</div>
      </div>
    </div>
  );
}

function MockAIAssistant() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/ia</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-4" style={{ color: "#0e1512" }}>Assistant IA Novakou</div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: "#e5eae1" }}>&#x1F9D1;</span>
            <div className="rounded-xl rounded-tl-none p-3 text-xs leading-relaxed" style={{ backgroundColor: "#f3f4f6", color: "#0e1512" }}>
              Genere-moi un plan de cours sur le marketing digital pour debutants en Afrique
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: "#006e2f", color: "#ffffff" }}>IA</span>
            <div className="rounded-xl rounded-tl-none p-3 text-xs leading-relaxed" style={{ backgroundColor: "#f0f6f2", color: "#0e1512" }}>
              <p className="font-bold mb-1">Voici un plan en 5 modules :</p>
              <p>Module 1 : Les fondamentaux du marketing digital</p>
              <p>Module 2 : Créer sa presence sur les reseaux sociaux</p>
              <p>Module 3 : Publicite Facebook & Instagram</p>
              <p>Module 4 : Email marketing et funnels</p>
              <p>Module 5 : Monetiser son audience</p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-9 rounded-lg border px-3 flex items-center text-xs" style={{ borderColor: "#e5eae1", color: "#a3a3a3" }}>Demandez a l&apos;IA...</div>
          <div className="h-9 px-4 rounded-lg flex items-center text-xs font-bold cursor-pointer" style={{ backgroundColor: "#006e2f", color: "#ffffff" }}>Envoyer</div>
        </div>
      </div>
    </div>
  );
}

function MockAnalytics() {
  return (
    <div className="rounded-2xl overflow-hidden border my-8" style={{ borderColor: "#e5eae1", backgroundColor: "#ffffff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#e5eae1", backgroundColor: "#f0f6f2" }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4c9a6b" }} />
        <span className="ml-2 text-xs" style={{ color: "#5c6b62" }}>novakou.com/admin/analytics</span>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold mb-4" style={{ color: "#0e1512" }}>Analytics</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {[
            { label: "Visiteurs", value: "3 241", change: "+12%" },
            { label: "Taux de conversion", value: "4.2%", change: "+0.8%" },
            { label: "Panier moyen", value: "18 500 F", change: "+5%" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: "#e5eae1" }}>
              <div className="text-[11px]" style={{ color: "#5c6b62" }}>{s.label}</div>
              <div className="text-base font-bold" style={{ color: "#0e1512" }}>{s.value}</div>
              <div className="text-[11px] font-bold" style={{ color: "#4c9a6b" }}>{s.change}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "#e5eae1" }}>
          <div className="text-[11px] font-bold mb-2" style={{ color: "#5c6b62" }}>Sources de trafic</div>
          {[
            { label: "Facebook", pct: 42 },
            { label: "WhatsApp", pct: 28 },
            { label: "Google", pct: 18 },
            { label: "Direct", pct: 12 },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] w-16" style={{ color: "#0e1512" }}>{s.label}</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#e5eae1" }}>
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: "#006e2f" }} />
              </div>
              <span className="text-[11px] w-8 text-right font-bold" style={{ color: "#5c6b62" }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TOC = [
  { id: "introduction", n: 1, title: "Qu'est-ce que Novakou et pourquoi cette plateforme", time: "2 min" },
  { id: "creer-compte", n: 2, title: "Créer son compte vendeur", time: "3 min" },
  { id: "configurer-boutique", n: 3, title: "Configurer sa boutique", time: "5 min" },
  { id: "creer-formation", n: 4, title: "Créer sa premiere formation video", time: "10 min" },
  { id: "creer-ebook", n: 5, title: "Créer un ebook ou template", time: "5 min" },
  { id: "paiements", n: 6, title: "Configurer les moyens de paiement", time: "5 min" },
  { id: "tunnel-vente", n: 7, title: "Créer son premier tunnel de vente", time: "8 min" },
  { id: "ia", n: 8, title: "Utiliser l'IA pour générer du contenu", time: "5 min" },
  { id: "emails", n: 9, title: "Configurer les emails automatiques", time: "5 min" },
  { id: "affiliation", n: 10, title: "Mettre en place le programme d'affiliation", time: "5 min" },
  { id: "analytics", n: 11, title: "Analyser son tableau de bord", time: "5 min" },
  { id: "optimiser", n: 12, title: "10 astuces pour multiplier ses ventes par 3", time: "8 min" },
  { id: "retraits", n: 13, title: "Configurer les retraits et recevoir son argent", time: "3 min" },
  { id: "faq", n: 14, title: "FAQ : 15 questions les plus posees", time: "5 min" },
  { id: "conclusion", n: 15, title: "Conclusion et prochaines étapes", time: "2 min" },
];

export default function GuideCompletNovakou() {
  return (
    <>
      <OldGuideJsonLd slug="guide-complet-novakou" />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: "Guide complet Novakou" },
        ]}
        eyebrow="Guide complet"
        titre={<>Le guide complet Novakou : de l&apos;inscription a votre premiere vente</>}
        sousTitre="Tout ce que vous devez savoir pour créer votre boutique, publier vos formations et ebooks, configurer vos paiements Mobile Money, construire des tunnels de vente qui convertissent, et commencer a gagner de l'argent avec vos savoirs. Pas a pas. Sans jargon technique."
        infos={[
          { texte: "20 min de lecture" },
          { texte: "Mis a jour le 25 avril 2026" },
          { texte: "15 sections" },
        ]}
        couverture={{
          src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
          alt: "Un créateur africain gère sa boutique et ses formations en ligne sur Novakou",
        }}
        titreSommaire="Sommaire"
        sommaire={TOC.map((t) => ({
          id: t.id,
          label: t.title,
          n: String(t.n),
          suffixe: t.time,
        }))}
        fin={
          <>
            <CarteActionGuide
              titre="Pret a lancer votre premiere vente ?"
              action={{ href: "/inscription?role=vendeur", libelle: "Créer mon compte vendeur gratuitement" }}
              note={<>Déjà inscrit ?{" "} <Link href="/connexion" className="underline"> Connectez-vous </Link></>}
            >
              <p>Créez votre compte vendeur gratuitement en moins de 3 minutes. <br />Pas de carte bancaire requise. Pas d&apos;engagement.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Guides complementaires"
              liens={[
                { href: "/guides/creer-son-produit", titre: "Créer son produit : le guide du debutant", etiquette: "12 min" },
                { href: "/guides/vendre-en-ligne", titre: "Vendre en ligne en Afrique : stratégies qui fonctionnent", etiquette: "15 min" },
              ]}
            />
          </>
        }
      >
        <SectionGuide
          id="introduction"
          n="1"
          titre={<>Qu'est-ce que Novakou et pourquoi choisir cette plateforme</>}
          apres={<EtiquetteGuide>2 min de lecture</EtiquetteGuide>}
        >
          <p>
            Novakou est la premiere plateforme de vente de formations et de produits numeriques concue
            specifiquement pour les createurs africains et francophones. Si vous avez un savoir, une
            competence, une expertise — que ce soit en marketing, en cuisine, en couture, en developpement
            web, en langues ou en n&apos;importe quel autre domaine — Novakou vous permet de le transformer
            en revenus recurrents.
          </p>

          <p>
            Contrairement aux plateformes occidentales qui ne comprennent pas les realites africaines
            (paiements Mobile Money, connexions intermittentes, besoins en langues locales), Novakou a
            ete construite de zero pour repondre a ces defis. Voici ce qui fait la difference :
          </p>

          <div className="grid gap-3 my-6">
            {[
              { title: "Paiements Mobile Money natifs", desc: "Orange Money, Wave, MTN MoMo integres nativement. Vos clients paient comme ils en ont l'habitude." },
              { title: "Hebergement video sécurisé", desc: "Vos videos sont hebergees directement sur Novakou, protegees contre le téléchargement, avec streaming adaptatif meme en 3G." },
              { title: "Tunnels de vente integres", desc: "Plus besoin de Systeme.io ou ClickFunnels. Construisez vos pages de vente et de capture directement dans Novakou." },
              { title: "Assistant IA", desc: "L'IA vous aide a créer vos plans de cours, rediger vos pages de vente, et générer des quiz en quelques clics." },
              { title: "Programme d'affiliation", desc: "Activez le bouche-a-oreille en offrant des commissions a ceux qui recommandent vos produits." },
              { title: "Zero frais caches", desc: "Pas d'abonnement obligatoire pour demarrer. Vous ne payez qu'une commission sur vos ventes reelles." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: "#e5eae1" }}>
                <span className="text-lg mt-0.5" style={{ color: "#4c9a6b" }}>&#x2714;</span>
                <div>
                  <div className="text-sm font-bold mb-0.5" style={{ color: "#0e1512" }}>{item.title}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: "#5c6b62" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <p>
            Que vous soyez formateur, coach, auteur, consultant, artisan ou entrepreneur, ce guide
            vous accompagne de A a Z. A la fin, vous aurez une boutique en ligne fonctionnelle, un
            premier produit publie, et tous les outils pour réaliser votre premiere vente.
          </p>

          <Astuce titre="Astuce">
            <p>Vous n&apos;avez pas besoin de competences techniques pour suivre ce guide. Si vous savez
            utiliser WhatsApp et Facebook, vous savez utiliser Novakou.</p>
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="creer-compte"
          n="2"
          titre={<>Créer son compte vendeur (étape par étape)</>}
          apres={<EtiquetteGuide>3 min</EtiquetteGuide>}
        >
          <p>
            La creation de votre compte vendeur est la porte d&apos;entree vers Novakou. Le processus est
            concu pour etre rapide — vous pouvez etre operationnel en moins de 3 minutes.
          </p>

          <Etape n={1}>
            <p>
            <strong>Allez sur la page d&apos;inscription :</strong> Rendez-vous sur{" "}
            <Link href="/inscription?role=vendeur">novakou.com/inscription</Link>{" "}
            et selectionnez le role <strong>&quot;Vendeur&quot;</strong>. Vous pouvez aussi
            arriver directement via le lien <code style={{ backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>novakou.com/inscription?role=vendeur</code>.
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Remplissez vos informations :</strong> Prenom, nom, adresse email, mot de passe.
            Vous pouvez aussi vous inscrire en un clic avec votre compte Google. Le mot de passe doit
            contenir au minimum 8 caracteres.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Vérifiez votre e-mail&nbsp;:</strong> Un code de vérification à 6 chiffres sera envoyé à
            l&apos;adresse email que vous avez fournie. Copiez-le et collez-le dans le champ de vérification.
            Le code expire après 10 minutes.
            </p>
          </Etape>

          <Etape n={4}>
            <p>
            <strong>Complétez votre profil :</strong> Ajoutez une photo de profil, une biographie courte
            et votre domaine d&apos;expertise. Ces informations apparaitront sur votre boutique publique.
            </p>
          </Etape>

          <Attention titre="Attention">
            <p>Utilisez une adresse email que vous consultez regulierement. C&apos;est sur cette adresse
            que vous recevrez les notifications de ventes, les messages de vos clients et les confirmations
            de retrait. Une adresse Gmail ou Yahoo est parfaite.</p>
          </Attention>

          <ProAstuce titre="Pro tip">
            <p>Si vous comptez créer une marque, utilisez un email professionnel (ex: contact@votre-marque.com).
            Cela renforce la confiance de vos futurs clients.</p>
          </ProAstuce>
        </SectionGuide>

        <SectionGuide
          id="configurer-boutique"
          n="3"
          titre={<>Configurer sa boutique</>}
          apres={<EtiquetteGuide>5 min</EtiquetteGuide>}
        >
          <p>
            Votre boutique est votre vitrine en ligne. C&apos;est la premiere chose que vos clients voient.
            Prenez le temps de la configurer correctement — cela fait toute la difference entre une boutique
            qui inspire confiance et une qui fait fuir les visiteurs.
          </p>

          <div className="nka-maq">
            <MockBoutiqueConfig />
          </div>

          <Etape n={1}>
            <p>
            <strong>Nom de la boutique :</strong> Choisissez un nom memorable et facile a retenir.
            Evitez les noms trop longs ou compliques. Par exemple : &quot;Academy Fatou&quot;,
            &quot;Digital Skills Africa&quot;, &quot;Chef Moussa Formation&quot;.
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Logo :</strong> Uploadez un logo au format PNG ou JPG, idealement sur fond
            transparent. Taille recommandee : 400x400 pixels minimum. Si vous n&apos;avez pas de logo,
            utilisez Canva pour en créer un gratuitement en 5 minutes.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Description :</strong> Redigez 2-3 phrases qui expliquent ce que vous proposez et
            a qui vous vous adressez. Soyez specifique : &quot;J&apos;aide les entrepreneurs africains a
            maitriser le marketing digital pour developper leur business en ligne&quot; est mieux que
            &quot;Formation en ligne&quot;.
            </p>
          </Etape>

          <Etape n={4}>
            <p>
            <strong>Couleurs :</strong> Choisissez une couleur principale qui represente votre marque.
            Novakou adapte automatiquement les teintes secondaires. Si vous n&apos;avez pas de préférence,
            la couleur par defaut fonctionne très bien.
            </p>
          </Etape>

          <Etape n={5}>
            <p>
            <strong>Domaine personnalise (optionnel) :</strong> Par defaut, votre boutique est accessible
            via <code style={{ backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>novakou.com/votre-nom</code>.
            Vous pouvez connecter votre propre nom de domaine pour un aspect plus professionnel.
            </p>
          </Etape>

          <Astuce titre="Astuce">
            <p>Prenez une photo de profil professionnelle avec un sourire et un fond neutre.
            Les boutiques avec une vraie photo de l&apos;instructeur convertissent 35% mieux que celles avec
            un avatar generique.</p>
          </Astuce>

          {/* ── Image: boutique en action ──────────────────────────── */}
          <FigureGuide
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80"
            alt="Tableau de bord analytics — suivez vos ventes et vos apprenants en temps réel"
            legende="Votre tableau de bord Novakou centralise tout : ventes, apprenants, revenus et performances."
          />
        </SectionGuide>

        <SectionGuide
          id="creer-formation"
          n="4"
          titre={<>Créer sa premiere formation video</>}
          apres={<EtiquetteGuide>10 min</EtiquetteGuide>}
        >
          <p>
            C&apos;est le coeur de votre activité sur Novakou. Une formation bien structuree avec des videos
            de qualité est le moyen le plus efficace de monetiser vos connaissances. Voici comment
            proceder, étape par étape.
          </p>

          <div className="nka-maq">
            <MockFormationEditor />
          </div>

          <h3 className="text-lg mt-8 mb-3">A. Structurer votre formation</h3>

          <p>
            Une bonne formation est organisee en <strong>modules</strong> (les grandes parties) qui contiennent
            des <strong>lecons</strong> (les chapitres individuels). Voici une structure type :
          </p>

          <div className="rounded-xl border p-4 my-6" style={{ borderColor: "#e5eae1" }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5c6b62" }}>Exemple de structure</div>
            {[
              { module: "Module 1 : Introduction", lessons: ["Bienvenue et presentation", "Ce que vous allez apprendre", "Comment tirer le meilleur de cette formation"] },
              { module: "Module 2 : Les fondamentaux", lessons: ["Concept cle n.1", "Concept cle n.2", "Exercice pratique"] },
              { module: "Module 3 : Mise en pratique", lessons: ["Projet guide", "Etude de cas", "Quiz de validation"] },
            ].map((m) => (
              <div key={m.module} className="mb-3 last:mb-0">
                <div className="text-sm font-bold mb-1" style={{ color: "#006e2f" }}>{m.module}</div>
                {m.lessons.map((l) => (
                  <div key={l} className="flex items-center gap-2 text-[13px] ml-4 py-0.5" style={{ color: "#0e1512" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#4c9a6b" }} />
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <Etape n={1}>
            <p>
            <strong>Créez un nouveau produit :</strong> Dans votre tableau de bord, cliquez sur
            <strong> &quot;Nouveau produit&quot;</strong> puis selectionnez <strong>&quot;Formation video&quot;</strong>.
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Donnez un titre accrocheur :</strong> Votre titre doit contenir le bénéfice principal.
            Par exemple : &quot;Maitriser Instagram : de 0 a 10 000 abonnes en 60 jours&quot; est bien meilleur
            que &quot;Cours Instagram&quot;.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Ajoutez vos modules :</strong> Cliquez sur &quot;+ Ajouter un module&quot; pour créer chaque grande
            section de votre formation. Renommez-les avec des titres clairs.
            </p>
          </Etape>

          <Etape n={4}>
            <p>
            <strong>Ajoutez vos lecons dans chaque module :</strong> Pour chaque module, ajoutez les lecons
            individuelles. Donnez un titre, une description, puis uploadez votre video.
            </p>
          </Etape>

          <Etape n={5}>
            <p>
            <strong>Uploadez vos videos :</strong> Glissez vos fichiers video directement dans l&apos;editeur.
            Novakou accepte les formats MP4, MOV et WEBM. La taille maximale est de 2 Go par video. Le
            streaming adaptatif est active automatiquement.
            </p>
          </Etape>

          <Etape n={6}>
            <p>
            <strong>Ajoutez des quiz (optionnel) :</strong> Pour chaque module, vous pouvez ajouter un quiz de
            validation. L&apos;IA peut vous aider a générer des questions pertinentes automatiquement.
            </p>
          </Etape>

          <Etape n={7}>
            <p>
            <strong>Fixez votre prix :</strong> Definissez le prix en FCFA. Vous pouvez aussi créer
            plusieurs paliers de prix (Basique, Standard, Premium) avec des contenus differents pour
            chaque niveau.
            </p>
          </Etape>

          <Etape n={8}>
            <p>
            <strong>Publiez :</strong> Relisez tout, vérifiez que les videos se lancent correctement,
            puis cliquez sur &quot;Publier&quot;. Votre formation est immediatement disponible a la vente.
            </p>
          </Etape>

          <h3 className="text-lg mt-8 mb-3">B. Conseils pour vos videos</h3>

          <p>
            Vous n&apos;avez pas besoin d&apos;un studio professionnel. Un smartphone moderne et un bon eclairage
            suffisent largement pour demarrer. Voici les regles d&apos;or :
          </p>

          <div className="grid gap-2 my-4">
            {[
              "Filmez en format paysage (horizontal), jamais en portrait",
              "Placez-vous face a une fenetre pour un eclairage naturel",
              "Utilisez un micro-cravate a 5 000 FCFA pour un son clair",
              "Gardez vos lecons entre 5 et 15 minutes — court et dense",
              "Parlez lentement et articulez bien, surtout si vos apprenants ne sont pas francophones natifs",
              "Montrez votre ecran pour les tutoriels techniques (OBS Studio est gratuit)",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2 text-[13px]" style={{ color: "#0e1512" }}>
                <span style={{ color: "#4c9a6b" }}>&#x2714;</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>

          <Attention titre="Attention">
            <p>N&apos;attendez pas d&apos;avoir des videos &quot;parfaites&quot; pour publier. La premiere version de votre
            formation ne sera jamais parfaite, et c&apos;est normal. Mieux vaut publier et ameliorer ensuite
            que de ne jamais publier. Vos premiers clients vous donneront des retours precieux.</p>
          </Attention>
        </SectionGuide>

        <SectionGuide
          id="creer-ebook"
          n="5"
          titre={<>Créer un ebook ou template</>}
          apres={<EtiquetteGuide>5 min</EtiquetteGuide>}
        >
          <p>
            Les ebooks, templates et guides PDF sont un excellent complement a vos formations. Ils sont
            rapides a créer, ne necessitent pas de video, et peuvent servir de produit d&apos;appel a petit
            prix pour attirer de nouveaux clients vers vos formations premium.
          </p>

          <div className="nka-maq">
            <MockEbookUpload />
          </div>

          <Etape n={1}>
            <p>
            <strong>Choisissez le type de produit :</strong> Dans &quot;Nouveau produit&quot;, selectionnez
            &quot;Ebook / PDF&quot;, &quot;Template&quot;, ou &quot;Audio&quot; selon votre contenu.
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Redigez un titre et une description vendeuse :</strong> Votre description doit
            expliquer clairement ce que le client va obtenir, le problème que cela resout, et pour
            qui c&apos;est fait. Utilisez des bullet points pour les bénéfices principaux.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Uploadez votre fichier :</strong> Glissez votre PDF, EPUB ou ZIP dans la zone
            d&apos;upload. La taille maximale est de 500 Mo. Pour les templates (Canva, Figma, Excel),
            empaquetez-les dans un fichier ZIP.
            </p>
          </Etape>

          <Etape n={4}>
            <p>
            <strong>Ajoutez une image de couverture :</strong> C&apos;est crucial. Créez un visuel attrayant
            sur Canva avec un mockup de livre. Les produits avec une belle couverture vendent 3 fois plus.
            </p>
          </Etape>

          <Etape n={5}>
            <p>
            <strong>Activez l&apos;aperçu (optionnel) :</strong> Vous pouvez permettre aux visiteurs de
            lire les premieres pages avant d&apos;acheter. Cela augmente la confiance et les conversions.
            </p>
          </Etape>

          <Astuce titre="Astuce">
            <p>Un ebook a 2 000 FCFA est un excellent &quot;produit d&apos;entree&quot;. Une fois que le client l&apos;a
            achete et apprecie, proposez-lui votre formation complete a 25 000 FCFA via un email
            automatique. C&apos;est la stratégie du &quot;tripwire&quot;.</p>
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="paiements"
          n="6"
          titre={<>Configurer les moyens de paiement</>}
          apres={<EtiquetteGuide>5 min</EtiquetteGuide>}
        >
          <p>
            Le nerf de la guerre : vos clients doivent pouvoir payer facilement. Novakou integre
            nativement les moyens de paiement les plus utilises en Afrique francophone, ainsi que
            les cartes internationales pour la diaspora et les clients du monde entier.
          </p>

          <div className="nka-maq">
            <MockPaymentConfig />
          </div>

          <h3 className="text-lg mt-6 mb-3">Moyens de paiement disponibles</h3>

          <div className="grid gap-3 my-4">
            {[
              { name: "Orange Money", details: "Disponible au Senegal, en Cote d'Ivoire, au Mali, au Cameroun, en Guinee, au Burkina Faso et dans 11 autres pays. Activation automatique." },
              { name: "Wave", details: "Disponible au Senegal et en Cote d'Ivoire. Frais de transaction parmi les plus bas du marche." },
              { name: "MTN Mobile Money", details: "Disponible au Cameroun, en Cote d'Ivoire, au Congo et dans plusieurs pays d'Afrique de l'Ouest et Centrale." },
              { name: "Carte bancaire (Visa/Mastercard)", details: "Pour les clients internationaux et la diaspora. Integre via Stripe, sécurisé par 3D Secure." },
              { name: "PayPal", details: "Option complementaire pour les clients qui preferent PayPal, très utilise par la diaspora." },
            ].map((pm) => (
              <div key={pm.name} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: "#e5eae1" }}>
                <span className="text-base mt-0.5" style={{ color: "#4c9a6b" }}>&#x1F4B3;</span>
                <div>
                  <div className="text-sm font-bold mb-0.5" style={{ color: "#0e1512" }}>{pm.name}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: "#5c6b62" }}>{pm.details}</div>
                </div>
              </div>
            ))}
          </div>

          <Etape n={1}>
            <p>
            <strong>Allez dans Paramètrès &gt; Paiements&nbsp;:</strong> Depuis votre tableau de bord,
            ouvrez les paramètres et selectionnez l&apos;onglet &quot;Paiements&quot;.
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Activez les methodes souhaitees :</strong> Cochez les moyens de paiement que vous
            voulez proposer a vos clients. Nous recommandons d&apos;activer au minimum Orange Money et
            Carte bancaire pour couvrir 95% de votre audience.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Vérifiez votre identité&nbsp;:</strong> Pour recevoir des paiements, vous devez
            compléter la vérification d&apos;identite (KYC). Uploadez une photo de votre carte d&apos;identite
            ou passeport. La vérification prend generalement moins de 24 heures.
            </p>
          </Etape>

          <Attention titre="Attention">
            <p>La vérification d&apos;identite est obligatoire avant de pouvoir retirer vos fonds. Faites-la
            des le debut pour eviter d&apos;etre bloque au moment de votre premiere vente. Les documents
            acceptes : carte nationale d&apos;identite, passeport, permis de conduire.</p>
          </Attention>

          <ProAstuce titre="Pro tip">
            <p>Plus vous proposez de moyens de paiement, plus vous faites de ventes. Un client qui ne
            trouve pas son moyen de paiement prefere abandonne dans 70% des cas. Activez tout ce qui
            est disponible dans votre pays.</p>
          </ProAstuce>
        </SectionGuide>

        <SectionGuide
          id="tunnel-vente"
          n="7"
          titre={<>Créer son premier tunnel de vente avec le builder</>}
          apres={<EtiquetteGuide>8 min</EtiquetteGuide>}
        >
          <p>
            Un tunnel de vente (ou &quot;funnel&quot;) est une serie de pages concues pour guider votre visiteur
            de la découverte de votre offre jusqu&apos;a l&apos;achat. C&apos;est l&apos;outil le plus puissant pour
            maximiser vos conversions. Novakou inclut un builder visuel complet — vous n&apos;avez pas besoin
            d&apos;outils externes.
          </p>

          <div className="nka-maq">
            <MockFunnelBuilder />
          </div>

          <h3 className="text-lg mt-6 mb-3">Les 4 pages d&apos;un tunnel standard</h3>

          <div className="grid gap-3 my-4">
            {[
              { title: "1. Page de capture", desc: "Objectif : collecter l'email du visiteur en echange d'un contenu gratuit (ebook, checklist, video). C'est la porte d'entree de votre tunnel." },
              { title: "2. Page de vente", desc: "Objectif : convaincre le visiteur d'acheter. Structure : problème, solution, bénéfices, temoignages, garantie, prix, CTA." },
              { title: "3. Page de checkout", desc: "Objectif : finaliser la transaction. Formulaire de paiement simplifie, rappel de l'offre, badges de sécurité." },
              { title: "4. Page de remerciement", desc: "Objectif : confirmer l'achat, donner les acces, proposer un upsell (produit complementaire a prix reduit)." },
            ].map((page) => (
              <div key={page.title} className="p-4 rounded-xl border" style={{ borderColor: "#e5eae1" }}>
                <div className="text-sm font-bold mb-1" style={{ color: "#006e2f" }}>{page.title}</div>
                <div className="text-[13px] leading-relaxed" style={{ color: "#5c6b62" }}>{page.desc}</div>
              </div>
            ))}
          </div>

          <Etape n={1}>
            <p>
            <strong>Créez un nouveau tunnel :</strong> Dans le menu lateral, allez dans &quot;Tunnels de vente&quot;
            puis cliquez sur &quot;Créer un tunnel&quot;. Donnez-lui un nom interne (ex: &quot;Tunnel Formation Instagram&quot;).
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Choisissez un template ou partez de zero :</strong> Novakou propose des templates
            pre-construits optimises pour la conversion. Vous pouvez aussi partir d&apos;une page blanche
            et ajouter vos blocs manuellement.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Personnalisez chaque page :</strong> Cliquez sur chaque bloc pour le modifier.
            Changez les textes, les images, les couleurs. Tout est modifiable en glisser-deposer.
            </p>
          </Etape>

          <Etape n={4}>
            <p>
            <strong>Connectez votre produit :</strong> Dans la page de checkout, selectionnez le produit
            que vous voulez vendre. Le prix, les moyens de paiement et la livraison se configurent
            automatiquement.
            </p>
          </Etape>

          <Etape n={5}>
            <p>
            <strong>Publiez et partagez le lien :</strong> Une fois satisfait, publiez le tunnel.
            Vous obtenez un lien unique que vous pouvez partager sur vos reseaux sociaux, dans vos
            emails, sur WhatsApp, etc.
            </p>
          </Etape>

          <ProAstuce titre="Pro tip">
            <p>Utilisez la generation par IA : decrivez votre produit et votre cible en 2-3 phrases,
            et l&apos;IA genere un tunnel complet avec tous les textes. Vous n&apos;avez plus qu&apos;a ajuster.
            Ca prend 2 minutes au lieu de 2 heures.</p>
          </ProAstuce>
        </SectionGuide>

        <SectionGuide
          id="ia"
          n="8"
          titre={<>Utiliser l'IA pour générer du contenu</>}
          apres={<EtiquetteGuide>5 min</EtiquetteGuide>}
        >
          <p>
            L&apos;assistant IA de Novakou est integre directement dans votre espace vendeur. Il comprend
            le contexte de la formation en ligne en Afrique et peut vous aider dans presque toutes
            les taches de creation de contenu.
          </p>

          <div className="nka-maq">
            <MockAIAssistant />
          </div>

          <h3 className="text-lg mt-6 mb-3">Ce que l&apos;IA peut faire pour vous</h3>

          <div className="grid gap-2 my-4">
            {[
              "Générer un plan de cours structure (modules, lecons, objectifs)",
              "Rediger une page de vente complete avec arguments et temoignages",
              "Créer des quiz et des exercices pour chaque module",
              "Ecrire vos emails de bienvenue, de relance et de suivi",
              "Suggerer des titres accrocheurs pour vos formations",
              "Rediger des descriptions de produits optimisees pour le SEO",
              "Générer des idees de contenu gratuit pour attirer des prospects",
              "Créer un script pour vos videos de presentation",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-[13px]" style={{ color: "#0e1512" }}>
                <span style={{ color: "#7c3aed" }}>&#x2728;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Etape n={1}>
            <p>
            <strong>Ouvrez l&apos;assistant IA :</strong> Cliquez sur l&apos;icone IA dans le menu lateral ou
            directement dans l&apos;editeur de formation (bouton &quot;Générer avec l&apos;IA&quot;).
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Decrivez ce que vous voulez :</strong> Soyez precis dans votre demande. Plus vous
            donnez de contexte, meilleur sera le resultat. Par exemple : &quot;Genere-moi un plan de cours
            en 5 modules sur le marketing WhatsApp pour les petits commercants au Senegal&quot;.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Affinez le resultat :</strong> L&apos;IA genere une premiere version que vous pouvez
            modifier, compléter ou regenerer. Demandez des ajustements : &quot;Ajoute un module sur la
            creation de groupes WhatsApp Business&quot;.
            </p>
          </Etape>

          <Astuce titre="Astuce">
            <p>L&apos;IA est un assistant, pas un remplacant. Utilisez-la pour aller plus vite, mais ajoutez
            toujours votre touche personnelle, vos anecdotes et votre expertise. C&apos;est ce qui rend
            votre formation unique.</p>
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="emails"
          n="9"
          titre={<>Configurer les emails automatiques</>}
          apres={<EtiquetteGuide>5 min</EtiquetteGuide>}
        >
          <p>
            Les emails automatiques sont votre vendeur silencieux. Ils travaillent pour vous 24 heures
            sur 24, accueillant vos nouveaux clients, les relancant quand ils n&apos;ont pas termine leur
            formation, et les incitant a acheter vos prochains produits. C&apos;est l&apos;un des leviers les
            plus puissants et pourtant les plus sous-utilises.
          </p>

          <div className="nka-maq">
            <MockEmailAutomation />
          </div>

          <h3 className="text-lg mt-6 mb-3">Les 4 sequences essentielles</h3>

          <div className="grid gap-3 my-4">
            {[
              { title: "Sequence de bienvenue", desc: "Envoyee immediatement après l'achat. Contient les acces a la formation, un message de bienvenue chaleureux, et les premieres étapes pour commencer.", emails: 3 },
              { title: "Sequence de suivi", desc: "Envoyee a J+1, J+3 et J+7 après l'achat. Encourage l'apprenant a progresser dans sa formation. Reduit le taux d'abandon.", emails: 3 },
              { title: "Sequence de relance panier abandonne", desc: "Envoyee quand un visiteur commence le checkout mais ne finalise pas. Rappel de l'offre avec urgence. Recupere jusqu'a 15% des ventes perdues.", emails: 2 },
              { title: "Sequence de certificat", desc: "Envoyee automatiquement quand l'apprenant a termine tous les modules et reussi les quiz. Contient le certificat PDF telechargeable.", emails: 1 },
            ].map((seq) => (
              <div key={seq.title} className="p-4 rounded-xl border" style={{ borderColor: "#e5eae1" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold" style={{ color: "#0e1512" }}>{seq.title}</div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#e5eae1", color: "#5c6b62" }}>{seq.emails} emails</span>
                </div>
                <div className="text-[13px] leading-relaxed" style={{ color: "#5c6b62" }}>{seq.desc}</div>
              </div>
            ))}
          </div>

          <Etape n={1}>
            <p>
            <strong>Allez dans Emails &gt; Sequences :</strong> Depuis votre tableau de bord, ouvrez
            la section &quot;Emails&quot; puis &quot;Sequences automatiques&quot;.
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Activez les sequences par defaut :</strong> Novakou fournit des templates d&apos;emails
            pre-ecrits pour chaque sequence. Activez-les en un clic. Vous pouvez les personnaliser ensuite.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Personnalisez vos emails :</strong> Modifiez les textes pour qu&apos;ils refletent votre
            ton et votre marque. Ajoutez votre prenom, une signature personnelle, et des liens vers
            vos reseaux sociaux.
            </p>
          </Etape>

          <ProAstuce titre="Pro tip">
            <p>L&apos;email de bienvenue a le taux d&apos;ouverture le plus eleve (80%+). Profitez-en pour
            créer un lien fort avec votre nouveau client. Racontez une anecdote personnelle, partagez
            votre &quot;pourquoi&quot;, et donnez-lui un objectif pour sa premiere semaine.</p>
          </ProAstuce>
        </SectionGuide>

        <SectionGuide
          id="affiliation"
          n="10"
          titre={<>Mettre en place le programme d'affiliation</>}
          apres={<EtiquetteGuide>5 min</EtiquetteGuide>}
        >
          <p>
            Le programme d&apos;affiliation transforme vos clients satisfaits et votre audience en force de
            vente. Chaque affilie recoit un lien unique et gagne une commission pour chaque vente
            qu&apos;il genere. C&apos;est le bouche-a-oreille, mais amplifie et mesurable.
          </p>

          <div className="nka-maq">
            <MockAffiliation />
          </div>

          <Etape n={1}>
            <p>
            <strong>Activez l&apos;affiliation :</strong> Dans Paramètres &gt; Affiliation, activez le
            programme pour vos produits. Vous pouvez l&apos;activer pour tous vos produits ou
            selectionner uniquement certains.
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Definissez le taux de commission :</strong> Fixez le pourcentage que vos affilies
            gagneront sur chaque vente. Un taux entre 20% et 40% est standard et suffisamment attractif
            pour motiver les affilies.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Partagez le programme :</strong> Communiquez l&apos;existence de votre programme a votre
            audience. Envoyez un email a vos clients existants, publiez sur vos reseaux sociaux, et
            ajoutez un lien &quot;Devenir affilie&quot; sur votre boutique.
            </p>
          </Etape>

          <Etape n={4}>
            <p>
            <strong>Suivez les performances :</strong> Le tableau de bord affiliation vous montre en
            temps reel le nombre de clics, de ventes et de commissions generees par chaque affilie.
            </p>
          </Etape>

          <Astuce titre="Astuce">
            <p>Vos meilleurs affilies sont vos clients satisfaits. Après qu&apos;un client a termine votre
            formation avec succes, envoyez-lui un email pour lui proposer de devenir affilie. Il connait
            votre produit et peut en parler avec authenticite.</p>
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="analytics"
          n="11"
          titre={<>Analyser son tableau de bord</>}
          apres={<EtiquetteGuide>5 min</EtiquetteGuide>}
        >
          <p>
            Votre tableau de bord est votre cockpit. C&apos;est ici que vous comprenez ce qui fonctionne,
            ce qui ne fonctionne pas, et ou concentrer vos efforts. Ne pas regarder vos chiffres,
            c&apos;est comme conduire les yeux fermes.
          </p>

          <div className="nka-maq">
            <MockDashboard />
          </div>
          <div className="nka-maq">
            <MockAnalytics />
          </div>

          <h3 className="text-lg mt-6 mb-3">Les KPIs a surveiller chaque semaine</h3>

          <div className="grid gap-3 my-4">
            {[
              { kpi: "Nombre de visiteurs", desc: "Combien de personnes visitent votre boutique ou vos tunnels. Si ce chiffre est bas, c'est un problème de trafic (reseaux sociaux, publicite, SEO)." },
              { kpi: "Taux de conversion", desc: "Le pourcentage de visiteurs qui achevent. Un bon taux est entre 2% et 5%. En dessous de 1%, votre page de vente a un problème." },
              { kpi: "Panier moyen", desc: "Le montant moyen depense par client. Augmentez-le avec des upsells, des bundles et des offres complementaires." },
              { kpi: "Taux de completion", desc: "Le pourcentage d'apprenants qui terminent votre formation. Un taux eleve signifie un contenu de qualité." },
              { kpi: "Sources de trafic", desc: "D'ou viennent vos visiteurs (Facebook, WhatsApp, Google, direct). Concentrez vos efforts sur ce qui fonctionne." },
              { kpi: "Revenus par produit", desc: "Quel produit genere le plus de revenus. Double les efforts sur vos best-sellers." },
            ].map((item) => (
              <div key={item.kpi} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: "#e5eae1" }}>
                <span className="text-base mt-0.5" style={{ color: "#006e2f" }}>&#x1F4CA;</span>
                <div>
                  <div className="text-sm font-bold mb-0.5" style={{ color: "#0e1512" }}>{item.kpi}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: "#5c6b62" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <ProAstuce titre="Pro tip">
            <p>Reservez 15 minutes chaque lundi matin pour analyser vos chiffres de la semaine
            precedente. Notez ce qui a change, identifiez une action a prendre, et executez-la dans
            la semaine. Cette habitude simple fait la difference entre les vendeurs qui stagnent et
            ceux qui progressent.</p>
          </ProAstuce>
        </SectionGuide>

        <SectionGuide
          id="optimiser"
          n="12"
          titre={<>10 astuces pour multiplier ses ventes par 3</>}
          apres={<EtiquetteGuide>8 min</EtiquetteGuide>}
        >
          <p>
            Vous avez votre boutique, vos produits, vos tunnels. Maintenant, comment passer de quelques
            ventes par semaine a un flux regulier et croissant ? Voici les 10 stratégies qui font la
            difference, testees et validees par les meilleurs vendeurs Novakou.
          </p>

          {[
            {
              n: 1,
              title: "Offrez un lead magnet irresistible",
              text: "Créez un ebook gratuit, une checklist ou un mini-cours de 3 lecons. Offrez-le en echange de l'email du visiteur via votre page de capture. Cet email vaut de l'or : vous pouvez relancer ce prospect autant de fois que nécessaire.",
            },
            {
              n: 2,
              title: "Utilisez la preuve sociale massivement",
              text: "Demandez des temoignages a vos premiers clients. Ajoutez-les sur votre page de vente, dans vos tunnels, dans vos emails. Un temoignage video de 30 secondes vaut plus que 10 paragraphes d'argumentation.",
            },
            {
              n: 3,
              title: "Créez l'urgence avec les offres flash",
              text: "Proposez des reductions limitees dans le temps (72 heures). Le compteur a rebours dans votre tunnel de vente augmente les conversions de 30 a 50%. Utilisez-le avec parcimonie pour ne pas perdre en credibilite.",
            },
            {
              n: 4,
              title: "Publiez du contenu gratuit regulierement",
              text: "Partagez des extraits de vos formations, des conseils, des etudes de cas sur Facebook, Instagram, TikTok et dans des groupes WhatsApp. Chaque contenu gratuit est une porte d'entree vers vos produits payants.",
            },
            {
              n: 5,
              title: "Créez un bundle (offre groupee)",
              text: "Regroupez 2-3 produits complementaires a un prix inferieur a la somme individuelle. Les bundles augmentent le panier moyen de 40% en moyenne.",
            },
            {
              n: 6,
              title: "Mettez en place un upsell sur la page de remerciement",
              text: "Après un achat, proposez un produit complementaire a prix reduit. Le client est dans un etat d'achat, le taux de conversion sur les upsells peut atteindre 10-15%.",
            },
            {
              n: 7,
              title: "Activez les emails de relance de panier abandonne",
              text: "60% des acheteurs qui commencent un checkout ne finalisent pas. Un email de relance envoye 1 heure après, puis 24 heures après, recupere 10 a 15% de ces ventes perdues. C'est de l'argent gratuit.",
            },
            {
              n: 8,
              title: "Segmentez votre audience",
              text: "Tous vos clients ne sont pas les memes. Identifiez ceux qui ont achete un produit d'entree et proposez-leur votre formation premium. Identifiez ceux qui ont termine une formation et proposez-leur la suivante.",
            },
            {
              n: 9,
              title: "Investissez dans la publicite Facebook ciblee",
              text: "Commencez petit : 2 000 FCFA par jour sur une audience ciblee. Testez differentes accroches. Quand vous trouvez une publicite qui fonctionne (coute moins en pub que ce qu'elle rapporte), augmentez le budget progressivement.",
            },
            {
              n: 10,
              title: "Demandez des avis et ameliorez constamment",
              text: "Envoyez un sondage a vos clients après leur formation. Demandez ce qu'ils ont aime, ce qui manque, ce qu'ils aimeraient voir ensuite. Chaque amelioration augmente la satisfaction, les temoignages positifs et le bouche-a-oreille.",
            },
          ].map((tip) => (
            <div key={tip.n} className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#4c9a6b", color: "#ffffff" }}>
                  {tip.n}
                </span>
                <h3 className="text-base font-bold">{tip.title}</h3>
              </div>
              <p className="text-[14px] leading-relaxed ml-11">{tip.text}</p>
            </div>
          ))}

          <Attention titre="Attention">
            <p>N&apos;essayez pas d&apos;appliquer les 10 astuces en meme temps. Choisissez-en 2 ou 3 et
            executez-les a fond avant de passer aux suivantes. La dispersion est l&apos;ennemi numéro 1
            des createurs de contenu.</p>
          </Attention>
        </SectionGuide>

        <SectionGuide
          id="retraits"
          n="13"
          titre={<>Configurer les retraits et recevoir son argent</>}
          apres={<EtiquetteGuide>3 min</EtiquetteGuide>}
        >
          <p>
            Vous avez fait des ventes — felicitations ! Maintenant, voyons comment recuperer votre
            argent. Novakou propose plusieurs methodes de retrait adaptees a votre pays et a vos
            préférences.
          </p>

          <div className="nka-maq">
            <MockWithdrawal />
          </div>

          <Etape n={1}>
            <p>
            <strong>Vérifiez votre solde disponible&nbsp;:</strong> Dans votre tableau de bord, consultez
            votre portefeuille. Le &quot;solde disponible&quot; est le montant que vous pouvez retirer
            immediatement. Le &quot;solde en attente&quot; correspond aux ventes recentes dont le delai de
            sécurité (48 heures) n&apos;est pas encore ecoule.
            </p>
          </Etape>

          <Etape n={2}>
            <p>
            <strong>Choisissez votre methode de retrait :</strong> Orange Money, Wave, MTN MoMo ou
            virement bancaire. Ajoutez votre numéro de telephone Mobile Money ou vos coordonnees
            bancaires si ce n&apos;est pas déjà fait.
            </p>
          </Etape>

          <Etape n={3}>
            <p>
            <strong>Demandez un retrait :</strong> Indiquez le montant a retirer (minimum 100 FCFA
            ou equivalent). Le retrait est traite sous 24 a 48 heures ouvrees.
            </p>
          </Etape>

          <Etape n={4}>
            <p>
            <strong>Recevez vos fonds :</strong> Vous recevez une confirmation par email et par
            notification in-app des que les fonds sont envoyes. Pour Mobile Money, c&apos;est generalement
            instantane une fois le retrait approuve.
            </p>
          </Etape>

          <div className="rounded-xl border p-4 my-6" style={{ borderColor: "#e5eae1" }}>
            <div className="text-sm font-bold mb-3" style={{ color: "#0e1512" }}>Recapitulatif des delais et frais</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#e5eae1" }}>
                    <th className="text-left py-2 pr-4 font-bold" style={{ color: "#5c6b62" }}>Methode</th>
                    <th className="text-left py-2 pr-4 font-bold" style={{ color: "#5c6b62" }}>Delai</th>
                    <th className="text-left py-2 font-bold" style={{ color: "#5c6b62" }}>Frais</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { method: "Orange Money", delay: "Instantane*", fees: "1.5%" },
                    { method: "Wave", delay: "Instantane*", fees: "1%" },
                    { method: "MTN MoMo", delay: "Instantane*", fees: "1.5%" },
                    { method: "Virement bancaire", delay: "2-5 jours", fees: "500 FCFA fixe" },
                  ].map((row) => (
                    <tr key={row.method} className="border-b last:border-0" style={{ borderColor: "#e5eae1" }}>
                      <td className="py-2 pr-4" style={{ color: "#0e1512" }}>{row.method}</td>
                      <td className="py-2 pr-4" style={{ color: "#0e1512" }}>{row.delay}</td>
                      <td className="py-2" style={{ color: "#0e1512" }}>{row.fees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] mt-2">* Instantané après validation du retrait (24-48 h ouvrées)</p>
          </div>

          <Astuce titre="Astuce">
            <p>Configurez votre methode de retrait des le premier jour, avant meme de faire votre
            premiere vente. Comme ca, quand l&apos;argent arrive, tout est pret et vous n&apos;avez aucun
            delai supplementaire.</p>
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="faq"
          n="14"
          titre={<>FAQ : 15 questions les plus posees par les vendeurs</>}
          apres={<EtiquetteGuide>5 min</EtiquetteGuide>}
        >
          <div className="space-y-4">
            {[
              {
                q: "Combien coute Novakou ?",
                a: "L'inscription est gratuite. Novakou prend une commission sur chaque vente realisee. Pas de vente = pas de frais. Vous ne prenez aucun risque financier.",
              },
              {
                q: "Ai-je besoin de competences techniques ?",
                a: "Non. Si vous savez utiliser WhatsApp et Facebook, vous savez utiliser Novakou. Tout est concu pour etre intuitif. L'IA vous assiste pour la creation de contenu.",
              },
              {
                q: "Quels types de produits puis-je vendre ?",
                a: "Formations video, ebooks, templates, coachings, masterclass, packs de ressources, guides PDF, fichiers audio. Tout produit numerique est accepte, tant qu'il est legal et de qualité.",
              },
              {
                q: "Puis-je vendre en FCFA et en euros ?",
                a: "Oui. Vous fixez vos prix en FCFA, et Novakou affiche automatiquement le prix converti dans la devise preferee de chaque visiteur (EUR, USD, GBP, MAD).",
              },
              {
                q: "Mes videos sont-elles protegees contre le piratage ?",
                a: "Oui. Les videos sont hebergees sur nos serveurs securises avec protection DRM. Elles ne peuvent pas etre telechargees. Le streaming adaptatif s'ajuste a la connexion internet de l'apprenant.",
              },
              {
                q: "Combien de temps faut-il pour recevoir mon argent ?",
                a: "Les fonds sont disponibles 48 heures après la vente. Le retrait est ensuite traite sous 24 a 48 heures ouvrees. Mobile Money est quasi-instantane après validation.",
              },
              {
                q: "Puis-je avoir plusieurs produits ?",
                a: "Oui, il n'y a pas de limite. Vous pouvez créer autant de formations, ebooks et templates que vous le souhaitez.",
              },
              {
                q: "Comment faire la promotion de mes produits ?",
                a: "Utilisez vos reseaux sociaux (Facebook, Instagram, TikTok, WhatsApp), les tunnels de vente integres, l'email marketing, et le programme d'affiliation. Le guide ci-dessus couvre toutes ces stratégies.",
              },
              {
                q: "Novakou gere-t-il les certificats de formation ?",
                a: "Oui. Quand un apprenant termine tous les modules et reussit les quiz, un certificat personnalise est automatiquement genere et envoye par email.",
              },
              {
                q: "Puis-je utiliser mon propre nom de domaine ?",
                a: "Oui, sur les plans premium. Vous pouvez connecter votre domaine personnalise (ex: formations.votre-marque.com) a votre boutique Novakou.",
              },
              {
                q: "Y a-t-il un nombre maximum d'apprenants ?",
                a: "Non. Que vous ayez 10 ou 10 000 apprenants, la plateforme gere tout automatiquement sans ralentir.",
              },
              {
                q: "Puis-je offrir des codes de reduction ?",
                a: "Oui. Vous pouvez créer des codes promo avec un pourcentage ou un montant fixe de reduction, une date d'expiration, et un nombre maximum d'utilisations.",
              },
              {
                q: "Les emails sont-ils vraiment automatiques ?",
                a: "Oui. Une fois configures, les emails de bienvenue, de suivi, de relance et de certificat sont envoyes automatiquement sans aucune action de votre part.",
              },
              {
                q: "Puis-je voir qui a achete mes produits ?",
                a: "Oui. Votre tableau de bord affiche la liste complete de vos clients, leurs achats, leur progression dans les formations, et leurs coordonnees.",
              },
              {
                q: "Que se passe-t-il si un client demande un remboursement ?",
                a: "Novakou propose une politique de remboursement sous 14 jours. Si un client demande un remboursement, vous etes notifie. Les fonds en escrow sont restitues au client. Cela n'arrive presque jamais quand le contenu est de qualité.",
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border p-4" style={{ borderColor: "#e5eae1" }}>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: "#f0f6f2", color: "#006e2f" }}>
                    Q
                  </span>
                  <div>
                    <div className="text-sm font-bold mb-2" style={{ color: "#0e1512" }}>{faq.q}</div>
                    <div className="text-[13px] leading-relaxed" style={{ color: "#5c6b62" }}>{faq.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionGuide>

        <SectionGuide
          id="conclusion"
          n="15"
          titre={<>Conclusion et prochaines étapes</>}
          apres={<EtiquetteGuide>2 min</EtiquetteGuide>}
        >
          <p>
            Felicitations ! Vous avez maintenant toutes les cles pour réussir sur Novakou. Recapitulons
            les étapes que vous avez couvertes dans ce guide :
          </p>

          <div className="grid gap-2 my-6">
            {[
              "Comprendre ce que Novakou peut faire pour vous",
              "Créer votre compte vendeur en 3 minutes",
              "Configurer votre boutique avec votre marque",
              "Publier votre premiere formation video",
              "Créer des ebooks et templates complementaires",
              "Activer tous les moyens de paiement (Mobile Money + carte)",
              "Construire un tunnel de vente qui convertit",
              "Utiliser l'IA pour accelerer votre creation de contenu",
              "Configurer les emails automatiques qui vendent pour vous",
              "Lancer votre programme d'affiliation",
              "Lire et comprendre vos analytics",
              "Appliquer les 10 astuces pour maximiser vos ventes",
              "Configurer vos retraits pour recevoir votre argent",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-[14px]" style={{ color: "#0e1512" }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: "#dcfce7", color: "#006e2f" }}>
                  &#x2714;
                </span>
                {item}
              </div>
            ))}
          </div>

          <p>
            La difference entre ceux qui reussissent et ceux qui ne demarrent jamais, c&apos;est une seule
            chose : le passage a l&apos;action. Vous n&apos;avez pas besoin que tout soit parfait. Vous avez besoin
            de commencer.
          </p>

          <p>
            Votre premier produit ne sera pas votre meilleur. Et c&apos;est parfaitement normal. Chaque
            formation, chaque ebook, chaque tunnel de vente que vous créez vous rend meilleur. Vos
            clients vous donneront des retours, vous ameliorerez, et votre deuxieme produit sera
            deux fois meilleur que le premier.
          </p>

          <p>
            Les meilleurs vendeurs Novakou ont commence exactement ou vous en etes maintenant :
            avec une expertise, une envie, et zero vente. Aujourd&apos;hui, certains generent plus de
            500 000 FCFA par mois avec seulement 2 ou 3 produits bien positionnes.
          </p>

          <p>
            C&apos;est votre tour.
          </p>
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
