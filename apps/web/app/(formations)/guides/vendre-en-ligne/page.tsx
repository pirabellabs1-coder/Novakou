import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comment vendre ses formations en ligne en Afrique | Guide complet 2026 · Novakou",
  description:
    "Le guide ultime pour vendre vos formations en ligne en Afrique francophone : tunnel de vente, pricing en FCFA, promotion WhatsApp & Facebook, email marketing, affiliation. Avec etude de cas et methodes eprouvees.",
  keywords: [
    "vendre formation en ligne afrique",
    "vente formation FCFA",
    "tunnel de vente formation",
    "formation en ligne afrique francophone",
    "monetiser savoir afrique",
    "novakou guide vente",
  ],
  openGraph: {
    title: "Comment vendre ses formations en ligne en Afrique — Guide 2026",
    description:
      "12 chapitres, etude de cas, methodes concrets pour transformer votre savoir en revenus recurrents depuis l Afrique francophone.",
    type: "article",
  },
};

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const S = { fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" } as const;
const SH = { ...S, fontWeight: 700, letterSpacing: "-0.04em" } as const;
const C = { primary: "#006e2f", accent: "#22c55e", dark: "#191c1e", muted: "#5c647a", surface: "#f6fbf2" } as const;

/* ------------------------------------------------------------------ */
/*  Table of contents data                                             */
/* ------------------------------------------------------------------ */
const TOC = [
  { id: "marche", num: "01", label: "Le marche des formations en Afrique francophone" },
  { id: "page-vente", num: "02", label: "Preparer sa page de vente qui convertit" },
  { id: "tunnel", num: "03", label: "Creer un tunnel de vente efficace" },
  { id: "psychologie", num: "04", label: "Les 7 leviers psychologiques de vente" },
  { id: "pricing", num: "05", label: "Fixer son prix en FCFA : la methode des 3 paliers" },
  { id: "reseaux", num: "06", label: "Promouvoir sur les reseaux sociaux africains" },
  { id: "email", num: "07", label: "L email marketing : sequences automatisees" },
  { id: "affiliation", num: "08", label: "Le programme d affiliation" },
  { id: "analytics", num: "09", label: "Analyser ses resultats et optimiser" },
  { id: "erreurs", num: "10", label: "Les 5 erreurs qui tuent vos ventes" },
  { id: "etude-cas", num: "11", label: "Etude de cas : Aminata, de 0 a 500 000 FCFA/mois" },
  { id: "conclusion", num: "12", label: "Conclusion et prochaine etape" },
];

/* ------------------------------------------------------------------ */
/*  Reusable visual blocks                                             */
/* ------------------------------------------------------------------ */

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.surface,
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
        background: "#fffbeb",
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

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: "24px 28px",
        textAlign: "center" as const,
        flex: "1 1 180px",
      }}
    >
      <div style={{ ...SH, fontSize: 32, color: C.primary, marginBottom: 4 }}>{value}</div>
      <div style={{ ...S, fontSize: 13, color: C.muted, fontWeight: 500 }}>{label}</div>
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
      {/* Browser bar */}
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

