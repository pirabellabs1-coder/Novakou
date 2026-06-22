import type { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  MessagesSquare,
  Sparkles,
  BellRing,
  Smartphone,
  BadgeCheck,
  Megaphone,
  Share,
  Plus,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Nouveautés Novakou 2.0 — tout ce qui change et comment en profiter",
  description:
    "Messagerie en temps réel, recherche par IA, notifications push, application installable, badge Vendeur vérifié… Découvrez les nouveautés de Novakou 2.0 et apprenez à les utiliser pas à pas.",
  alternates: { canonical: "/nouveautes" },
  openGraph: {
    title: "Novakou 2.0 est arrivé 🚀",
    description:
      "Le guide complet des nouveautés Novakou 2.0 et comment les utiliser pour apprendre, vendre et gagner.",
    url: "/nouveautes",
  },
};

interface Feature {
  id: string;
  icon: typeof MessagesSquare;
  badge: string;
  title: string;
  intro: string;
  steps: string[];
}

const FEATURES: Feature[] = [
  {
    id: "messagerie",
    icon: MessagesSquare,
    badge: "Communication",
    title: "Messagerie en temps réel",
    intro:
      "Échangez en direct avec vos clients ou vos vendeurs. Les messages arrivent instantanément, vous voyez qui est « en ligne » et la cloche se met à jour sans rafraîchir la page.",
    steps: [
      "Ouvrez une conversation depuis « Messages » dans votre espace.",
      "Écrivez : votre interlocuteur reçoit le message à la seconde, et voit l'indicateur de frappe.",
      "Le point vert indique qu'une personne est connectée — le bon moment pour obtenir une réponse rapide.",
    ],
  },
  {
    id: "recherche-ia",
    icon: Sparkles,
    badge: "Intelligence artificielle",
    title: "Recherche par IA en langage naturel",
    intro:
      "Plus besoin de deviner les bons mots-clés. Décrivez votre besoin avec vos propres mots, et l'IA parcourt le catalogue réel pour vous proposer les produits les plus pertinents.",
    steps: [
      "Allez sur la page Explorer.",
      "Tapez une phrase naturelle, par exemple « je veux apprendre à vendre sur WhatsApp ».",
      "L'IA traduit votre besoin en recherche et affiche les formations et produits correspondants.",
    ],
  },
  {
    id: "notifications",
    icon: BellRing,
    badge: "Notifications",
    title: "Notifications push (même application fermée)",
    intro:
      "Soyez prévenu d'une vente, d'un message ou d'une nouveauté instantanément sur votre téléphone — même quand Novakou est fermé.",
    steps: [
      "Ouvrez la cloche 🔔 en haut de votre espace.",
      "Cliquez sur « Activer les notifications » et acceptez la demande du navigateur.",
      "C'est tout : vous recevez désormais les alertes importantes directement sur votre appareil.",
    ],
  },
  {
    id: "installation",
    icon: Smartphone,
    badge: "Application",
    title: "Installer Novakou comme une vraie application",
    intro:
      "Ajoutez Novakou à votre écran d'accueil pour un accès en un toucher, plein écran, qui fonctionne même avec une connexion faible.",
    steps: [
      "Sur Android / Chrome : appuyez sur la bannière « Installer Novakou » (ou menu ⋮ → « Installer l'application »).",
      "Sur iPhone (Safari) : appuyez sur Partager, puis sur « Sur l'écran d'accueil ».",
      "L'icône Novakou apparaît sur votre téléphone, comme une application classique.",
    ],
  },
  {
    id: "confiance",
    icon: BadgeCheck,
    badge: "Confiance",
    title: "Badge « Vendeur vérifié » & recommandations",
    intro:
      "Les vendeurs dont l'identité est vérifiée affichent un badge de confiance. Et partout, des recommandations personnalisées vous suggèrent les produits faits pour vous.",
    steps: [
      "Vendeurs : complétez votre vérification d'identité (KYC) depuis vos paramètres pour obtenir le badge.",
      "Acheteurs : repérez le badge vert ✓ sur les fiches pour acheter en confiance.",
      "Sur chaque produit, regardez la section « Vous aimerez aussi » pour découvrir des contenus proches.",
    ],
  },
];

