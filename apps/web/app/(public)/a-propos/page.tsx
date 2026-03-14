import Link from "next/link";

const STATS = [
  { value: "10 000+", label: "Freelances actifs", icon: "people" },
  { value: "25+", label: "Pays couverts", icon: "public" },
  { value: "€500K+", label: "Transactions", icon: "payments" },
  { value: "98%", label: "Clients satisfaits", icon: "thumb_up" },
];

const VALUES = [
  {
    icon: "handshake",
    title: "Confiance",
    description: "Systeme d'escrow, verification KYC et litiges encadres pour des echanges en toute serenite.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: "language",
    title: "Accessibilite",
    description: "Une plateforme pensee pour l'Afrique francophone, la diaspora et le marche international.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: "lightbulb",
    title: "Innovation",
    description: "Technologies modernes, IA integree et paiements Mobile Money pour une experience optimale.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: "diversity_3",
    title: "Communaute",
    description: "Un ecosysteme ou freelances, clients et agences collaborent et grandissent ensemble.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
];

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-background-dark">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <span className="material-symbols-outlined text-lg">info</span>
            A propos de FreelanceHigh
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            La plateforme freelance qui eleve<br />votre carriere au plus haut niveau
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            FreelanceHigh connecte les talents freelances d&apos;Afrique francophone, de la diaspora et du monde
            entier avec des clients qui recherchent l&apos;excellence. Fondee en 2026 par Lissanon Gildas.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {STATS.map((s) => (
            <div key={s.label} className="bg-neutral-dark rounded-2xl border border-border-dark p-6 text-center">
              <span className="material-symbols-outlined text-3xl text-primary mb-3 block">{s.icon}</span>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Notre histoire */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Notre histoire</h2>
          <div className="bg-neutral-dark rounded-2xl border border-border-dark p-8 md:p-12">
            <div className="max-w-3xl mx-auto space-y-4 text-slate-300 leading-relaxed">
              <p>
                FreelanceHigh est nee d&apos;un constat simple : les freelances d&apos;Afrique francophone
                et de la diaspora n&apos;ont pas acces aux memes opportunites que leurs homologues europeens
                ou nord-americains.
              </p>
              <p>
                Les plateformes existantes ne prennent pas en compte les realites locales : paiements
                Mobile Money, langues, fuseaux horaires, ou encore la verification d&apos;identite adaptee
                au contexte africain.
              </p>
              <p>
                Notre mission est de creer un ecosysteme equitable, ou chaque freelance peut vendre ses
                competences, chaque client peut trouver le bon prestataire, et chaque agence peut gerer
                ses equipes — avec des outils modernes, des paiements adaptes et une confiance garantie.
              </p>
            </div>
          </div>
        </div>

        {/* Valeurs */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Nos valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-neutral-dark rounded-2xl border border-border-dark p-6">
                <div className={`w-14 h-14 rounded-xl ${v.bg} flex items-center justify-center mb-4`}>
                  <span className={`material-symbols-outlined text-2xl ${v.color}`}>{v.icon}</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fondateur */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">L&apos;equipe</h2>
          <div className="max-w-md mx-auto bg-neutral-dark rounded-2xl border border-border-dark p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-primary">person</span>
            </div>
            <h3 className="text-xl font-bold text-white">Lissanon Gildas</h3>
            <p className="text-primary text-sm font-semibold mb-3">CEO & Fondateur</p>
            <p className="text-sm text-slate-400">
              Entrepreneur passionne par la tech et le developpement de l&apos;ecosysteme freelance
              en Afrique francophone.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-neutral-dark rounded-2xl border border-primary/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Rejoignez FreelanceHigh</h2>
          <p className="text-slate-400 mb-6">
            Que vous soyez freelance, client ou agence, votre place est ici.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/inscription"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Creer un compte
            </Link>
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 bg-white/5 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors border border-border-dark"
            >
              Explorer la marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