export default function VendreEnLignePage() {
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
            <span style={{ ...S, fontSize: 13, color: C.primary, fontWeight: 600 }}>Vendre en ligne</span>
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
            Guide complet 2026
          </span>

          <h1
            style={{
              ...SH,
              fontSize: 42,
              lineHeight: 1.15,
              color: C.dark,
              margin: "0 0 20px",
            }}
          >
            Comment vendre ses formations en ligne en Afrique
          </h1>

          <p style={{ ...S, fontSize: 18, lineHeight: 1.7, color: C.muted, maxWidth: 640, margin: "0 0 28px" }}>
            Le guide etape par etape pour transformer votre expertise en revenus recurrents.
            Du positionnement au tunnel de vente, du pricing en FCFA aux strategies de promotion
            sur WhatsApp et Facebook : tout ce qu&apos;il faut savoir pour reussir en Afrique francophone.
          </p>

          {/* Meta info */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 20, alignItems: "center" }}>
            <span
              style={{
                ...S,
                fontSize: 13,
                color: C.muted,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", background: C.primary, opacity: 0.15 }} />
              15 min de lecture
            </span>
            <span style={{ ...S, fontSize: 13, color: C.muted, fontWeight: 500 }}>
              12 chapitres
            </span>
            <span style={{ ...S, fontSize: 13, color: C.muted, fontWeight: 500 }}>
              Mis a jour : Avril 2026
            </span>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  TABLE OF CONTENTS                                               */}
      {/* ================================================================ */}
      <section style={{ background: C.surface, borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
          <h2 style={{ ...SH, fontSize: 18, color: C.dark, margin: "0 0 20px" }}>Sommaire</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 8,
            }}
          >
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
                  transition: "background 0.15s",
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
        {/*  01 — LE MARCHE                                                 */}
        {/* ============================================================== */}
        <SectionHeading id="marche" num="01" title="Le marche des formations en ligne en Afrique francophone" />

        <Paragraph>
          L&apos;Afrique francophone vit une revolution silencieuse. Avec plus de 400 millions de francophones
          projetes d&apos;ici 2050, dont 85 % en Afrique, le continent est le plus grand bassin de croissance
          pour l&apos;education numerique au monde. Et ce n&apos;est pas une promesse lointaine : c&apos;est deja
          en train de se produire.
        </Paragraph>

        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, margin: "32px 0" }}>
          <StatBox value="400M+" label="Francophones d ici 2050" />
          <StatBox value="78%" label="Acces mobile en Afrique de l Ouest" />
          <StatBox value="x3" label="Croissance e-learning Afrique 2023-2026" />
        </div>

        <Paragraph>
          Plusieurs facteurs convergent pour creer une fenetre d&apos;opportunite unique. La penetration du
          smartphone explose : au Senegal, en Cote d&apos;Ivoire, au Cameroun, au Benin, plus de 70 % de la
          population a acces a un telephone connecte. Le Mobile Money (Orange Money, Wave, MTN MoMo) a
          democratise le paiement numerique bien avant que les cartes bancaires ne se generalisent.
          Les jeunes diplomes cherchent des competences pratiques que l&apos;universite ne fournit pas. Les
          professionnels en activite veulent se former le soir, a leur rythme.
        </Paragraph>

        <Paragraph>
          Pourtant, l&apos;offre de formations en ligne adaptee a ce marche reste faible. Les plateformes
          occidentales (Udemy, Teachable, Systeme.io) exigent des cartes bancaires internationales, affichent
          les prix en dollars ou en euros, et ne comprennent pas les realites locales. Resultat : un vide
          enorme que des formateurs locaux sont en position ideale pour combler.
        </Paragraph>

        <TipBox>
          <strong>Pourquoi c&apos;est le bon moment :</strong> Le marche africain de l&apos;e-learning devrait atteindre
          15 milliards de dollars d&apos;ici 2030 (source : HolonIQ). Les premiers formateurs positionnes
          aujourd&apos;hui construisent des avantages concurrentiels durables.
        </TipBox>

        <MockupBox title="novakou.com/explorer">
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ ...S, fontSize: 12, background: `${C.primary}14`, color: C.primary, padding: "4px 12px", borderRadius: 8, fontWeight: 600 }}>Populaire</div>
            <div style={{ ...S, fontSize: 12, background: "#f1f5f9", color: C.muted, padding: "4px 12px", borderRadius: 8, fontWeight: 500 }}>Marketing Digital</div>
            <div style={{ ...S, fontSize: 12, background: "#f1f5f9", color: C.muted, padding: "4px 12px", borderRadius: 8, fontWeight: 500 }}>Developpement</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {["Maitriser le Marketing Digital", "Excel pour Professionnels"].map((t) => (
              <div key={t} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                <div style={{ width: "100%", height: 80, background: `linear-gradient(135deg, ${C.primary}15, ${C.accent}15)`, borderRadius: 8, marginBottom: 12 }} />
                <div style={{ ...S, fontSize: 14, fontWeight: 600, color: C.dark }}>{t}</div>
                <div style={{ ...S, fontSize: 13, color: C.accent, fontWeight: 700, marginTop: 8 }}>19 900 FCFA</div>
              </div>
            ))}
          </div>
        </MockupBox>

        {/* ============================================================== */}
        {/*  02 — PAGE DE VENTE                                             */}
        {/* ============================================================== */}
        <SectionHeading id="page-vente" num="02" title="Preparer sa page de vente qui convertit" />

        <Paragraph>
          Votre page de vente est votre commercial infatigable. Elle travaille 24h/24, 7j/7, sans salaire.
          Mais pour qu&apos;elle convertisse, chaque element doit etre pense avec soin. Voici la structure
          eprouvee qui fonctionne sur le marche africain francophone.
        </Paragraph>

        <SubHeading>Le titre : votre premiere impression</SubHeading>

        <Paragraph>
          Un bon titre repond a une seule question : &laquo; Qu&apos;est-ce que je vais obtenir ? &raquo; Il ne
          decrit pas votre formation, il decrit la transformation. Pas &laquo; Formation en marketing digital &raquo;
          mais &laquo; Doublez vos ventes en 30 jours avec le marketing digital &raquo;. Le benefice doit etre
          concret, mesurable, et limite dans le temps.
        </Paragraph>

        <SubHeading>La liste des benefices, pas des modules</SubHeading>

        <Paragraph>
          Vos prospects ne veulent pas savoir que le module 3 contient 12 videos. Ils veulent savoir qu&apos;apres
          votre formation, ils sauront creer une campagne publicitaire Facebook rentable en moins d&apos;une heure.
          Transformez chaque module en benefice tangible. &laquo; Module 5 : SEO &raquo; devient
          &laquo; Apparaitre en premiere page Google sans payer de publicite &raquo;.
        </Paragraph>

        <SubHeading>La preuve sociale : temoignages et resultats</SubHeading>

        <Paragraph>
          En Afrique francophone, la recommandation de bouche-a-oreille est reine. Integrez au minimum
          3 temoignages video ou textuels de vrais apprenants. Montrez leurs resultats concrets : avant/apres,
          captures d&apos;ecran, chiffres. Si vous debutez et n&apos;avez pas encore de temoignages, offrez votre
          formation a 5 personnes en echange de retours honnetes.
        </Paragraph>

        <MockupBox title="novakou.com/produit/marketing-digital-pro">
          <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
            <div style={{ ...SH, fontSize: 22, color: C.dark, marginBottom: 8 }}>Doublez vos ventes en 30 jours</div>
            <div style={{ ...S, fontSize: 14, color: C.muted, marginBottom: 20 }}>La methode complete de marketing digital pour entrepreneurs africains</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              {["127 apprenants", "4.8/5 etoiles", "Garantie 14 jours"].map((t) => (
                <span key={t} style={{ ...S, fontSize: 11, color: C.primary, background: `${C.primary}10`, padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>{t}</span>
              ))}
            </div>
            <div style={{ background: C.primary, color: "white", padding: "12px 32px", borderRadius: 10, display: "inline-block", ...S, fontSize: 14, fontWeight: 700 }}>
              Rejoindre maintenant — 29 900 FCFA
            </div>
          </div>
        </MockupBox>

        <TipBox>
          <strong>Astuce Novakou :</strong> Notre editeur de page produit inclut des blocs pre-configures
          pour les temoignages, la FAQ, et les garanties. Vous n&apos;avez pas besoin de coder quoi que ce soit.
        </TipBox>

        {/* ============================================================== */}
        {/*  03 — TUNNEL DE VENTE                                           */}
        {/* ============================================================== */}
        <SectionHeading id="tunnel" num="03" title="Creer un tunnel de vente efficace" />

        <Paragraph>
          Un tunnel de vente (ou funnel) est le parcours que suit votre prospect, du premier contact jusqu&apos;a
          l&apos;achat. Chaque etape a un seul objectif : faire avancer le visiteur vers l&apos;etape suivante. Pas
          de distraction, pas de lien externe, pas de menu de navigation complexe.
        </Paragraph>

        <SubHeading>La structure ideale en 4 etapes</SubHeading>

        {/* Funnel visualization */}
        <div style={{ margin: "28px 0" }}>
          {[
            { step: "1", label: "Page d atterrissage", desc: "Capturer l attention + collecter l email. Un titre percutant, un benefice clair, un formulaire.", color: C.primary },
            { step: "2", label: "Page de vente", desc: "Presenter la formation, les benefices, les temoignages, la garantie. Un seul CTA : acheter.", color: C.accent },
            { step: "3", label: "Page de paiement", desc: "Formulaire simple. Mobile Money + carte. Order bump (produit complementaire a petit prix).", color: "#0ea5e9" },
            { step: "4", label: "Page de remerciement", desc: "Confirmation + upsell. Proposer un coaching, un pack premium, un abonnement.", color: "#8b5cf6" },
          ].map((item, i) => (
            <div
              key={item.step}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                padding: "20px 0",
                borderBottom: i < 3 ? "1px solid #f1f5f9" : "none",
              }}
            >
              <div
                style={{
                  ...SH,
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${item.color}14`,
                  color: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div>
                <div style={{ ...SH, fontSize: 16, color: C.dark }}>{item.label}</div>
                <div style={{ ...S, fontSize: 14, color: C.muted, marginTop: 4, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <Paragraph>
          Sur Novakou, vous pouvez construire ce tunnel complet sans aucun outil externe. Le builder de
          funnel integre vous permet de creer chaque page, de configurer l&apos;order bump et l&apos;upsell, et de
          connecter votre passerelle de paiement (Mobile Money ou carte) en quelques clics.
        </Paragraph>

        <WarningBox>
          <strong>Erreur frequente :</strong> Ne renvoyez jamais un prospect vers votre page d&apos;accueil
          depuis une publicite. Utilisez toujours une page d&apos;atterrissage dediee, sans menu de navigation,
          avec un seul objectif. Le taux de conversion chute de 30 a 50 % avec un lien vers la page d&apos;accueil.
        </WarningBox>

        {/* ============================================================== */}
        {/*  04 — PSYCHOLOGIE                                               */}
        {/* ============================================================== */}
        <SectionHeading id="psychologie" num="04" title="Les 7 leviers psychologiques de vente" />

        <Paragraph>
          Vendre n&apos;est pas manipuler. C&apos;est comprendre comment les gens prennent des decisions et
          les aider a faire le meilleur choix pour eux. Ces 7 leviers, identifies par la recherche en psychologie
          sociale, sont utilises par toutes les grandes plateformes. Voici comment les appliquer avec integrite
          sur le marche africain.
        </Paragraph>

        <div style={{ margin: "28px 0" }}>
          {[
            { num: "1", title: "Urgence", desc: "Une offre limitee dans le temps. L inscription ferme vendredi soir a 23h59. Les gens agissent quand le temps presse, pas quand c est confortable.", example: "Exemple : Compte a rebours sur votre page de vente." },
            { num: "2", title: "Rarete", desc: "Places limitees a 50 apprenants pour garantir un suivi personnalise. La rarete rend votre offre plus desirable et cree une perception de valeur elevee.", example: "Exemple : Jauge de places restantes en temps reel." },
            { num: "3", title: "Preuve sociale", desc: "127 personnes ont deja rejoint cette formation. Quand les gens voient que d autres ont pris la decision, ils se sentent rassures.", example: "Exemple : Temoignages + nombre d inscrits affiches." },
            { num: "4", title: "Garantie", desc: "Satisfait ou rembourse sous 14 jours, sans question. Retirer le risque de l acheteur est le levier le plus puissant et le moins utilise.", example: "Exemple : Badge garantie visible pres du bouton d achat." },
            { num: "5", title: "Autorite", desc: "Montrez vos credentials, vos resultats, vos clients. Pourquoi devrait-on vous ecouter ? Affichez votre expertise avec des preuves concretes.", example: "Exemple : Section A propos du formateur avec parcours." },
            { num: "6", title: "Reciprocite", desc: "Donnez avant de demander. Un module gratuit, un PDF, un webinaire. Les gens qui recoivent veulent rendre la pareille.", example: "Exemple : Lead magnet gratuit avant la vente." },
            { num: "7", title: "FOMO", desc: "La peur de rater quelque chose. Montrez les resultats de ceux qui ont deja rejoint. Ce n est pas de la manipulation, c est de l information.", example: "Exemple : Captures de resultats d apprenants." },
          ].map((item) => (
            <div
              key={item.num}
              style={{
                background: "#fafafa",
                borderRadius: 14,
                padding: "20px 24px",
                marginBottom: 12,
                border: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    ...SH,
                    fontSize: 13,
                    color: "white",
                    background: C.primary,
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.num}
                </span>
                <span style={{ ...SH, fontSize: 16, color: C.dark }}>{item.title}</span>
              </div>
              <div style={{ ...S, fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>{item.desc}</div>
              <div style={{ ...S, fontSize: 13, color: C.primary, fontWeight: 600, fontStyle: "italic" as const }}>{item.example}</div>
            </div>
          ))}
        </div>

        <TipBox>
          <strong>Sur Novakou :</strong> Le builder de funnel integre un compte a rebours, une jauge de
          places, un affichage du nombre d&apos;inscrits, et un badge de garantie. Tous ces leviers
          psychologiques sont disponibles en blocs drag-and-drop.
        </TipBox>

        {/* ============================================================== */}
        {/*  05 — PRICING                                                   */}
        {/* ============================================================== */}
        <SectionHeading id="pricing" num="05" title="Fixer son prix en FCFA : la methode des 3 paliers" />

        <Paragraph>
          Le pricing est l&apos;un des exercices les plus difficiles pour les formateurs africains. Trop cher,
          vous excluez votre audience. Trop peu cher, vous devaluez votre expertise et ne pouvez pas
          reinvestir dans la qualite. La methode des 3 paliers resout ce dilemme en offrant un choix
          qui satisfait tous les profils.
        </Paragraph>

        <SubHeading>Le principe des 3 paliers</SubHeading>

        {/* Pricing mockup */}
        <MockupBox title="novakou.com/produit/formation-excel/tarifs">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { name: "Essentiel", price: "9 900", features: ["Acces aux 12 modules video", "Exercices pratiques", "Certificat de completion", "Acces a vie"] },
              { name: "Premium", price: "24 900", features: ["Tout l Essentiel", "3 sessions de coaching live", "Templates Excel professionnels", "Communaute privee WhatsApp"], highlight: true },
              { name: "VIP", price: "49 900", features: ["Tout le Premium", "1h de coaching individuel", "Audit de vos fichiers Excel", "Acces prioritaire aux mises a jour"] },
            ].map((plan) => (
              <div
                key={plan.name}
                style={{
                  border: plan.highlight ? `2px solid ${C.primary}` : "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 20,
                  position: "relative" as const,
                  background: plan.highlight ? C.surface : "white",
                }}
              >
                {plan.highlight && (
                  <div style={{ ...S, position: "absolute" as const, top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 700, color: "white", background: C.primary, padding: "2px 12px", borderRadius: 20, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    Populaire
                  </div>
                )}
                <div style={{ ...SH, fontSize: 15, color: C.dark, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ ...SH, fontSize: 24, color: C.primary, marginBottom: 12 }}>{plan.price} <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>FCFA</span></div>
                {plan.features.map((f) => (
                  <div key={f} style={{ ...S, fontSize: 12, color: C.muted, padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: C.accent, fontSize: 14 }}>&#10003;</span> {f}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </MockupBox>

        <Paragraph>
          Le palier du milieu (&laquo; Premium &raquo;) est votre cible. C&apos;est celui que la majorite des gens
          vont choisir, car il apparait comme le meilleur rapport qualite-prix entre l&apos;option de base et
          l&apos;option luxe. Le palier VIP existe principalement pour rendre le Premium plus attractif par contraste.
        </Paragraph>

        <SubHeading>Grille de prix indicative par type de formation</SubHeading>

        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", margin: "24px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const, ...S, fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: C.dark, borderBottom: "1px solid #e2e8f0" }}>Type</th>
                <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: C.dark, borderBottom: "1px solid #e2e8f0" }}>Essentiel</th>
                <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: C.dark, borderBottom: "1px solid #e2e8f0" }}>Premium</th>
                <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: C.dark, borderBottom: "1px solid #e2e8f0" }}>VIP</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Mini-cours (2-3h)", "4 900", "9 900", "19 900"],
                ["Formation complete (8-15h)", "14 900", "29 900", "59 900"],
                ["Programme premium (20h+)", "29 900", "59 900", "99 900"],
                ["Coaching + formation", "49 900", "99 900", "199 900"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: "12px 16px",
                        color: j === 0 ? C.dark : C.muted,
                        fontWeight: j === 0 ? 600 : 400,
                        borderBottom: i < 3 ? "1px solid #f1f5f9" : "none",
                      }}
                    >
                      {j > 0 ? `${cell} FCFA` : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <WarningBox>
          <strong>Ne sous-estimez pas votre prix.</strong> L&apos;erreur la plus courante des formateurs africains
          est de brader leur expertise. Une formation a 2 000 FCFA envoie le signal que le contenu
          a peu de valeur. Positionnez-vous sur la qualite, pas sur le volume.
        </WarningBox>

        {/* ============================================================== */}
        {/*  06 — RESEAUX SOCIAUX                                           */}
        {/* ============================================================== */}
        <SectionHeading id="reseaux" num="06" title="Promouvoir sur les reseaux sociaux africains" />

        <Paragraph>
          En Afrique francophone, les reseaux sociaux ne sont pas les memes qu&apos;en Europe ou en Amerique
          du Nord. WhatsApp est le roi inconteste. Facebook reste massif. TikTok explose chez les 18-35 ans.
          Instagram fonctionne pour le visuel. LinkedIn est marginal. Voici comment exploiter chaque canal
          pour vendre vos formations.
        </Paragraph>

        <SubHeading>WhatsApp : votre canal numero 1</SubHeading>

        <Paragraph>
          WhatsApp est l&apos;application la plus utilisee en Afrique de l&apos;Ouest. C&apos;est la ou les gens
          communiquent, font du commerce, et partagent du contenu. Pour un formateur, c&apos;est une mine d&apos;or.
          Creez un statut WhatsApp quotidien avec un conseil gratuit lie a votre expertise. Partagez des
          temoignages de vos apprenants. Utilisez les listes de diffusion (pas les groupes) pour envoyer
          vos offres sans spammer. Novakou genere des liens de vente partageables sur WhatsApp en un clic.
        </Paragraph>

        <SubHeading>Facebook : la puissance des groupes</SubHeading>

        <Paragraph>
          Les groupes Facebook thematiques sont extremement actifs en Afrique francophone. &laquo; Marketing
          Digital Afrique &raquo;, &laquo; Entrepreneurs du Cameroun &raquo;, &laquo; Formation en ligne Senegal &raquo; :
          ces communautes comptent des dizaines de milliers de membres actifs. Apportez de la valeur gratuite
          pendant 2 semaines avant de presenter votre formation. La strategie &laquo; 80/20 &raquo; fonctionne :
          80 % de contenu utile, 20 % de promotion.
        </Paragraph>

        <SubHeading>TikTok et Instagram : le format court</SubHeading>

        <Paragraph>
          Les videos courtes (30-90 secondes) fonctionnent exceptionnellement bien pour attirer une audience
          qualifiee. Un conseil rapide, une demonstration, un avant/apres. L&apos;objectif n&apos;est pas de vendre
          directement sur TikTok mais de rediriger vers votre bio link, qui mene a votre page de vente Novakou.
          Publiez 3 a 5 fois par semaine pour construire une audience reguliere.
        </Paragraph>

        <MockupBox title="Strategie reseaux sociaux — calendrier type">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {[
              { jour: "Lun", action: "Conseil gratuit", canal: "WhatsApp Status" },
              { jour: "Mar", action: "Video courte", canal: "TikTok + Reels" },
              { jour: "Mer", action: "Post valeur", canal: "Groupe Facebook" },
              { jour: "Jeu", action: "Temoignage", canal: "WhatsApp + Story" },
              { jour: "Ven", action: "Offre limitee", canal: "Tous canaux" },
            ].map((d) => (
              <div key={d.jour} style={{ background: "#f8fafc", borderRadius: 10, padding: 12, textAlign: "center" as const }}>
                <div style={{ ...SH, fontSize: 13, color: C.primary, marginBottom: 6 }}>{d.jour}</div>
                <div style={{ ...S, fontSize: 11, color: C.dark, fontWeight: 600, marginBottom: 4 }}>{d.action}</div>
                <div style={{ ...S, fontSize: 10, color: C.muted }}>{d.canal}</div>
              </div>
            ))}
          </div>
        </MockupBox>

        {/* ============================================================== */}
        {/*  07 — EMAIL MARKETING                                           */}
        {/* ============================================================== */}
        <SectionHeading id="email" num="07" title="L email marketing : sequences de vente automatisees" />

        <Paragraph>
          L&apos;email marketing reste le canal avec le meilleur retour sur investissement au monde : pour
          chaque euro investi, le retour moyen est de 36 euros. En Afrique francophone, l&apos;email est moins
          sature qu&apos;en Europe, ce qui signifie de meilleurs taux d&apos;ouverture (souvent 30 a 45 % contre
          20 % en moyenne mondiale).
        </Paragraph>

        <SubHeading>La sequence de bienvenue (5 emails)</SubHeading>

        <Paragraph>
          Quand quelqu&apos;un telecharge votre lead magnet gratuit ou s&apos;inscrit a votre newsletter, il entre
          dans votre sequence automatisee. Voici la structure ideale sur 7 jours.
        </Paragraph>

        <div style={{ margin: "24px 0" }}>
          {[
            { jour: "J+0", objet: "Votre [ressource] est prete", desc: "Livrer le lead magnet + se presenter brievement. Installer la confiance." },
            { jour: "J+1", objet: "Mon parcours (et pourquoi ca vous concerne)", desc: "Raconter votre histoire. Montrer que vous comprenez les defis de votre audience." },
            { jour: "J+3", objet: "La plus grosse erreur en [domaine]", desc: "Apporter de la valeur. Pointer un probleme que votre formation resout." },
            { jour: "J+5", objet: "Comment [resultat] en [delai]", desc: "Etude de cas ou temoignage d un apprenant. Preuve sociale." },
            { jour: "J+7", objet: "Offre speciale (expire dimanche)", desc: "Presenter votre formation avec un avantage temporaire. CTA clair." },
          ].map((email, i) => (
            <div
              key={email.jour}
              style={{
                display: "flex",
                gap: 16,
                padding: "16px 0",
                borderBottom: i < 4 ? "1px solid #f1f5f9" : "none",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  ...SH,
                  fontSize: 12,
                  color: C.primary,
                  background: `${C.primary}10`,
                  padding: "4px 10px",
                  borderRadius: 6,
                  flexShrink: 0,
                  minWidth: 42,
                  textAlign: "center" as const,
                }}
              >
                {email.jour}
              </span>
              <div>
                <div style={{ ...S, fontSize: 14, fontWeight: 700, color: C.dark }}>{email.objet}</div>
                <div style={{ ...S, fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.6 }}>{email.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <TipBox>
          <strong>Automatisation Novakou :</strong> Le module de sequences email integre vous permet de
          creer cette sequence en 10 minutes. Chaque email se declenche automatiquement apres l&apos;inscription.
          Vous pouvez aussi segmenter par pays, par interet, ou par comportement d&apos;achat.
        </TipBox>

        {/* ============================================================== */}
        {/*  08 — AFFILIATION                                               */}
        {/* ============================================================== */}
        <SectionHeading id="affiliation" num="08" title="Le programme d affiliation : transformer vos clients en vendeurs" />

        <Paragraph>
          Le bouche-a-oreille est le canal d&apos;acquisition le plus puissant en Afrique. Le programme
          d&apos;affiliation le systematise : vos apprenants satisfaits partagent un lien unique et touchent
          une commission sur chaque vente generee. C&apos;est gagnant pour tout le monde.
        </Paragraph>

        <SubHeading>Comment fonctionne l&apos;affiliation sur Novakou</SubHeading>

        <Paragraph>
          Chaque vendeur sur Novakou peut activer son programme d&apos;affiliation en un clic. Vous definissez
          le taux de commission (generalement 20 a 30 %), la duree du cookie de tracking (30 ou 90 jours),
          et c&apos;est parti. Vos affilies recoivent un lien unique, un dashboard de suivi, et sont payes
          automatiquement a chaque vente validee.
        </Paragraph>

        <MockupBox title="novakou.com/affilie/dashboard">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
            <div style={{ background: C.surface, borderRadius: 10, padding: 16, textAlign: "center" as const }}>
              <div style={{ ...SH, fontSize: 22, color: C.primary }}>47</div>
              <div style={{ ...S, fontSize: 11, color: C.muted, marginTop: 4 }}>Clics ce mois</div>
            </div>
            <div style={{ background: C.surface, borderRadius: 10, padding: 16, textAlign: "center" as const }}>
              <div style={{ ...SH, fontSize: 22, color: C.primary }}>8</div>
              <div style={{ ...S, fontSize: 11, color: C.muted, marginTop: 4 }}>Ventes generees</div>
            </div>
            <div style={{ background: C.surface, borderRadius: 10, padding: 16, textAlign: "center" as const }}>
              <div style={{ ...SH, fontSize: 22, color: C.primary }}>59 700</div>
              <div style={{ ...S, fontSize: 11, color: C.muted, marginTop: 4 }}>FCFA gagnes</div>
            </div>
          </div>
          <div style={{ ...S, fontSize: 12, color: C.muted, padding: "12px 16px", background: "#f8fafc", borderRadius: 8 }}>
            Votre lien : <span style={{ color: C.primary, fontWeight: 600 }}>novakou.com/r/aminata-excel</span>
          </div>
        </MockupBox>

        <Paragraph>
          Les meilleurs formateurs sur Novakou generent 25 a 40 % de leurs ventes via l&apos;affiliation.
          L&apos;astuce : contactez personnellement vos 10 meilleurs apprenants et proposez-leur de devenir
          affilies. Fournissez-leur des messages pre-rediges pour WhatsApp et des visuels pour Facebook.
          Plus vous facilitez le travail de vos affilies, plus ils vendent.
        </Paragraph>

        {/* ============================================================== */}
        {/*  09 — ANALYTICS                                                 */}
        {/* ============================================================== */}
        <SectionHeading id="analytics" num="09" title="Analyser ses resultats et optimiser" />

        <Paragraph>
          Ce qui ne se mesure pas ne s&apos;ameliore pas. Vendre des formations en ligne, c&apos;est un processus
          iteratif : vous lancez, vous mesurez, vous ajustez, vous relancez. Voici les metriques cles
          a suivre et les benchmarks pour le marche africain.
        </Paragraph>

        <SubHeading>Les 6 metriques essentielles</SubHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, margin: "24px 0" }}>
          {[
            { metric: "Taux de conversion page de vente", benchmark: "3-8%", desc: "Visiteurs qui achetent" },
            { metric: "Cout d acquisition client (CAC)", benchmark: "< 30% du prix", desc: "Depense pub par vente" },
            { metric: "Valeur a vie client (LTV)", benchmark: "> 3x le CAC", desc: "Revenu total par client" },
            { metric: "Taux d ouverture email", benchmark: "30-45%", desc: "Emails ouverts / envoyes" },
            { metric: "Taux de remboursement", benchmark: "< 5%", desc: "Remboursements / ventes" },
            { metric: "Taux de completion", benchmark: "> 40%", desc: "Apprenants qui finissent" },
          ].map((m) => (
            <div key={m.metric} style={{ background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ ...S, fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>{m.metric}</div>
              <div style={{ ...SH, fontSize: 20, color: C.primary, marginBottom: 4 }}>{m.benchmark}</div>
              <div style={{ ...S, fontSize: 12, color: C.muted }}>{m.desc}</div>
            </div>
          ))}
        </div>

        <Paragraph>
          Novakou affiche toutes ces metriques dans votre tableau de bord vendeur, en temps reel. Vous
          pouvez filtrer par periode, par produit, par source de trafic. Le dashboard identifie aussi
          automatiquement les points de friction de votre tunnel : si beaucoup de visiteurs quittent
          la page de paiement, c&apos;est peut-etre un probleme de methode de paiement ou de prix.
        </Paragraph>

        <TipBox>
          <strong>Regle des 80/20 :</strong> Concentrez vos efforts sur les 20 % d&apos;actions qui generent
          80 % de vos resultats. En general, ce sont l&apos;amelioration de votre page de vente et l&apos;envoi
          regulier d&apos;emails a votre liste. Pas la creation de nouveau contenu sur 5 reseaux sociaux differents.
        </TipBox>

        {/* ============================================================== */}
        {/*  10 — ERREURS                                                   */}
        {/* ============================================================== */}
        <SectionHeading id="erreurs" num="10" title="Les 5 erreurs qui tuent vos ventes (et comment les eviter)" />

        <Paragraph>
          Apres avoir accompagne des centaines de formateurs africains, nous avons identifie 5 erreurs
          recurrentes qui empechent de vendre. Les voici, avec les solutions concretes pour les eviter.
        </Paragraph>

        <div style={{ margin: "28px 0" }}>
          {[
            {
              num: "1",
              title: "Creer la formation AVANT de la vendre",
              desc: "Beaucoup de formateurs passent 3 mois a filmer 40 heures de video avant de savoir si quelqu un veut les acheter. Validez la demande d abord : faites une pre-vente avec un plan de cours, une promesse, et un delai de livraison. Si personne n achete, vous avez economise 3 mois.",
              fix: "Pre-vendez votre formation avant de la produire. 10 pre-ventes = signal vert pour produire.",
            },
            {
              num: "2",
              title: "Vendre a tout le monde (ne cibler personne)",
              desc: "Formation en marketing pour tous les entrepreneurs d Afrique ? Trop vague. Formation en marketing Instagram pour les coachs fitness francophones ? Parfait. Plus votre niche est precise, plus votre message resonne et plus votre taux de conversion est eleve.",
              fix: "Definissez votre avatar client ideal : age, pays, probleme precis, pouvoir d achat.",
            },
            {
              num: "3",
              title: "Ne proposer qu un seul moyen de paiement",
              desc: "Si vous ne proposez que le paiement par carte bancaire, vous excluez 60 a 70 % de vos prospects en Afrique de l Ouest. Orange Money, Wave, et MTN Mobile Money sont les moyens de paiement principaux. Novakou les integre tous nativement.",
              fix: "Activez au minimum Mobile Money + carte bancaire. Idealement, ajoutez Wave et le virement.",
            },
            {
              num: "4",
              title: "Ignorer l email marketing",
              desc: "Les reseaux sociaux sont des terrains loues : un changement d algorithme peut reduire votre visibilite a zero du jour au lendemain. Votre liste email vous appartient. C est le seul actif marketing que personne ne peut vous retirer.",
              fix: "Collectez des emails depuis le jour 1. Envoyez au minimum 1 email par semaine a votre liste.",
            },
            {
              num: "5",
              title: "Ne jamais relancer les abandons de panier",
              desc: "En moyenne, 70 % des visiteurs qui arrivent sur votre page de paiement ne finalisent pas leur achat. Pas parce qu ils ne veulent pas, mais parce qu ils sont distraits, hesitants, ou ont ete interrompus. Une simple sequence de 3 emails de relance recupere 10 a 25 % de ces ventes perdues.",
              fix: "Activez la relance automatique de panier abandonne sur Novakou. C est un clic.",
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
        {/*  11 — ETUDE DE CAS                                              */}
        {/* ============================================================== */}
        <SectionHeading id="etude-cas" num="11" title="Etude de cas : Aminata, de 0 a 500 000 FCFA/mois" />

        <Paragraph>
          Aminata est une comptable senegalaise de 32 ans basee a Dakar. Comme beaucoup de professionnels
          africains, elle maitrise parfaitement son domaine mais n&apos;avait jamais envisage de vendre des
          formations en ligne. Voici son parcours, mois par mois.
        </Paragraph>

        {/* Timeline */}
        <div style={{ margin: "28px 0", borderLeft: `3px solid ${C.accent}40`, paddingLeft: 28 }}>
          {[
            {
              period: "Mois 1",
              title: "La validation",
              desc: "Aminata poste un sondage dans 3 groupes Facebook de comptabilite. 67 personnes disent vouloir une formation Excel pour comptables. Elle cree une page de pre-vente sur Novakou avec 3 paliers : Essentiel a 9 900 FCFA, Premium a 24 900 FCFA, VIP a 49 900 FCFA. Resultat : 14 pre-ventes en 10 jours, soit 289 100 FCFA.",
              revenue: "289 100 FCFA",
            },
            {
              period: "Mois 2",
              title: "La production + le lancement",
              desc: "Elle filme 12 modules video avec son telephone et un micro-cravate a 8 000 FCFA. Elle upload tout sur Novakou, configure sa page de vente avec temoignages des 14 premiers apprenants, et lance une campagne de 7 jours avec urgence (prix de lancement). 41 nouvelles ventes.",
              revenue: "823 000 FCFA cumulatif",
            },
            {
              period: "Mois 3",
              title: "L affiliation + les sequences email",
              desc: "Aminata active le programme d affiliation a 25 % de commission. 8 de ses apprenants partagent leur lien. En parallele, elle cree un lead magnet (PDF les 10 formules Excel que tout comptable doit connaitre) et une sequence de 5 emails automatisee. Sa liste email atteint 340 contacts. 52 ventes ce mois.",
              revenue: "1 180 000 FCFA cumulatif",
            },
            {
              period: "Mois 4-6",
              title: "L optimisation",
              desc: "Elle analyse son dashboard Novakou : 62 % des ventes viennent de WhatsApp, 23 % de l affiliation, 15 % de l email. Elle double ses efforts sur WhatsApp (statuts quotidiens, listes de diffusion). Elle cree un deuxieme produit : un pack de templates Excel premium a 14 900 FCFA. Ses revenus mensuels se stabilisent autour de 500 000 FCFA.",
              revenue: "~500 000 FCFA/mois",
            },
          ].map((step, i) => (
            <div key={step.period} style={{ marginBottom: i < 3 ? 32 : 0, position: "relative" as const }}>
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
                {step.period}
              </div>
              <div style={{ ...SH, fontSize: 17, color: C.dark, marginBottom: 8 }}>{step.title}</div>
              <div style={{ ...S, fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>{step.desc}</div>
              <div
                style={{
                  ...S,
                  display: "inline-block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.primary,
                  background: `${C.primary}10`,
                  padding: "4px 14px",
                  borderRadius: 8,
                }}
              >
                {step.revenue}
              </div>
            </div>
          ))}
        </div>

        <TipBox>
          <strong>Ce qu&apos;Aminata a fait differemment :</strong> Elle a valide la demande AVANT de creer
          le contenu. Elle a commence avec un telephone portable, pas du materiel professionnel. Elle a
          active l&apos;affiliation des le mois 3. Et surtout, elle a choisi une niche ultra-precise :
          Excel pour comptables — pas &laquo; Excel pour tout le monde &raquo;.
        </TipBox>

        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, margin: "32px 0" }}>
          <StatBox value="500K" label="FCFA / mois en revenus" />
          <StatBox value="x14" label="ROI sur la pre-vente initiale" />
          <StatBox value="340" label="Contacts email en 3 mois" />
        </div>

        {/* ============================================================== */}
        {/*  12 — CONCLUSION + CTA                                          */}
        {/* ============================================================== */}
        <SectionHeading id="conclusion" num="12" title="Conclusion : votre prochaine etape" />

        <Paragraph>
          Vendre des formations en ligne en Afrique francophone n&apos;est plus une utopie reservee aux
          &laquo; gros &raquo; formateurs avec du materiel professionnel et un budget marketing important.
          Avec les bons outils, la bonne methode, et la perseverance, n&apos;importe quel expert peut
          transformer son savoir en revenus recurrents.
        </Paragraph>

        <Paragraph>
          Recapitulons les etapes cles : validez la demande avec une pre-vente, construisez une page
          de vente centree sur les benefices, creez un tunnel simple en 4 etapes, fixez vos prix avec
          la methode des 3 paliers, promouvez d&apos;abord sur WhatsApp et Facebook, automatisez vos emails,
          activez l&apos;affiliation, et mesurez tout pour optimiser.
        </Paragraph>

        <Paragraph>
          Le marche africain de l&apos;e-learning est en pleine explosion. Les formateurs qui se positionnent
          aujourd&apos;hui construisent un avantage concurrentiel durable. Ceux qui attendent &laquo; que ce soit
          le bon moment &raquo; se retrouveront face a une concurrence plus forte dans 12 mois.
        </Paragraph>

        <Paragraph>
          La question n&apos;est pas &laquo; est-ce que ca peut marcher pour moi ? &raquo; mais &laquo; est-ce que
          je suis pret a commencer ? &raquo;
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
          {/* Decorative circle */}
          <div
            style={{
              position: "absolute" as const,
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute" as const,
              bottom: -30,
              left: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />

          <h2 style={{ ...SH, fontSize: 28, color: "white", margin: "0 0 12px", position: "relative" as const }}>
            Pret a lancer votre premiere formation ?
          </h2>
          <p
            style={{
              ...S,
              fontSize: 16,
              color: "rgba(255,255,255,0.85)",
              margin: "0 0 28px",
              maxWidth: 480,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.7,
              position: "relative" as const,
            }}
          >
            Creez votre compte vendeur gratuitement. Page de vente, tunnel, paiement Mobile Money,
            affiliation, sequences email : tout est inclus. Pas de carte bancaire requise.
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
            Creer mon compte vendeur — C&apos;est gratuit
          </Link>

          <div style={{ ...S, fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 16, position: "relative" as const }}>
            Rejoint par 850+ createurs en Afrique francophone
          </div>
        </div>

        {/* End note */}
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            marginTop: 48,
            paddingTop: 32,
            textAlign: "center" as const,
          }}
        >
          <p style={{ ...S, fontSize: 13, color: C.muted, marginBottom: 8 }}>
            Vous avez une question sur la vente de formations en ligne ? Contactez-nous a{" "}
            <Link href="/contact" style={{ color: C.primary, textDecoration: "none", fontWeight: 600 }}>
              support@novakou.com
            </Link>
          </p>
          <p style={{ ...S, fontSize: 12, color: "#94a3b8" }}>
            Derniere mise a jour : Avril 2026
          </p>
        </div>
      </article>
    </div>
  );
}