export default function NouveautesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#04361a] via-[#006e2f] to-[#22c55e] text-white">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative max-w-3xl mx-auto px-5 py-16 md:py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur">
            <Rocket size={14} /> Mise à jour majeure
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight">Novakou 2.0 est arrivé</h1>
          <p className="mt-4 text-base md:text-lg text-white/85 leading-relaxed">
            Plus rapide, plus humain, plus rentable. Voici tout ce qui change — et comment en profiter
            dès aujourd'hui pour apprendre, vendre et gagner.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#006e2f] hover:bg-white/90 transition-colors"
            >
              Explorer le catalogue <ArrowRight size={16} />
            </Link>
            <a
              href="#messagerie"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Voir les nouveautés
            </a>
          </div>
        </div>
      </header>

      {/* Sommaire */}
      <nav className="border-b border-[#e4eae6] bg-[#f7faf8]">
        <div className="max-w-3xl mx-auto px-5 py-4 flex flex-wrap gap-2 justify-center">
          {FEATURES.map((f) => (
            <a
              key={f.id}
              href={`#${f.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d7ecde] bg-white px-3 py-1.5 text-xs font-bold text-[#006e2f] hover:bg-[#f0faf3] transition-colors"
            >
              <f.icon size={13} />
              {f.title.split(" ").slice(0, 2).join(" ")}
            </a>
          ))}
        </div>
      </nav>

      {/* Sections fonctionnalités */}
      <main className="max-w-3xl mx-auto px-5 py-12 md:py-16 space-y-16">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <section key={f.id} id={f.id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006e2f] to-[#22c55e] text-white">
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#22a043]">
                    {String(i + 1).padStart(2, "0")} · {f.badge}
                  </p>
                  <h2 className="text-xl md:text-2xl font-extrabold text-[#13241b] leading-tight">{f.title}</h2>
                </div>
              </div>

              <p className="text-[15px] leading-relaxed text-[#5c647a]">{f.intro}</p>

              <div className="mt-5 rounded-2xl border border-[#e4eae6] bg-[#f7faf8] p-5">
                <p className="text-xs font-extrabold uppercase tracking-widest text-[#006e2f] mb-3">
                  Comment l'utiliser
                </p>
                <ol className="space-y-3">
                  {f.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#006e2f] text-[11px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-[#13241b]">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Encart iOS spécifique sous la section installation */}
              {f.id === "installation" && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#d7ecde] bg-[#f0faf3] p-4">
                  <Smartphone size={18} className="mt-0.5 flex-shrink-0 text-[#006e2f]" />
                  <p className="text-[13px] leading-relaxed text-[#13241b]">
                    <strong>Sur iPhone</strong>, l'installation se fait toujours via Safari : touchez{" "}
                    <Share size={13} className="inline -mt-0.5 text-[#006e2f]" /> <strong>Partager</strong> en bas
                    de l'écran, faites défiler, puis touchez{" "}
                    <Plus size={13} className="inline -mt-0.5 text-[#006e2f]" />{" "}
                    <strong>« Sur l'écran d'accueil »</strong>. Apple ne permet pas de bouton d'installation
                    automatique — c'est normal.
                  </p>
                </div>
              )}
            </section>
          );
        })}

        {/* Conseil vendeurs */}
        <section id="conseil-vendeurs" className="scroll-mt-24">
          <div className="rounded-3xl bg-gradient-to-br from-[#04361a] to-[#006e2f] p-7 md:p-9 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Megaphone size={22} />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold">Vendeurs : le conseil n°1 pour vos premières ventes</h2>
            </div>
            <p className="text-[15px] leading-relaxed text-white/85">
              Un bon produit ne suffit pas : pour vendre, il faut être <strong>vu</strong>. La majorité des
              vendeurs qui réussissent sur Novakou commencent par <strong>lancer une publicité</strong>.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Partagez le lien de votre produit sur WhatsApp, TikTok, Facebook et Instagram.",
                "Créez une promotion de lancement pour donner envie d'acheter tout de suite.",
                "Diffusez une annonce sponsorisée ciblée pour toucher de nouveaux acheteurs.",
                "Soignez votre titre, votre image de couverture et votre description : c'est votre vitrine.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-[#7ff0a8]" />
                  <span className="text-sm leading-relaxed text-white/90">{tip}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-white/80">
              C'est l'étape qui transforme vos visiteurs en acheteurs — et vos efforts en revenus.
            </p>
          </div>
        </section>

        {/* CTA final */}
        <section className="text-center">
          <h2 className="text-2xl font-extrabold text-[#13241b]">Prêt à profiter de Novakou 2.0 ?</h2>
          <p className="mt-2 text-[15px] text-[#5c647a]">Tout est déjà disponible dans votre espace.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#006e2f] to-[#22c55e] px-6 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              Explorer le catalogue <ArrowRight size={16} />
            </Link>
            <Link
              href="/vendeur/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-[#e4eae6] px-6 py-3.5 text-sm font-bold text-[#13241b] hover:bg-gray-50 transition-colors"
            >
              Espace vendeur
            </Link>
          </div>
          <p className="mt-8 text-[13px] text-[#8a93a6]">
            Merci de faire partie de l'aventure — l'équipe Novakou, l'académie des créateurs digitaux.
          </p>
        </section>
      </main>
    </div>
  );
}
