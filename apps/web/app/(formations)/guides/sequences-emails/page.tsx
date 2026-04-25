import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Séquences emails pour vendre ses formations en Afrique | Guide 2026 · Novakou",
  description:
    "Comment créer des séquences d'emails automatiques qui vendent vos formations en pilote automatique. Lead magnets, séquences de bienvenue, relances — 23 templates inclus sur Novakou.",
  keywords: [
    "séquence email formation afrique",
    "email marketing formation en ligne",
    "automatisation email novakou",
    "vendre formation email afrique",
  ],
  openGraph: {
    title: "Séquences emails pour vendre ses formations en Afrique — Guide 2026",
    description:
      "23 templates, séquences de bienvenue, relances et lancement : le guide complet de l'email marketing pour formateurs africains.",
    type: "article",
  },
};

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const S = { fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" } as const;
const SH = { ...S, fontWeight: 700, letterSpacing: "-0.04em" } as const;
const C = {
  primary: "#006e2f",
  accent: "#22c55e",
  dark: "#191c1e",
  muted: "#5c647a",
  surface: "#f6fbf2",
  surfaceLow: "#f0f5ec",
  surfaceHigh: "#e5eae1",
  white: "#ffffff",
  tipBg: "#ecfdf5",
  tipBorder: "#a7f3d0",
  warnBg: "#fffbeb",
  warnBorder: "#fde68a",
} as const;

/* ------------------------------------------------------------------ */
/*  Table of contents                                                  */
/* ------------------------------------------------------------------ */
const TOC = [
  { id: "intro", num: "01", label: "L'email marketing, l'actif que personne ne peut vous retirer" },
  { id: "liste", num: "02", label: "Construire sa liste email dès le jour 1" },
  { id: "lead-magnet", num: "03", label: "Le lead magnet : offrir pour recevoir" },
  { id: "bienvenue", num: "04", label: "La séquence de bienvenue en 5 emails" },
  { id: "lignes-objet", num: "05", label: "Les lignes objet qui font ouvrir" },
  { id: "lancement", num: "06", label: "La séquence de lancement (7 emails, 7 jours)" },
  { id: "relance", num: "07", label: "La séquence de relance (paniers abandonnés)" },
  { id: "segmentation", num: "08", label: "Segmenter sa liste pour mieux cibler" },
  { id: "metriques", num: "09", label: "Les métriques clés et benchmarks Afrique" },
  { id: "erreurs", num: "10", label: "Les 5 erreurs qui tuent vos emails" },
  { id: "templates", num: "11", label: "Les 23 templates email disponibles sur Novakou" },
  { id: "conclusion", num: "12", label: "Conclusion et prochaine étape" },
];

/* ------------------------------------------------------------------ */
/*  Reusable visual blocks                                             */
/* ------------------------------------------------------------------ */

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.tipBg,
        borderLeft: `4px solid ${C.accent}`,
        borderRadius: 12,
        padding: "20px 24px",
        margin: "28px 0",
        ...S,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>&#9889;</span>
        <div style={{ color: C.dark, fontSize: 15, lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.warnBg,
        borderLeft: "4px solid #f59e0b",
        borderRadius: 12,
        padding: "20px 24px",
        margin: "28px 0",
        ...S,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>&#9888;&#65039;</span>
        <div style={{ color: C.dark, fontSize: 15, lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function MockupBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
        margin: "32px 0",
        background: "white",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
        <span
          style={{
            ...S,
            fontSize: 11,
            color: C.muted,
            background: "#f1f5f9",
            borderRadius: 6,
            padding: "3px 12px",
            marginLeft: 8,
            fontWeight: 500,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: "24px 28px" }}>{children}</div>
    </div>
  );
}

function SectionHeading({ id, num, title }: { id: string; num: string; title: string }) {
  return (
    <div id={id} style={{ scrollMarginTop: 100, marginTop: 64, marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span
          style={{
            ...S,
            fontSize: 12,
            fontWeight: 700,
            color: C.primary,
            background: `${C.primary}14`,
            borderRadius: 8,
            padding: "4px 10px",
            letterSpacing: "0.04em",
          }}
        >
          CHAPITRE {num}
        </span>
      </div>
      <h2 style={{ ...SH, fontSize: 28, color: C.dark, lineHeight: 1.3, margin: 0 }}>{title}</h2>
    </div>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p style={{ ...S, fontSize: 16, lineHeight: 1.85, color: "#374151", margin: "18px 0" }}>{children}</p>;
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 style={{ ...SH, fontSize: 20, color: C.dark, margin: "32px 0 12px", lineHeight: 1.3 }}>{children}</h3>;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function SequencesEmailsPage() {
  return (
    <div style={{ ...S, minHeight: "100vh", background: "white" }}>
      {/* ================================================================ */}
      {/*  HERO                                                            */}
      {/* ================================================================ */}
      <section
        style={{
          position: "relative",
          paddingTop: 140,
          paddingBottom: 80,
          overflow: "hidden",
          background: `radial-gradient(circle at 20% 30%, ${C.primary}12, transparent 50%), radial-gradient(circle at 80% 70%, ${C.accent}10, transparent 50%)`,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Breadcrumb */}
          <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
            <Link href="/" style={{ ...S, fontSize: 13, color: C.muted, textDecoration: "none", fontWeight: 500 }}>
              Accueil
            </Link>
            <span style={{ color: "#cbd5e1", fontSize: 13 }}>/</span>
            <Link href="/guides/guide-complet-novakou" style={{ ...S, fontSize: 13, color: C.muted, textDecoration: "none", fontWeight: 500 }}>
              Guides
            </Link>
            <span style={{ color: "#cbd5e1", fontSize: 13 }}>/</span>
            <span style={{ ...S, fontSize: 13, color: C.primary, fontWeight: 600 }}>Séquences emails</span>
          </nav>

          {/* Badge */}
          <span
            style={{
              ...S,
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase" as const,
              letterSpacing: "0.08em",
              color: C.primary,
              background: `${C.primary}14`,
              padding: "5px 14px",
              borderRadius: 100,
              marginBottom: 20,
            }}
          >
            Guide complet 2026 · 15 min de lecture
          </span>

          <h1 style={{ ...SH, fontSize: 42, lineHeight: 1.15, color: C.dark, margin: "0 0 20px" }}>
            Séquences emails pour vendre ses formations en pilote automatique
          </h1>

          <p style={{ ...S, fontSize: 18, lineHeight: 1.7, color: C.muted, maxWidth: 640, margin: "0 0 28px" }}>
            L&apos;email est l&apos;actif marketing le plus rentable qui existe : 36 € de retour pour chaque euro
            investi. Découvrez comment construire votre liste, créer des séquences automatisées et vendre
            vos formations 24h/24 — avec 23 templates inclus sur Novakou.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 20, alignItems: "center" }}>
            <span style={{ ...S, fontSize: 13, color: C.muted, fontWeight: 500 }}>12 chapitres</span>
            <span style={{ ...S, fontSize: 13, color: C.muted, fontWeight: 500 }}>23 templates email</span>
            <span style={{ ...S, fontSize: 13, color: C.muted, fontWeight: 500 }}>Mis à jour : Avril 2026</span>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  FEATURED IMAGE                                                  */}
      {/* ================================================================ */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 48px" }}>
        <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
          <Image
            src="https://images.unsplash.com/photo-1596526131083-e8c633064194?auto=format&fit=crop&w=1200&q=80"
            alt="Email marketing et séquences automatisées pour vendre des formations en Afrique"
            width={1200}
            height={500}
            style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 460 }}
            priority
          />
        </div>
      </div>

      {/* ================================================================ */}
      {/*  TABLE OF CONTENTS                                               */}
      {/* ================================================================ */}
      <section style={{ background: C.surface, borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
          <h2 style={{ ...SH, fontSize: 18, color: C.dark, margin: "0 0 20px" }}>Sommaire</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 8 }}>
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  ...S,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  color: C.dark,
                  textDecoration: "none",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    ...S,
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.primary,
                    background: `${C.primary}14`,
                    borderRadius: 6,
                    padding: "2px 8px",
                    minWidth: 28,
                    textAlign: "center" as const,
                  }}
                >
                  {item.num}
                </span>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  ARTICLE BODY                                                    */}
      {/* ================================================================ */}
      <article style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ============================================================== */}
        {/*  01 — INTRO                                                    */}
        {/* ============================================================== */}
        <SectionHeading id="intro" num="01" title="L'email marketing, l'actif que personne ne peut vous retirer" />

        <Paragraph>
          Les algorithmes de Facebook changent. TikTok peut disparaître. Un compte Instagram peut être suspendu
          du jour au lendemain. Mais votre liste email, elle, vous appartient. C&apos;est le seul actif marketing
          que personne ne peut vous retirer, réduire, ou faire payer davantage pour atteindre.
        </Paragraph>

        <Paragraph>
          Les chiffres parlent d&apos;eux-mêmes. Le ROI moyen de l&apos;email marketing est de 36 € pour chaque
          euro investi — soit 3 600 %. En comparaison, une publicité Facebook bien optimisée rapporte en
          moyenne 2 à 4 € pour 1 € dépensé. L&apos;email bat tous les autres canaux, sans exception, en termes
          de retour sur investissement.
        </Paragraph>

        <Paragraph>
          En Afrique francophone, la situation est encore plus favorable. Les boîtes mail des professionnels
          africains sont moins saturées qu&apos;en Europe. Les taux d&apos;ouverture moyens sont de 30 à 45 %
          contre 20 % en Europe de l&apos;Ouest. Vos emails ont deux fois plus de chances d&apos;être lus.
          Et contrairement à WhatsApp où les messages se noient dans des dizaines de conversations simultanées,
          un email bien rédigé retient l&apos;attention.
        </Paragraph>

        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, margin: "32px 0" }}>
          {[
            { value: "36x", label: "ROI moyen de l'email marketing" },
            { value: "40%", label: "Taux d'ouverture moyen en Afrique" },
            { value: "100%", label: "Votre liste vous appartient" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "24px 28px",
                textAlign: "center" as const,
                flex: "1 1 180px",
              }}
            >
              <div style={{ ...SH, fontSize: 32, color: C.primary, marginBottom: 4 }}>{s.value}</div>
              <div style={{ ...S, fontSize: 13, color: C.muted, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <TipBox>
          <strong>La règle d&apos;or :</strong> Chaque email adresse valide dans votre liste vaut en moyenne
          1 à 3 € par mois si vous l&apos;exploitez correctement. Une liste de 1 000 emails actifs peut donc
          générer entre 12 000 et 36 000 € par an — sans budget publicitaire.
        </TipBox>

        {/* ============================================================== */}
        {/*  02 — CONSTRUIRE SA LISTE                                       */}
        {/* ============================================================== */}
        <SectionHeading id="liste" num="02" title="Construire sa liste email dès le jour 1" />

        <Paragraph>
          La question n&apos;est pas &laquo; quand commencer à collecter des emails ? &raquo; mais &laquo; pourquoi
          je ne l&apos;ai pas encore fait ? &raquo; Chaque jour sans collecte d&apos;emails est un jour de potentiel
          perdu. Voici comment démarrer, même si vous n&apos;avez encore aucun produit à vendre.
        </Paragraph>

        <SubHeading>Les outils de collecte d&apos;emails</SubHeading>

        <Paragraph>
          Novakou intègre nativement la collecte d&apos;emails dans chaque page produit, page de funnel et
          formulaire d&apos;opt-in. Vous n&apos;avez besoin d&apos;aucun outil externe. Le formulaire est
          connecté directement à votre base de contacts, qui alimente ensuite vos séquences automatisées.
        </Paragraph>

        <div style={{ margin: "24px 0" }}>
          {[
            {
              outil: "Formulaire pop-up Novakou",
              desc: "S'affiche après 30 secondes sur votre page ou à l'intention de quitter. Conversion moyenne : 3 à 8 % des visiteurs.",
              badge: "Intégré",
            },
            {
              outil: "Page de capture (squeeze page)",
              desc: "Page dédiée à 100 % à la collecte d'emails. Aucun menu, aucune distraction. Conversion : 20 à 40 % avec un bon lead magnet.",
              badge: "Intégré",
            },
            {
              outil: "Formulaire dans le contenu",
              desc: "Intégré dans vos articles de blog, vos guides gratuits. Moins intrusif, mais converti sur un public déjà engagé.",
              badge: "Intégré",
            },
            {
              outil: "Lien bio Instagram / TikTok",
              desc: "Redirige votre audience des réseaux sociaux vers votre page de capture. Crucial pour convertir vos followers en emails.",
              badge: "Via Novakou",
            },
          ].map((item) => (
            <div
              key={item.outil}
              style={{
                display: "flex",
                gap: 16,
                padding: "16px 0",
                borderBottom: "1px solid #f1f5f9",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ ...SH, fontSize: 15, color: C.dark }}>{item.outil}</span>
                  <span style={{ ...S, fontSize: 10, fontWeight: 700, color: C.primary, background: `${C.primary}12`, padding: "2px 8px", borderRadius: 6 }}>
                    {item.badge}
                  </span>
                </div>
                <div style={{ ...S, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <SubHeading>Ce que vous devez collecter (et ne pas collecter)</SubHeading>

        <Paragraph>
          Pour commencer, collectez uniquement le prénom et l&apos;email. C&apos;est suffisant pour personnaliser
          vos emails avec &laquo; Bonjour Kofi, &raquo; et déclencher vos séquences. Chaque champ
          supplémentaire dans votre formulaire réduit votre taux de conversion d&apos;environ 10 %. Ne demandez
          le numéro de téléphone, le pays, ou d&apos;autres informations que lorsque c&apos;est strictement nécessaire
          — et seulement après une première relation établie.
        </Paragraph>

        <MockupBox title="novakou.com/vendeur/contacts">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ ...SH, fontSize: 16, color: C.dark }}>Ma liste email</div>
              <div style={{ ...S, fontSize: 13, color: C.primary, fontWeight: 700 }}>+12 cette semaine</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Total contacts", value: "847" },
                { label: "Actifs (30 jours)", value: "612" },
                { label: "Taux ouverture", value: "38%" },
              ].map((stat) => (
                <div key={stat.label} style={{ background: C.surface, borderRadius: 10, padding: 14, textAlign: "center" as const }}>
                  <div style={{ ...SH, fontSize: 22, color: C.primary }}>{stat.value}</div>
                  <div style={{ ...S, fontSize: 11, color: C.muted, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ ...S, fontSize: 12, color: C.muted }}>
              Sources : Formulaire pop-up (42%) · Page de capture (35%) · Achats (23%)
            </div>
          </div>
        </MockupBox>

        <WarningBox>
          <strong>RGPD et législation locale :</strong> Obtenez toujours le consentement explicite avant
          d&apos;envoyer des emails marketing. Un simple &laquo; J&apos;accepte de recevoir des conseils par
          email &raquo; suffit dans votre formulaire. Ne vendez jamais votre liste. Incluez toujours un lien
          de désinscription en bas de chaque email.
        </WarningBox>

        {/* ============================================================== */}
        {/*  03 — LEAD MAGNET                                               */}
        {/* ============================================================== */}
        <SectionHeading id="lead-magnet" num="03" title="Le lead magnet : offrir pour recevoir" />

        <Paragraph>
          Personne ne donne son email pour rien. Pour convaincre un visiteur de vous confier son adresse,
          vous devez lui offrir quelque chose de valeur immédiate. C&apos;est le lead magnet : une ressource
          gratuite qui résout un problème précis de votre audience cible.
        </Paragraph>

        <Paragraph>
          Un bon lead magnet respecte trois critères : il doit être consommable rapidement (5 à 20 minutes),
          il doit donner un résultat concret et immédiat, et il doit pointer directement vers le problème
          que votre formation payante résout en profondeur. C&apos;est l&apos;entrée de votre tunnel, pas
          un cadeau sans lien avec votre offre.
        </Paragraph>

        <SubHeading>Les 8 types de lead magnets qui fonctionnent en Afrique</SubHeading>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "24px 0" }}>
          {[
            {
              type: "PDF / Guide PDF",
              exemple: "\"Les 7 formules Excel que tout comptable africain doit maîtriser\"",
              note: "Le plus populaire. Facile à créer, fort sentiment de valeur.",
              perf: "Excellent",
            },
            {
              type: "Checklist",
              exemple: "\"30 choses à vérifier avant de lancer votre boutique en ligne\"",
              note: "Ultra-concis, actionnable. Fort taux de conversion.",
              perf: "Excellent",
            },
            {
              type: "Mini-formation vidéo (3-5 vidéos)",
              exemple: "\"3 vidéos pour créer votre premier logo professionnel\"",
              note: "Plus long à créer mais taux d'engagement très élevé.",
              perf: "Très bon",
            },
            {
              type: "Template / Modèle",
              exemple: "\"Mon tableau de bord Excel de gestion freelance (gratuit)\"",
              note: "Très prisé car directement utilisable. Se partage beaucoup.",
              perf: "Très bon",
            },
            {
              type: "Webinaire gratuit",
              exemple: "\"Découvrez comment doubler vos ventes en 30 jours (live)\"",
              note: "Converti très bien mais demande plus d'organisation.",
              perf: "Bon",
            },
            {
              type: "Quiz / Test",
              exemple: "\"Quel type d'entrepreneur êtes-vous ? (résultat + conseils)\"",
              note: "Engagement très élevé. Permet la segmentation immédiate.",
              perf: "Bon",
            },
            {
              type: "Challenge gratuit",
              exemple: "\"Challenge 5 jours pour créer votre première formation\"",
              note: "Crée une communauté. Long à mettre en place.",
              perf: "Bon",
            },
            {
              type: "Accès à une ressource privée",
              exemple: "\"Rejoignez notre groupe WhatsApp d'entrepreneurs africains\"",
              note: "Facile à créer. Fonctionne bien si votre audience est active.",
              perf: "Variable",
            },
          ].map((lm) => (
            <div
              key={lm.type}
              style={{
                background: "#fafafa",
                border: "1px solid #f1f5f9",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ ...SH, fontSize: 14, color: C.dark }}>{lm.type}</div>
                <span
                  style={{
                    ...S,
                    fontSize: 10,
                    fontWeight: 700,
                    color: lm.perf === "Excellent" ? C.primary : lm.perf === "Très bon" ? "#0ea5e9" : C.muted,
                    background: lm.perf === "Excellent" ? `${C.primary}10` : lm.perf === "Très bon" ? "#e0f2fe" : "#f1f5f9",
                    padding: "2px 8px",
                    borderRadius: 6,
                    flexShrink: 0,
                  }}
                >
                  {lm.perf}
                </span>
              </div>
              <div style={{ ...S, fontSize: 12, color: C.primary, fontStyle: "italic" as const, marginBottom: 6, lineHeight: 1.5 }}>{lm.exemple}</div>
              <div style={{ ...S, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{lm.note}</div>
            </div>
          ))}
        </div>

        <TipBox>
          <strong>Règle du lead magnet :</strong> Votre lead magnet doit être si utile que les gens se
          demandent comment votre formation payante peut être encore mieux. S&apos;ils ne sont pas impressionnés
          par ce que vous donnez gratuitement, ils n&apos;achèteront jamais votre formation.
        </TipBox>

        {/* ============================================================== */}
        {/*  04 — SÉQUENCE DE BIENVENUE                                     */}
        {/* ============================================================== */}
        <SectionHeading id="bienvenue" num="04" title="La séquence de bienvenue en 5 emails" />

        <Paragraph>
          Les 7 premiers jours après l&apos;inscription sont critiques. C&apos;est là que votre abonné décide
          s&apos;il va rester engagé ou devenir un nom de plus dans votre liste inactive. La séquence de bienvenue
          est automatique : une fois configurée sur Novakou, elle s&apos;envoie à chaque nouvel abonné sans
          que vous ayez à intervenir.
        </Paragraph>

        <MockupBox title="novakou.com/vendeur/sequences/bienvenue">
          <div>
            <div style={{ ...S, fontSize: 12, color: C.muted, marginBottom: 16, fontWeight: 600 }}>SÉQUENCE : Bienvenue + Introduction à votre univers</div>
            {[
              {
                jour: "J+0",
                objet: "Votre guide est arrivé ! (+ un bonus surprise)",
                objectif: "Livrer le lead magnet + créer une première impression positive",
                taux: "72%",
                contenu: "Lien de téléchargement · Présentation en 3 lignes · Annonce des prochains emails",
              },
              {
                jour: "J+1",
                objet: "Pourquoi j'ai tout quitté pour faire ça...",
                objectif: "Raconter votre histoire pour créer de la connexion émotionnelle",
                taux: "54%",
                contenu: "Histoire personnelle · Moment de transformation · Ce que vous comprenez maintenant",
              },
              {
                jour: "J+3",
                objet: "L'erreur que 90% des [votre audience] font encore",
                objectif: "Apporter de la valeur et pointer vers un problème que vous résolvez",
                taux: "48%",
                contenu: "Conseil actionnable · Exemple concret · Transition vers votre offre (subtile)",
              },
              {
                jour: "J+5",
                objet: "\"Je n'y croyais plus...\" (témoignage de Kofi)",
                objectif: "Preuve sociale via un cas client inspirant",
                taux: "44%",
                contenu: "Histoire d'un apprenant · Résultats concrets · Chiffres réels",
              },
              {
                jour: "J+7",
                objet: "Je ferme les portes vendredi soir à 23h59",
                objectif: "Première présentation de votre offre avec urgence",
                taux: "41%",
                contenu: "Présentation de la formation · Offre de lancement · Compte à rebours · CTA clair",
              },
            ].map((email, i) => (
              <div
                key={email.jour}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr auto",
                  gap: 16,
                  padding: "16px 0",
                  borderBottom: i < 4 ? "1px solid #f1f5f9" : "none",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    ...SH,
                    fontSize: 12,
                    color: C.primary,
                    background: `${C.primary}10`,
                    padding: "4px 8px",
                    borderRadius: 6,
                    textAlign: "center" as const,
                  }}
                >
                  {email.jour}
                </div>
                <div>
                  <div style={{ ...S, fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 2 }}>{email.objet}</div>
                  <div style={{ ...S, fontSize: 12, color: C.muted, marginBottom: 4 }}>{email.objectif}</div>
                  <div style={{ ...S, fontSize: 11, color: "#94a3b8" }}>{email.contenu}</div>
                </div>
                <div style={{ ...SH, fontSize: 13, color: C.accent, textAlign: "right" as const, flexShrink: 0 }}>
                  ~{email.taux}
                  <div style={{ ...S, fontSize: 10, color: C.muted, fontWeight: 400 }}>ouverture</div>
                </div>
              </div>
            ))}
          </div>
        </MockupBox>

        <SubHeading>Le contenu exact de chaque email</SubHeading>

        <Paragraph>
          <strong>Email J+0 (livraison immédiate) :</strong> Commencez par livrer immédiatement ce que vous
          avez promis — votre lead magnet. Ne faites pas attendre. Ajoutez un bonus surprise non annoncé
          (un deuxième PDF, un template supplémentaire) : la réciprocité se construit dès le premier échange.
          Terminez l&apos;email avec une question simple comme &laquo; Quel est votre plus grand défi en ce
          moment avec [votre thème] ? &raquo; Les réponses vous donnent des idées de contenu et permettent
          aux destinataires de vous &laquo; marquer &raquo; comme expéditeur important dans leur messagerie.
        </Paragraph>

        <Paragraph>
          <strong>Email J+1 (votre histoire) :</strong> Racontez votre parcours. Pas votre CV, votre vraie
          histoire. Le moment où vous étiez dans la même situation que votre abonné aujourd&apos;hui.
          Les difficultés que vous avez rencontrées. Et ce qui a changé. L&apos;authenticité est votre seul
          avantage concurrentiel face aux formateurs internationaux qui ne comprennent pas les réalités africaines.
        </Paragraph>

        <Paragraph>
          <strong>Email J+3 (valeur pure) :</strong> Un conseil actionnable que votre abonné peut appliquer
          dès aujourd&apos;hui. Pas de vente, pas de CTA commercial. Juste de la valeur. Cet email est le plus
          important car il établit votre crédibilité et l&apos;habitude d&apos;ouvrir vos emails.
        </Paragraph>

        <Paragraph>
          <strong>Email J+5 (preuve sociale) :</strong> Partagez l&apos;histoire d&apos;un de vos apprenants.
          Avant/après concret. Chiffres réels. Difficultés rencontrées puis surmontées. Si vous démarrez et
          n&apos;avez pas encore d&apos;apprenants, utilisez votre propre transformation comme étude de cas.
        </Paragraph>

        <Paragraph>
          <strong>Email J+7 (offre) :</strong> Présentez votre formation. Rappel des bénéfices, pas des modules.
          Urgence réelle (pas inventée) : places limitées ou prix de lancement qui expire. Un seul CTA.
          Un seul lien. Tout doit pointer vers la même page de vente.
        </Paragraph>

        {/* ============================================================== */}
        {/*  05 — LIGNES OBJET                                              */}
        {/* ============================================================== */}
        <SectionHeading id="lignes-objet" num="05" title="Les lignes objet qui font ouvrir" />

        <Paragraph>
          Votre ligne objet est la seule chose qui décide si votre email est ouvert ou ignoré. Elle doit
          créer de la curiosité, promettre une valeur spécifique, ou déclencher une émotion — en moins de
          50 caractères (pour l&apos;affichage mobile). Voici 50 exemples éprouvés classés par catégorie.
        </Paragraph>

        <div style={{ margin: "28px 0" }}>
          {[
            {
              categorie: "Curiosité",
              emoji: "🤔",
              exemples: [
                "Ce que personne ne vous dit sur [votre thème]",
                "La vraie raison pour laquelle vous n'avancez pas",
                "J'ai fait une erreur (et voici ce que j'ai appris)",
                "Pourquoi les meilleurs [votre audience] font l'inverse",
                "La méthode bizarre qui m'a rapporté 500 000 FCFA",
                "Vous ne croirez pas ce que Kofi a fait en 30 jours",
                "Ce que j'aurais voulu savoir quand j'ai commencé",
                "Je dois vous avouer quelque chose...",
                "Le secret que les experts gardent pour eux",
                "Avez-vous remarqué ça aussi ?",
              ],
            },
            {
              categorie: "Bénéfice direct",
              emoji: "🎯",
              exemples: [
                "Comment [résultat] en [délai] sans [obstacle]",
                "5 étapes pour doubler vos revenus cette semaine",
                "La méthode rapide pour créer votre première formation",
                "Obtenez [résultat] avant la fin du mois",
                "Comment j'ai gagné 200 000 FCFA avec un seul email",
                "3 techniques pour vendre sans paraître commercial",
                "Votre guide pour [résultat] est prêt",
                "Faites ça ce soir et voyez les résultats demain",
                "Le raccourci que 95% des formateurs ignorent",
                "Transformez [problème] en opportunité en 48h",
              ],
            },
            {
              categorie: "Urgence & rareté",
              emoji: "⏰",
              exemples: [
                "Dernière chance (ferme ce soir à 23h59)",
                "Il ne reste que 3 places",
                "Le prix monte dans 2 heures",
                "Cette offre disparaît dans [X] heures",
                "Je retire ça demain matin",
                "Accès fermé dans 48h — voici pourquoi",
                "Offre de lancement : seulement ce week-end",
                "Ne ratez pas ça (vraiment)",
                "Plus que 8 places au tarif de lancement",
                "Votre accès expire bientôt",
              ],
            },
            {
              categorie: "Personnalisation",
              emoji: "👋",
              exemples: [
                "[Prénom], j'ai pensé à vous",
                "Bonne nouvelle pour vous, [Prénom]",
                "[Prénom], j'ai quelque chose d'important à vous dire",
                "À vous qui voulez [résultat]...",
                "Pour les [votre audience] sérieux seulement",
                "Si vous êtes à Dakar, lisez ceci",
                "Spécial pour les [audience] au Cameroun",
                "C'est pour vous si vous avez ce problème",
                "Je vous ai préparé quelque chose",
                "Vous méritez mieux que ça, [Prénom]",
              ],
            },
            {
              categorie: "Question",
              emoji: "❓",
              exemples: [
                "Vous avez 10 minutes ce soir ?",
                "Êtes-vous satisfait de vos revenus ce mois ?",
                "Savez-vous combien vous perdez chaque mois ?",
                "Avez-vous essayé ça ?",
                "Êtes-vous encore en train de faire cette erreur ?",
                "Qu'est-ce qui vous bloque vraiment ?",
                "Comment ça se passe de votre côté ?",
                "Pouvez-vous me rendre un service ?",
                "Avez-vous vu les résultats de Kofi ?",
                "Êtes-vous prêt pour la prochaine étape ?",
              ],
            },
          ].map((cat) => (
            <div key={cat.categorie} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <span style={{ ...SH, fontSize: 16, color: C.dark }}>{cat.categorie}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {cat.exemples.map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      ...S,
                      fontSize: 13,
                      color: C.muted,
                      background: "#f8fafc",
                      borderRadius: 8,
                      padding: "10px 14px",
                      borderLeft: `3px solid ${C.accent}40`,
                      lineHeight: 1.5,
                    }}
                  >
                    {ex}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <TipBox>
          <strong>La règle d&apos;or des lignes objet :</strong> Testez toujours 2 versions (A/B test) sur
          vos 20 premières heures d&apos;envoi. Novakou vous permet de faire ce test automatiquement.
          La version avec le meilleur taux d&apos;ouverture s&apos;envoie automatiquement au reste de votre liste.
          Sur 6 mois, cette pratique peut augmenter votre taux d&apos;ouverture moyen de 15 à 30 %.
        </TipBox>

        {/* ============================================================== */}
        {/*  06 — SÉQUENCE DE LANCEMENT                                     */}
        {/* ============================================================== */}
        <SectionHeading id="lancement" num="06" title="La séquence de lancement (7 emails, 7 jours)" />

        <Paragraph>
          Un lancement de formation n&apos;est pas un seul email envoyé le jour J. C&apos;est une séquence
          orchestrée sur 7 jours qui crée de l&apos;anticipation, de la désirabilité, et une urgence finale.
          Cette méthode, adaptée du Product Launch Formula de Jeff Walker, est la plus éprouvée pour vendre
          des formations en ligne — et elle fonctionne encore mieux sur le marché africain où le sentiment
          d&apos;exclusivité est très fort.
        </Paragraph>

        <div style={{ margin: "28px 0", borderLeft: `3px solid ${C.accent}40`, paddingLeft: 28 }}>
          {[
            {
              jour: "J-7",
              titre: "Email de pré-lancement",
              contenu: "Annoncez que quelque chose arrive. Ne révélez pas encore quoi. Créez de la curiosité et de l'anticipation. Demandez : 'Si vous pouviez apprendre une seule chose sur [thème], ce serait quoi ?' Les réponses vous donnent des arguments de vente.",
              kpi: "Taux ouverture cible : 45%+",
            },
            {
              jour: "J-5",
              titre: "Contenu de valeur #1",
              contenu: "Publiez une vidéo, un article ou un email avec votre meilleur conseil gratuit sur le thème de votre formation. Installez votre crédibilité. Annoncez que vous allez révéler quelque chose de plus complet dans 5 jours.",
              kpi: "Taux clic cible : 8%+",
            },
            {
              jour: "J-3",
              titre: "Contenu de valeur #2 + teaser",
              contenu: "Deuxième contenu gratuit. Encore plus de valeur. Commencez à mentionner votre formation de façon très indirecte. Montrez des résultats d'apprenants. Annoncez l'ouverture dans 3 jours.",
              kpi: "Engagement : réponses et partages",
            },
            {
              jour: "J-1",
              titre: "Le compte à rebours commence",
              contenu: "Annoncez clairement que votre formation ouvre demain. Résumez les bénéfices clés. Expliquez l'offre spéciale de lancement (prix réduit ou bonus exclusifs). Créez de l'anticipation.",
              kpi: "Taux ouverture cible : 55%+",
            },
            {
              jour: "J (Ouverture)",
              titre: "Portes ouvertes",
              contenu: "L'email le plus important. Présentez votre formation en détail. Tous les bénéfices. Tous les bonus. Le prix de lancement. Le compte à rebours jusqu'à la fermeture. Un seul CTA, répété 3 fois dans l'email.",
              kpi: "Taux conversion cible : 3-8%",
            },
            {
              jour: "J+2",
              titre: "FAQ + objections",
              contenu: "Répondez aux 5 objections les plus courantes ('C'est trop cher', 'Je n'ai pas le temps', 'Ça va vraiment marcher pour moi ?'). Ajoutez de nouveaux témoignages reçus depuis l'ouverture.",
              kpi: "Récupérer les hésitants",
            },
            {
              jour: "J+4 (Fermeture)",
              titre: "Dernière chance — ferme ce soir",
              contenu: "L'email de fermeture est souvent le plus lucratif. 30 à 40 % des ventes d'un lancement se font dans les dernières 24 heures. Urgence réelle. Rappel de tous les bénéfices. Deux ou trois envois ce jour (matin, midi, 2h avant fermeture).",
              kpi: "30-40% des ventes totales",
            },
          ].map((step, i) => (
            <div key={step.jour} style={{ marginBottom: i < 6 ? 28 : 0, position: "relative" as const }}>
              <div
                style={{
                  position: "absolute" as const,
                  left: -38,
                  top: 4,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: C.accent,
                  border: "3px solid white",
                  boxShadow: `0 0 0 2px ${C.accent}40`,
                }}
              />
              <div style={{ ...S, fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>
                {step.jour}
              </div>
              <div style={{ ...SH, fontSize: 16, color: C.dark, marginBottom: 6 }}>{step.titre}</div>
              <div style={{ ...S, fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>{step.contenu}</div>
              <div style={{ ...S, fontSize: 12, color: C.primary, fontWeight: 700 }}>{step.kpi}</div>
            </div>
          ))}
        </div>

        <WarningBox>
          <strong>Ne lancez pas sans liste chaude :</strong> Cette séquence fonctionne mieux avec une
          liste d&apos;abonnés qui vous connaît déjà. Si votre liste a moins de 100 contacts, ou si vous
          n&apos;avez rien envoyé depuis 3 mois, faites d&apos;abord une &laquo; séquence de réveil &raquo; de
          3 emails sur 2 semaines avant votre lancement.
        </WarningBox>

        {/* ============================================================== */}
        {/*  07 — RELANCE PANIERS ABANDONNÉS                               */}
        {/* ============================================================== */}
        <SectionHeading id="relance" num="07" title="La séquence de relance (paniers abandonnés)" />

        <Paragraph>
          Statistique choc : 70 % des personnes qui arrivent sur votre page de paiement n&apos;achètent pas.
          Pas parce qu&apos;elles ne voulaient pas votre formation. Parce qu&apos;elles ont été interrompues,
          ont eu un doute, ou ont simplement décidé de &laquo; le faire demain &raquo;. Une séquence de
          relance bien configurée récupère entre 10 et 25 % de ces ventes perdues — sans budget supplémentaire.
        </Paragraph>

        <SubHeading>La séquence de relance en 3 emails</SubHeading>

        <div style={{ margin: "24px 0" }}>
          {[
            {
              timing: "1 heure après",
              sujet: "Vous avez oublié quelque chose...",
              contenu: "Email court, informel. Rappeler que leur place est toujours disponible. Pas de pression. Juste un rappel amical. Lien direct vers la page de paiement. Ce premier email récupère souvent 40 à 50 % des paniers abandonnés.",
              icon: "⏰",
            },
            {
              timing: "24 heures après",
              sujet: "Une question avant de partir",
              contenu: "Demandez pourquoi ils n'ont pas finalisé. Proposez de répondre à leurs questions directement. Parfois, un simple doute non résolu bloque l'achat. Un email 'je suis disponible pour répondre' peut débloquer des ventes que vous n'imaginiez pas.",
              icon: "❓",
            },
            {
              timing: "72 heures après",
              sujet: "Offre spéciale (expire demain)",
              contenu: "Dernier email de relance. Proposez une réduction de 10 à 15 % ou un bonus supplémentaire pour les convaincre de franchir le pas. Urgence réelle : l'offre expire dans 24 heures. Ce troisième email est généralement le plus lucratif de la séquence.",
              icon: "🎁",
            },
          ].map((email) => (
            <div
              key={email.timing}
              style={{
                background: "#fafafa",
                border: "1px solid #f1f5f9",
                borderRadius: 14,
                padding: "20px 24px",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{email.icon}</span>
                <div>
                  <div style={{ ...S, fontSize: 12, fontWeight: 700, color: C.accent }}>{email.timing}</div>
                  <div style={{ ...SH, fontSize: 15, color: C.dark }}>{email.sujet}</div>
                </div>
              </div>
              <div style={{ ...S, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{email.contenu}</div>
            </div>
          ))}
        </div>

        <TipBox>
          <strong>Configuration sur Novakou :</strong> La relance de panier abandonné s&apos;active en un
          clic dans votre dashboard vendeur. Novakou détecte automatiquement quand un utilisateur ajoute
          votre formation à son panier sans finaliser l&apos;achat et déclenche la séquence de relance.
          Aucun outil externe requis.
        </TipBox>

        {/* ============================================================== */}
        {/*  08 — SEGMENTATION                                              */}
        {/* ============================================================== */}
        <SectionHeading id="segmentation" num="08" title="Segmenter sa liste pour mieux cibler" />

        <Paragraph>
          Envoyer le même email à toute votre liste, c&apos;est comme envoyer la même publicité à tout le
          Sénégal en espérant que ça parle à tout le monde. La segmentation vous permet d&apos;envoyer le bon
          message, à la bonne personne, au bon moment. Résultat : taux d&apos;ouverture 2 fois plus élevés,
          taux de conversion 3 fois supérieurs.
        </Paragraph>

        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", margin: "24px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const, ...S, fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: C.dark, borderBottom: "1px solid #e2e8f0" }}>Critère</th>
                <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: C.dark, borderBottom: "1px solid #e2e8f0" }}>Segments possibles</th>
                <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: C.dark, borderBottom: "1px solid #e2e8f0" }}>Utilisation type</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Pays", "Sénégal, Côte d'Ivoire, Cameroun, Bénin...", "Offre en FCFA XOF vs FCFA XAF, événements locaux"],
                ["Comportement d'achat", "Acheteurs, non-acheteurs, paniers abandonnés", "Relance paniers, upsell clients existants"],
                ["Intérêt (lead magnet)", "Finance, Marketing, Tech, Design...", "Recommander des formations connexes"],
                ["Niveau d'engagement", "Ouvre toujours, parfois, jamais", "Réactiver les inactifs, récompenser les fidèles"],
                ["Type d'audience", "Entrepreneurs, salariés, étudiants", "Adapter le ton et les exemples"],
                ["Stade du parcours", "Découverte, considération, décision", "Contenu éducatif vs offres de vente"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: "12px 16px",
                        color: j === 0 ? C.dark : C.muted,
                        fontWeight: j === 0 ? 600 : 400,
                        borderBottom: i < 5 ? "1px solid #f1f5f9" : "none",
                        lineHeight: 1.5,
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Paragraph>
          Sur Novakou, vous pouvez créer des segments dynamiques basés sur l&apos;ensemble de ces critères.
          Un segment dynamique se met à jour automatiquement : si un abonné achète votre formation, il
          quitte automatiquement le segment &laquo; non-acheteurs &raquo; et entre dans le segment
          &laquo; clients &raquo; pour recevoir des emails de suivi et d&apos;upsell adaptés.
        </Paragraph>

        {/* ============================================================== */}
        {/*  09 — MÉTRIQUES                                                 */}
        {/* ============================================================== */}
        <SectionHeading id="metriques" num="09" title="Les métriques clés et benchmarks Afrique" />

        <Paragraph>
          Mesurer vos résultats est la seule façon d&apos;améliorer vos performances. Voici les métriques
          essentielles, avec les benchmarks spécifiques au marché africain francophone — souvent différents
          des moyennes mondiales.
        </Paragraph>

        <MockupBox title="novakou.com/vendeur/emails/statistiques">
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...S, fontSize: 12, color: C.muted, marginBottom: 12, fontWeight: 600 }}>DERNIÈRE CAMPAGNE — "Ouverture formation Excel Pro"</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Envoyés", value: "847", color: C.muted },
                { label: "Ouverts", value: "324 (38%)", color: C.primary },
                { label: "Cliqués", value: "67 (8%)", color: "#0ea5e9" },
                { label: "Conversions", value: "12 (1.8%)", color: C.accent },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "#f8fafc", borderRadius: 10, padding: 14, textAlign: "center" as const }}>
                  <div style={{ ...SH, fontSize: 18, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                  <div style={{ ...S, fontSize: 11, color: C.muted }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "Désinscriptions", value: "3 (0.4%)", ok: true },
                { label: "Spam", value: "0 (0%)", ok: true },
                { label: "Rebonds", value: "8 (0.9%)", ok: true },
              ].map((stat) => (
                <div key={stat.label} style={{ ...S, fontSize: 12, color: stat.ok ? C.primary : "#dc2626", fontWeight: 600 }}>
                  {stat.label} : {stat.value}
                </div>
              ))}
            </div>
          </div>
        </MockupBox>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, margin: "24px 0" }}>
          {[
            { metrique: "Taux d'ouverture", afrique: "30–45%", monde: "~20%", bon: ">35%" },
            { metrique: "Taux de clic", afrique: "5–12%", monde: "~2.5%", bon: ">8%" },
            { metrique: "Taux de conversion (email → vente)", afrique: "1–4%", monde: "~1%", bon: ">2%" },
            { metrique: "Taux de désinscription", afrique: "<1%", monde: "<0.5%", bon: "<0.3%" },
            { metrique: "Taux de spam", afrique: "<0.1%", monde: "<0.08%", bon: "0%" },
            { metrique: "Taux de rebond", afrique: "<2%", monde: "<2%", bon: "<1%" },
          ].map((m) => (
            <div
              key={m.metrique}
              style={{
                background: "#fafafa",
                border: "1px solid #f1f5f9",
                borderRadius: 14,
                padding: "18px 20px",
              }}
            >
              <div style={{ ...S, fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8, lineHeight: 1.3 }}>{m.metrique}</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                <div style={{ ...S, fontSize: 12, color: C.muted }}>
                  <span style={{ fontWeight: 600, color: C.primary }}>Afrique :</span> {m.afrique}
                </div>
                <div style={{ ...S, fontSize: 12, color: C.muted }}>
                  <span style={{ fontWeight: 600 }}>Monde :</span> {m.monde}
                </div>
                <div style={{ ...S, fontSize: 12, color: C.accent, fontWeight: 700 }}>
                  Objectif : {m.bon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================== */}
        {/*  10 — ERREURS                                                   */}
        {/* ============================================================== */}
        <SectionHeading id="erreurs" num="10" title="Les 5 erreurs qui tuent vos emails" />

        <div style={{ margin: "28px 0" }}>
          {[
            {
              num: "1",
              title: "Envoyer des emails trop rarement",
              desc: "Beaucoup de formateurs ont peur d'envoyer trop d'emails et n'envoient qu'une fois par mois. Résultat : leurs abonnés les oublient. La fréquence idéale est de 2 à 3 emails par semaine pour rester présent sans fatiguer. Moins de 1 email par semaine = liste qui se refroidit.",
              fix: "Planifiez au minimum 1 email de valeur par semaine + 1 email commercial toutes les 2 semaines.",
            },
            {
              num: "2",
              title: "Parler de soi au lieu de parler à l'abonné",
              desc: "La grande majorité des emails de formateurs commencent par 'Je voulais vous partager...', 'J'ai travaillé sur...', 'Mon programme...'. Vos abonnés s'en fichent. Ils veulent savoir ce que vous apportez à leur situation, pas ce que vous faites.",
              fix: "Remplacez chaque 'je' par 'vous' ou 'votre'. Commencez par le bénéfice, pas par vous-même.",
            },
            {
              num: "3",
              title: "Mettre trop de liens et d'appels à l'action",
              desc: "Un email avec 7 liens vers 4 formations, 2 articles et votre page Instagram ne convertit rien. Trop de choix = pas de choix. La confusion tue la conversion. Chaque email doit avoir un seul objectif et un seul CTA.",
              fix: "Un email = un objectif = un lien. Si vous avez plusieurs choses à partager, faites plusieurs emails.",
            },
            {
              num: "4",
              title: "Ignorer les emails inactifs",
              desc: "30 à 40 % de votre liste n'ouvre plus vos emails après 6 mois. Les laisser là nuit à votre délivrabilité (les serveurs email détectent le non-engagement et envoient vos emails en spam pour tout le monde). Nettoyez régulièrement.",
              fix: "Envoyez une séquence de réactivation de 3 emails. Si pas de réponse, supprimez. Mieux vaut une liste de 300 actifs que 1000 fantômes.",
            },
            {
              num: "5",
              title: "Ne pas tester ses emails sur mobile",
              desc: "Plus de 80 % de vos abonnés africains lisent leurs emails sur mobile. Un email qui s'affiche mal sur mobile (texte trop petit, images cassées, bouton invisible) est un email perdu. Pourtant, moins de 20 % des formateurs testent sur mobile avant d'envoyer.",
              fix: "Envoyez-vous toujours un email de test sur votre propre smartphone avant d'envoyer à toute votre liste.",
            },
          ].map((err) => (
            <div
              key={err.num}
              style={{
                borderRadius: 14,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                padding: "24px",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    ...SH,
                    fontSize: 13,
                    color: "#dc2626",
                    background: "#fee2e2",
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {err.num}
                </span>
                <span style={{ ...SH, fontSize: 16, color: "#991b1b" }}>{err.title}</span>
              </div>
              <div style={{ ...S, fontSize: 14, color: "#7f1d1d", lineHeight: 1.7, marginBottom: 12, opacity: 0.85 }}>{err.desc}</div>
              <div
                style={{
                  ...S,
                  fontSize: 13,
                  color: C.primary,
                  fontWeight: 700,
                  background: "white",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: `1px solid ${C.accent}40`,
                }}
              >
                La solution : {err.fix}
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================== */}
        {/*  11 — 23 TEMPLATES                                              */}
        {/* ============================================================== */}
        <SectionHeading id="templates" num="11" title="Les 23 templates email disponibles sur Novakou" />

        <Paragraph>
          Novakou inclut 23 templates email professionnels, rédigés spécifiquement pour le marché africain
          francophone. Chaque template est personnalisable en quelques clics depuis votre dashboard vendeur.
          Voici la liste complète.
        </Paragraph>

        {/* Image templates */}
        <div style={{ borderRadius: 16, overflow: "hidden", margin: "28px 0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <Image
            src="https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=900&q=80"
            alt="23 templates email professionnels pour vendre ses formations en ligne"
            width={900}
            height={400}
            style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 380 }}
          />
          <div style={{ ...S, fontSize: 12, color: C.muted, textAlign: "center" as const, padding: "10px 16px", background: "#f8fafc" }}>
            23 templates email personnalisables disponibles dans votre dashboard Novakou
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "28px 0" }}>
          {[
            { cat: "Séquence bienvenue", num: "5", items: ["Livraison lead magnet", "Histoire du formateur", "Valeur gratuite", "Témoignage apprenant", "Première offre de vente"] },
            { cat: "Lancement", num: "7", items: ["Pré-lancement mystère", "Contenu valeur #1", "Contenu valeur #2", "Compte à rebours", "Ouverture des portes", "FAQ / objections", "Dernière chance"] },
            { cat: "Relance", num: "3", items: ["Panier abandonné (1h)", "Panier abandonné (24h)", "Panier abandonné + offre (72h)"] },
            { cat: "Post-achat", num: "3", items: ["Confirmation d'achat", "Accès à votre formation", "Comment démarrer — guide"] },
            { cat: "Fidélisation", num: "3", items: ["Check-in progression apprenant", "Demande de témoignage", "Offre exclusive client existant"] },
            { cat: "Réactivation", num: "2", items: ["Abonné inactif (win-back)", "Vous nous manquez (dernière chance)"] },
          ].map((cat) => (
            <div
              key={cat.cat}
              style={{
                background: "#fafafa",
                border: "1px solid #f1f5f9",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ ...SH, fontSize: 14, color: C.dark }}>{cat.cat}</div>
                <span
                  style={{
                    ...SH,
                    fontSize: 13,
                    color: C.primary,
                    background: `${C.primary}12`,
                    borderRadius: 6,
                    padding: "2px 10px",
                  }}
                >
                  {cat.num} templates
                </span>
              </div>
              {cat.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    ...S,
                    fontSize: 12,
                    color: C.muted,
                    padding: "4px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    borderTop: i > 0 ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  <span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>✓</span> {item}
                </div>
              ))}
            </div>
          ))}
        </div>

        <MockupBox title="novakou.com/vendeur/emails/templates">
          <div style={{ ...S, fontSize: 13, color: C.muted, marginBottom: 14 }}>
            <strong style={{ color: C.dark }}>Comment utiliser un template :</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {[
              "Sélectionnez un template dans la bibliothèque",
              "Personnalisez le nom de votre formation, vos chiffres et vos exemples",
              "Ajoutez votre signature et vos liens",
              "Prévisualisez sur desktop et mobile",
              "Envoyez à votre liste ou programmez",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span
                  style={{
                    ...SH,
                    fontSize: 11,
                    color: "white",
                    background: C.primary,
                    borderRadius: 6,
                    width: 22,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ ...S, fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        </MockupBox>

        {/* ============================================================== */}
        {/*  12 — CONCLUSION                                                */}
        {/* ============================================================== */}
        <SectionHeading id="conclusion" num="12" title="Conclusion et prochaine étape" />

        <Paragraph>
          L&apos;email marketing n&apos;est pas une tactique parmi d&apos;autres. C&apos;est la fondation de votre
          business de formation en ligne. WhatsApp, Facebook, TikTok — ces canaux sont excellents pour
          attirer des visiteurs. Mais votre liste email est l&apos;endroit où vous transformez ces visiteurs
          en clients, et ces clients en acheteurs récurrents.
        </Paragraph>

        <Paragraph>
          Commencez par une seule chose : créez votre lead magnet et configurez votre séquence de bienvenue
          en 5 emails. C&apos;est 2 à 3 heures de travail qui vont travailler pour vous chaque jour, automatiquement,
          pendant des années. Ajoutez ensuite progressivement la séquence de lancement, les relances de panier
          abandonné, et la segmentation.
        </Paragraph>

        <Paragraph>
          Les formateurs qui réussissent sur Novakou ont tous un point commun : ils ont commencé à collecter
          des emails et à envoyer régulièrement des messages à leur liste. Certains ont une liste de 10 000
          contacts. D&apos;autres vendent très bien avec 300 emails soigneusement cultivés. La taille importe
          moins que la qualité de la relation.
        </Paragraph>

        {/* CTA Section */}
        <div
          style={{
            background: `linear-gradient(135deg, ${C.primary}, #008a3a)`,
            borderRadius: 24,
            padding: "48px 40px",
            marginTop: 48,
            textAlign: "center" as const,
            position: "relative" as const,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute" as const, top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute" as const, bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

          <h2 style={{ ...SH, fontSize: 28, color: "white", margin: "0 0 12px", position: "relative" as const }}>
            Prêt à automatiser vos ventes par email ?
          </h2>
          <p style={{ ...S, fontSize: 16, color: "rgba(255,255,255,0.85)", margin: "0 0 28px", maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7, position: "relative" as const }}>
            23 templates email inclus, séquences automatiques, segmentation avancée et A/B testing :
            tout est dans votre compte Novakou. Gratuit pour démarrer.
          </p>

          <Link
            href="/inscription?role=vendeur"
            style={{
              ...S,
              display: "inline-block",
              background: "white",
              color: C.primary,
              fontSize: 16,
              fontWeight: 700,
              padding: "16px 40px",
              borderRadius: 14,
              textDecoration: "none",
              position: "relative" as const,
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            Créer mon compte vendeur — C&apos;est gratuit
          </Link>

          <div style={{ ...S, fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 16, position: "relative" as const }}>
            Rejoint par 850+ créateurs en Afrique francophone
          </div>
        </div>

        {/* Guides connexes */}
        <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 48, paddingTop: 32 }}>
          <div style={{ ...SH, fontSize: 18, color: C.dark, marginBottom: 16 }}>Guides connexes</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { href: "/guides/tunnel-de-vente-novakou", title: "Créer un tunnel de vente sur Novakou", desc: "Builder drag-and-drop, 30+ blocs, checkout Mobile Money" },
              { href: "/guides/description-produit", title: "Rédiger une description de formation irrésistible", desc: "Structure AIDA, bénéfices, preuve sociale, CTA" },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                style={{
                  textDecoration: "none",
                  background: C.surface,
                  borderRadius: 14,
                  padding: 20,
                  border: "1px solid #e2e8f0",
                  display: "block",
                }}
              >
                <div style={{ ...SH, fontSize: 15, color: C.dark, marginBottom: 6 }}>{guide.title}</div>
                <div style={{ ...S, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{guide.desc}</div>
                <div style={{ ...S, fontSize: 13, color: C.primary, fontWeight: 700, marginTop: 8 }}>Lire le guide →</div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 32, paddingTop: 24, textAlign: "center" as const }}>
          <p style={{ ...S, fontSize: 13, color: C.muted, marginBottom: 8 }}>
            Des questions sur l&apos;email marketing ?{" "}
            <Link href="/contact" style={{ color: C.primary, textDecoration: "none", fontWeight: 600 }}>
              Contactez-nous
            </Link>
          </p>
          <p style={{ ...S, fontSize: 12, color: "#94a3b8" }}>Dernière mise à jour : Avril 2026</p>
        </div>
      </article>
    </div>
  );
}
