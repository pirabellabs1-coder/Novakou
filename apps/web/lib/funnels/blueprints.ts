// ═════════════════════════════════════════════════════════════════════════════
// FUNNEL BLUEPRINTS — Novakou
// 10 modèles de TUNNELS multi-étapes (opt-in → vente → checkout → upsell → merci),
// chacun déclinable en 2 ambiances (Clair / Profond) = 20 variantes.
//
// Chaque blueprint.build(ambiance) renvoie une liste d'étapes prêtes à POSTer sur
// /api/formations/vendeur/funnels/ai-create ({ name, theme, steps }).
//
// Toutes les couleurs de marque passent par les variables CSS de palette
// (var(--fn-*)) injectées au rendu → un blueprint fonctionne avec les 8 palettes
// et se ré-harmonise si le vendeur change de palette, SANS toucher au contenu.
// Copie FR réaliste pour le marché africain francophone : FCFA, Mobile Money
// d'abord (Wave, Orange Money, MTN MoMo), typographie soignée.
// ═════════════════════════════════════════════════════════════════════════════

export type BpBlock = { id: string; type: string; data: Record<string, unknown> };
export type BpStep = { stepType: string; name: string; headlineFr?: string; blocks: BpBlock[] };
export type Ambiance = "clair" | "profond";

export interface FunnelBlueprint {
  key: string;
  label: string;
  tagline: string;
  description: string;
  /** Nom d'icône lucide (résolu dans la galerie). */
  icon: string;
  /** Objectif business court. */
  goal: string;
  /** Clé de palette recommandée (voir THEME_PRESETS). */
  recommendedPalette: string;
  /** Dégradé d'aperçu pour la carte de la galerie. */
  preview: string;
  /** Étiquettes des étapes (pour l'aperçu). */
  stepLabels: string[];
  build: (amb: Ambiance) => BpStep[];
}

/* ─── Typographie FR ──────────────────────────────────────────────── */
const NNBSP = " "; // espace fine insécable (milliers)
const NBSP = " "; // espace insécable (avant ? ! : ;)

/** Formate un montant en FCFA avec séparateur de milliers insécable. */
function fcfa(n: number): string {
  const s = Math.round(n).toString();
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += NNBSP;
    out += s[i];
  }
  return out + NBSP + "FCFA";
}
/** Ajoute l'espace insécable avant la ponctuation double. */
function fr(s: string): string {
  return s.replace(/ ([?!:;])/g, NBSP + "$1");
}

/* ─── Identifiants stables ────────────────────────────────────────── */
let seq = 0;
const nid = (t: string) => `bp-${t}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/* ─── Tokens d'ambiance ───────────────────────────────────────────── */
interface Tokens {
  pageBg: string;
  bgA: string; // fond de section principal
  bgB: string; // fond de section alterné
  heroBg: string;
  ink: string; // texte principal
  muted: string; // texte secondaire
  onDark: string; // texte sur fond sombre
  cardBg: string;
  line: string;
}
function tokens(amb: Ambiance): Tokens {
  const dark = amb === "profond";
  return {
    pageBg: dark ? "var(--fn-night)" : "#FFFFFF",
    bgA: dark ? "var(--fn-night)" : "#FFFFFF",
    bgB: dark ? "var(--fn-deep)" : "var(--fn-tint)",
    heroBg: "linear-gradient(135deg, var(--fn-deep), var(--fn-night))",
    ink: dark ? "#F4F6F5" : "var(--fn-ink)",
    muted: dark ? "rgba(244,246,245,0.72)" : "var(--fn-grey)",
    onDark: "#FFFFFF",
    cardBg: dark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
    line: dark ? "rgba(255,255,255,0.12)" : "var(--fn-line)",
  };
}

/* ─── Constructeurs de blocs ──────────────────────────────────────── */
type O = Record<string, unknown>;

const heading = (content: string, o: O = {}): BpBlock => ({
  id: nid("h"), type: "heading",
  data: { content: fr(content), level: o.level ?? 2, align: o.align ?? "center", color: o.color ?? "", ...(o.size ? { size: o.size } : {}) },
});
const text = (content: string, o: O = {}): BpBlock => ({
  id: nid("t"), type: "text",
  data: { content: fr(content), align: o.align ?? "center", size: o.size ?? 17, color: o.color ?? "" },
});
const eyebrow = (content: string, o: O = {}): BpBlock =>
  text(content.toUpperCase(), { size: 13, align: o.align ?? "center", color: o.color ?? "var(--fn-primary)" });
const btn = (label: string, o: O = {}): BpBlock => ({
  id: nid("b"), type: "button",
  data: {
    text: fr(label), link: o.link ?? "", style: o.style ?? "primary", size: o.size ?? "lg", align: o.align ?? "center",
    bgColor: o.bg ?? "var(--fn-primary)", textColor: o.fg ?? "var(--fn-on-primary)", fullWidth: o.full ?? true,
    icon: o.icon ?? "", ...(o.subText ? { subText: fr(o.subText as string) } : {}),
  },
});
const list = (items: string[], o: O = {}): BpBlock => ({
  id: nid("l"), type: "list",
  data: { items: items.map(fr), icon: o.icon ?? "check_circle", color: o.color ?? "var(--fn-primary)", ...(o.textColor ? { textColor: o.textColor } : {}) },
});
const spacer = (height: number): BpBlock => ({ id: nid("s"), type: "spacer", data: { height } });
const divider = (o: O = {}): BpBlock => ({ id: nid("d"), type: "divider", data: { color: o.color ?? "var(--fn-line)", thickness: 1, width: o.width ?? 100, shape: "line" } });
const image = (url: string, o: O = {}): BpBlock => ({ id: nid("i"), type: "image", data: { url, alt: o.alt ?? "", align: o.align ?? "center", radius: o.radius ?? 16 } });
const video = (url: string, caption = ""): BpBlock => ({ id: nid("v"), type: "video", data: { externalUrl: url, url: "", caption } });
const section = (blocks: (BpBlock | null | undefined)[], o: O = {}): BpBlock => ({
  id: nid("sec"), type: "section",
  data: { blocks: blocks.filter(Boolean), bgColor: o.bg, textColor: o.text, paddingY: o.py ?? 64, paddingX: o.px ?? 16, maxWidth: o.maxW ?? 960 },
});
const row = (cols: BpBlock[][], o: O = {}): BpBlock => ({
  id: nid("r"), type: "row",
  data: { columns: cols.map((blocks) => ({ blocks })), gap: o.gap ?? 24, padding: o.padding ?? 0, bgColor: o.bg, stackMobile: o.stack ?? true },
});
const iconBox = (icon: string, title: string, desc: string, o: O = {}): BpBlock => ({
  id: nid("ib"), type: "icon-box",
  data: { icon, title: fr(title), desc: fr(desc), align: o.align ?? "center", color: o.color ?? "var(--fn-primary)" },
});
const checkout = (title: string, ctaText: string, o: O = {}): BpBlock => ({
  id: nid("co"), type: "checkout",
  data: { kind: "", id: "", title: fr(title), ctaText: fr(ctaText), showBump: o.bump ?? true, showPromo: o.promo ?? true, showPhone: true, showMethods: true, accentColor: "", bgColor: "#ffffff" },
});
const leadForm = (title: string, subtitle: string, buttonText: string, o: O = {}): BpBlock => ({
  id: nid("lf"), type: "lead-form",
  data: { title: fr(title), subtitle: fr(subtitle), buttonText: fr(buttonText), collectName: o.name ?? true, collectPhone: o.phone ?? false, successMessage: fr((o.success as string) ?? "C'est bon ! Vérifiez votre boîte mail (et vos spams)."), goNextStep: o.next ?? true, bgColor: "#ffffff", align: "center" },
});
const countdown = (title: string, hours: number, subtitle: string): BpBlock => ({
  id: nid("cd"), type: "countdown",
  data: { title: fr(title), endsInHours: hours, subtitle: fr(subtitle), mode: "duration" },
});
const faq = (title: string, items: Array<{ q: string; a: string }>): BpBlock => ({
  id: nid("faq"), type: "faq",
  data: { title: fr(title), items: items.map((i) => ({ q: fr(i.q), a: fr(i.a) })) },
});
const testimonials = (title: string, items: Array<{ name: string; role: string; text: string; rating: number }>): BpBlock => ({
  id: nid("tm"), type: "testimonials",
  data: { title: fr(title), items: items.map((i) => ({ ...i, text: fr(i.text) })), columns: Math.min(3, items.length) },
});
const stats = (items: Array<{ value: string; label: string; prefix?: string; suffix?: string; icon?: string }>, o: O = {}): BpBlock => ({
  id: nid("st"), type: "stats",
  data: { ...(o.title ? { title: o.title } : {}), ...(o.subtitle ? { subtitle: o.subtitle } : {}), items: items.map((i) => ({ ...i, label: fr(i.label) })), columns: o.columns ?? items.length, bgColor: o.bg, valueColor: "var(--fn-primary)" },
});
const guarantee = (title: string, body: string, o: O = {}): BpBlock => ({
  id: nid("g"), type: "guarantee",
  data: { icon: o.icon ?? "verified_user", title: fr(title), text: fr(body), style: o.style ?? "card", accentColor: "var(--fn-primary)" },
});
const pricing = (o: {
  title: string; price: number; originalPrice?: number; benefits: string[]; ctaText: string; ctaLink?: string; badgeText?: string; guaranteeText?: string;
}): BpBlock => ({
  id: nid("pr"), type: "pricing",
  data: {
    title: fr(o.title), price: o.price, ...(o.originalPrice ? { originalPrice: o.originalPrice } : {}), currency: "FCFA",
    benefits: o.benefits.map(fr), benefitIcon: "check_circle", ctaText: fr(o.ctaText), ctaLink: o.ctaLink ?? "#etape-suivante",
    ...(o.badgeText ? { badgeText: fr(o.badgeText) } : {}), badgeColor: "var(--fn-primary)",
    ...(o.guaranteeText ? { guaranteeText: fr(o.guaranteeText) } : {}), accentColor: "var(--fn-primary)",
  },
});
const scarcity = (liveText: string, o: O = {}): BpBlock => ({
  id: nid("sc"), type: "scarcity",
  data: { style: "live", liveText: fr(liveText), liveCount: o.count ?? 18, liveVariance: 5, accentColor: "var(--fn-primary)" },
});
const socialProof = (txt: string): BpBlock => ({ id: nid("sp"), type: "social-proof", data: { text: fr(txt), avatars: 5, rating: 5 } });

/* ─── Héros de section (contrôle total des couleurs) ──────────────── */
function hero(t: Tokens, o: { eyebrow?: string; title: string; subtitle?: string; cta: string; ctaLink?: string; note?: string }): BpBlock {
  return section(
    [
      o.eyebrow ? eyebrow(o.eyebrow, { color: "var(--fn-accent)" }) : null,
      heading(o.title, { level: 1, color: t.onDark, size: 42 }),
      o.subtitle ? text(o.subtitle, { color: "rgba(255,255,255,0.86)", size: 19 }) : null,
      spacer(20),
      btn(o.cta, { link: o.ctaLink ?? "#etape-suivante" }),
      o.note ? text(o.note, { color: "rgba(255,255,255,0.68)", size: 13 }) : null,
    ],
    { bg: t.heroBg, text: t.onDark, py: 76, maxW: 860 },
  );
}

/* ─── Étapes réutilisables ────────────────────────────────────────── */
/** Bloc de réassurance paiement (Mobile Money d'abord). */
function reassurance(t: Tokens): BpBlock {
  return section(
    [
      row([
        [iconBox("smartphone", "Mobile Money", "Wave, Orange Money, MTN MoMo — en quelques secondes.", { color: "var(--fn-primary)" })],
        [iconBox("verified_user", "Paiement sécurisé", "Vos données de paiement sont chiffrées de bout en bout.", { color: "var(--fn-primary)" })],
        [iconBox("bolt", "Accès immédiat", "Votre contenu se débloque dès la confirmation.", { color: "var(--fn-primary)" })],
      ]),
    ],
    { bg: t.bgA, text: t.ink, py: 40, maxW: 1000 },
  );
}

/** Étape checkout standard (Mobile Money d'abord). */
function checkoutStep(t: Tokens, title: string, ctaText: string, o: O = {}): BpStep {
  return {
    stepType: "CHECKOUT", name: "Paiement",
    blocks: [
      section(
        [
          heading("Finalisez votre commande en toute sécurité", { level: 2, color: t.ink }),
          text("Dernière étape — choisissez Wave, Orange Money, MTN MoMo ou carte bancaire. Accès immédiat dès la confirmation.", { color: t.muted, size: 16 }),
        ],
        { bg: t.bgA, text: t.ink, py: 48, maxW: 720 },
      ),
      section([checkout(title, ctaText, { bump: o.bump ?? true, promo: o.promo ?? true })], { bg: t.bgA, text: t.ink, py: 8, maxW: 720 }),
      reassurance(t),
    ],
  };
}

/** Étape de remerciement. */
function thankYouStep(t: Tokens, o: { title?: string; access?: string } = {}): BpStep {
  return {
    stepType: "THANK_YOU", name: "Merci",
    blocks: [
      section(
        [
          iconBox("celebration", o.title ?? "Merci pour votre achat !", "Votre commande est confirmée. Un email récapitulatif vient de vous être envoyé.", { color: "var(--fn-primary)" }),
          spacer(8),
          heading("Comment accéder à votre contenu", { level: 3, color: t.ink }),
          list(
            [
              "Vérifiez votre boîte mail (et vos spams) — un email vous attend",
              "Connectez-vous à votre compte Novakou",
              "Retrouvez votre achat dans « Mes achats »",
              o.access ?? "Commencez dès maintenant !",
            ],
            { color: "var(--fn-primary)" },
          ),
          spacer(16),
          btn("Accéder à mon espace", { link: "/acheteur/mes-achats" }),
        ],
        { bg: t.bgA, text: t.ink, py: 64, maxW: 720 },
      ),
    ],
  };
}

/** Étape upsell one-click. */
function upsellStep(t: Tokens, o: { title: string; pitch: string; bullets: string[]; coTitle: string; coCta: string; priceLine?: string }): BpStep {
  return {
    stepType: "UPSELL", name: "Offre complémentaire",
    blocks: [
      section(
        [
          eyebrow("Offre unique — disponible sur cette page uniquement", { color: "var(--fn-danger)" }),
          heading(o.title, { level: 1, color: t.ink, size: 34 }),
          text(o.pitch, { color: t.muted, size: 18 }),
          spacer(10),
          countdown("Cette offre expire dans :", 1, "Passé ce délai, le prix revient à son tarif normal."),
          spacer(10),
          list(o.bullets, { color: "var(--fn-primary)" }),
          o.priceLine ? text(o.priceLine, { color: t.ink, size: 18 }) : null,
        ],
        { bg: t.bgA, text: t.ink, py: 56, maxW: 760 },
      ),
      section([checkout(o.coTitle, o.coCta, { bump: false, promo: false })], { bg: t.bgA, text: t.ink, py: 8, maxW: 720 }),
      section(
        [btn("Non merci, je passe cette offre", { link: "#etape-suivante", style: "secondary", size: "sm", full: false, bg: "transparent", fg: t.muted })],
        { bg: t.bgA, text: t.ink, py: 16, maxW: 720 },
      ),
    ],
  };
}

/* ═══════════════════════════════════════════════════════════════════
   LES 10 MODÈLES
   ═══════════════════════════════════════════════════════════════════ */

// 1 ── LANCEMENT DE FORMATION (opt-in → vente → checkout → upsell → merci)
const lancementFormation: FunnelBlueprint = {
  key: "lancement-formation",
  label: "Lancement de formation",
  tagline: "Opt-in → vente → checkout → upsell → merci",
  description: "Le tunnel complet pour lancer une formation en ligne : on capte l'email avec un aperçu gratuit, on convainc avec une page de vente, on encaisse en Mobile Money, puis on augmente le panier avec un upsell.",
  icon: "graduation-cap", goal: "Vendre une formation", recommendedPalette: "novakou",
  preview: "linear-gradient(135deg,#003d1a,#006e2f 60%,#22c55e)",
  stepLabels: ["Capture", "Vente", "Paiement", "Upsell", "Merci"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "CAPTURE", name: "Capture email",
        blocks: [
          hero(t, { eyebrow: "Masterclass gratuite", title: "Le plan en 3 étapes pour vivre de votre expertise", subtitle: "Recevez la vidéo offerte (12 minutes) qui montre comment transformer ce que vous savez déjà en revenu mensuel.", cta: "Recevoir la vidéo gratuite", note: "100 % gratuit — vous vous désinscrivez en un clic." }),
          section(
            [
              list(["La méthode pas à pas, sans jargon", "Les 3 erreurs qui bloquent 90 % des débutants", "Un exemple concret adapté à votre réalité"], { color: "var(--fn-primary)" }),
              spacer(16),
              leadForm("Où doit-on envoyer la vidéo ?", "Entrez votre email, la vidéo arrive tout de suite.", "Recevoir la vidéo gratuite", { next: true }),
              spacer(10),
              socialProof("Déjà suivie par des centaines de personnes"),
            ],
            { bg: t.bgA, text: t.ink, py: 56, maxW: 640 },
          ),
        ],
      },
      {
        stepType: "LANDING", name: "Page de vente",
        blocks: [
          hero(t, { eyebrow: "Formation complète", title: "Passez de « je sais faire » à « je suis payé pour ça »", subtitle: "Une formation guidée, des modèles prêts à l'emploi et un accompagnement pour lancer votre offre en 30 jours.", cta: "Je veux la formation", note: "Paiement Mobile Money ou carte — accès à vie." }),
          section(
            [
              heading("Ce que vous obtenez", { level: 2, color: t.ink }),
              row([
                [iconBox("play_circle", "6 modules vidéo", "Plus de 5 heures, à votre rythme, sur mobile ou ordinateur.")],
                [iconBox("description", "Modèles prêts", "Scripts, pages et messages à copier-coller.")],
                [iconBox("groups", "Communauté privée", "Posez vos questions, restez motivé, avancez ensemble.")],
              ]),
            ],
            { bg: t.bgB, text: t.ink, py: 64, maxW: 1000 },
          ),
          section(
            [stats([
              { value: "1", suffix: " 200+", label: "personnes formées" },
              { value: "4,8", suffix: "/5", label: "note moyenne" },
              { value: "30", suffix: " jours", label: "pour lancer" },
            ])],
            { bg: t.bgA, text: t.ink, py: 8, maxW: 1000 },
          ),
          section(
            [testimonials("Ils ont lancé leur offre", [
              { name: "Awa D.", role: "Dakar, Sénégal", text: "En 3 semaines j'ai signé mes 2 premiers clients. La méthode est claire et applicable.", rating: 5 },
              { name: "Koffi M.", role: "Abidjan, Côte d'Ivoire", text: "Les modèles m'ont fait gagner des semaines. J'ai rentabilisé la formation dès le premier mois.", rating: 5 },
              { name: "Sarah B.", role: "Cotonou, Bénin", text: "Enfin une formation qui parle de notre réalité, avec le paiement Mobile Money.", rating: 5 },
            ])],
            { bg: t.bgB, text: t.ink, py: 56, maxW: 1000 },
          ),
          section(
            [pricing({ title: "Formation complète — accès à vie", price: 25000, originalPrice: 45000, benefits: ["6 modules vidéo + mises à jour", "Tous les modèles à copier-coller", "Communauté privée", "Certificat de fin de formation"], ctaText: "Je rejoins la formation", badgeText: "Offre de lancement", guaranteeText: "Satisfait ou remboursé 14 jours" })],
            { bg: t.bgA, text: t.ink, py: 56, maxW: 720 },
          ),
          section([guarantee("Garantie 14 jours, sans risque", "Testez la formation. Si elle ne vous convient pas, écrivez-nous sous 14 jours et vous êtes remboursé intégralement.")], { bg: t.bgB, text: t.ink, py: 40, maxW: 720 }),
          section([faq("Questions fréquentes", [
            { q: "Comment je paie ?", a: "Par Wave, Orange Money, MTN MoMo ou carte bancaire. Tout est sécurisé." },
            { q: "Combien de temps j'ai accès ?", a: "À vie, mises à jour incluses. Vous avancez à votre rythme." },
            { q: "Et si ça ne me convient pas ?", a: "Vous êtes remboursé sous 14 jours, sans justification." },
          ])], { bg: t.bgA, text: t.ink, py: 56, maxW: 760 }),
        ],
      },
      checkoutStep(t, "Votre formation", "Payer et accéder maintenant"),
      upsellStep(t, {
        title: "Ajoutez le pack Modèles Pro", pitch: "50 modèles supplémentaires (emails, pages, publicités) pour aller 3 fois plus vite. Uniquement maintenant, à prix réduit.",
        bullets: ["50 modèles prêts à l'emploi", "Mis à jour chaque mois", "En un clic, sans ressaisir vos informations"],
        coTitle: "Ajouter le pack Modèles Pro", coCta: "OUI, j'ajoute le pack", priceLine: `Aujourd'hui seulement : ${fcfa(9000)} au lieu de ${fcfa(19000)}`,
      }),
      thankYouStep(t, { access: "Ouvrez le module 1 et lancez-vous aujourd'hui !" }),
    ];
  },
};

// 2 ── LEAD MAGNET (capture → tripwire/merci)
const leadMagnet: FunnelBlueprint = {
  key: "lead-magnet",
  label: "Aimant à prospects (lead magnet)",
  tagline: "Guide gratuit → liste email → offre",
  description: "Faites grandir votre liste email avec un guide gratuit très ciblé, puis proposez immédiatement une petite offre pour transformer l'abonné en premier acheteur.",
  icon: "magnet", goal: "Construire une liste email", recommendedPalette: "ocean",
  preview: "linear-gradient(135deg,#083344,#0e7490 60%,#22d3ee)",
  stepLabels: ["Capture", "Merci + offre"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "CAPTURE", name: "Capture email",
        blocks: [
          hero(t, { eyebrow: "Guide gratuit à télécharger", title: "Le guide qui vous fait gagner vos 3 premiers clients", subtitle: "10 pages concrètes, lisibles en 15 minutes, applicables dès aujourd'hui — même en partant de zéro.", cta: "Télécharger le guide gratuit", note: "Gratuit — reçu immédiatement par email." }),
          section(
            [
              row([
                [image("https://picsum.photos/seed/leadmagnet-cover/600/760", { radius: 16 })],
                [
                  heading("À l'intérieur du guide", { level: 3, align: "left", color: t.ink }),
                  list(["Le plan d'action étape par étape", "Les erreurs qui coûtent cher", "Un modèle de message pour décrocher un premier rendez-vous"], { color: "var(--fn-primary)" }),
                  spacer(14),
                  leadForm("Où doit-on l'envoyer ?", "Entrez votre email, le guide arrive tout de suite.", "Recevoir le guide gratuit", { next: true }),
                ],
              ], { gap: 40 }),
            ],
            { bg: t.bgA, text: t.ink, py: 56, maxW: 980 },
          ),
        ],
      },
      {
        stepType: "THANK_YOU", name: "Merci + offre",
        blocks: [
          section(
            [
              iconBox("mark_email_read", "C'est envoyé ! Vérifiez votre boîte mail", "Le guide est en route. En attendant, une offre spéciale rien que pour vous.", { color: "var(--fn-primary)" }),
              spacer(8),
              eyebrow("Offre de bienvenue", { color: "var(--fn-danger)" }),
              heading("Le pack « Démarrage rapide » à -60 %", { level: 2, color: t.ink }),
              text("Passez à l'action tout de suite avec nos modèles et notre mini-formation, à prix cadeau — uniquement pour les nouveaux abonnés.", { color: t.muted }),
              spacer(12),
              pricing({ title: "Pack Démarrage rapide", price: 5000, originalPrice: 12500, benefits: ["Mini-formation (1 h)", "10 modèles à copier-coller", "Checklist de lancement"], ctaText: "J'en profite maintenant", badgeText: "-60 % aujourd'hui", guaranteeText: "Satisfait ou remboursé 7 jours" }),
            ],
            { bg: t.bgA, text: t.ink, py: 64, maxW: 720 },
          ),
        ],
      },
      checkoutStep(t, "Pack Démarrage rapide", "Payer et accéder", { bump: true, promo: true }),
      thankYouStep(t),
    ];
  },
};

// 3 ── VSL VENTE DIRECTE (VSL → checkout → merci)
const vslDirect: FunnelBlueprint = {
  key: "vsl-direct",
  label: "Vidéo de vente (VSL)",
  tagline: "Vidéo → checkout → merci",
  description: "Une page centrée sur une vidéo de vente (VSL) : le prospect regarde, est convaincu, achète. Court, direct, redoutable pour les offres qui s'expliquent en vidéo.",
  icon: "clapperboard", goal: "Vendre avec une vidéo", recommendedPalette: "noir",
  preview: "linear-gradient(135deg,#0a0a0a,#1a1a1a 60%,#404040)",
  stepLabels: ["Vidéo de vente", "Paiement", "Merci"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "LANDING", name: "Vidéo de vente",
        blocks: [
          section(
            [
              eyebrow("Regardez avant de décider", { color: "var(--fn-accent)" }),
              heading("La méthode complète expliquée en 8 minutes", { level: 1, color: t.onDark, size: 38 }),
              text("Appuyez sur lecture. À la fin de la vidéo, vous saurez exactement quoi faire — et comment nous pouvons vous y aider.", { color: "rgba(255,255,255,0.85)", size: 18 }),
              spacer(18),
              video("https://www.youtube.com/watch?v=dQw4w9WgXcQ", ""),
              spacer(22),
              btn("Je passe à l'action maintenant", { link: "#etape-suivante", subText: "Paiement Mobile Money ou carte — accès immédiat" }),
            ],
            { bg: t.heroBg, text: t.onDark, py: 64, maxW: 860 },
          ),
          section([scarcity("personnes regardent cette page en ce moment", { count: 23 })], { bg: t.bgA, text: t.ink, py: 8, maxW: 860 }),
          section(
            [
              heading("Ce que vous obtenez concrètement", { level: 2, color: t.ink }),
              row([
                [iconBox("target", "Un plan clair", "Vous savez quoi faire, dans quel ordre, sans vous éparpiller.")],
                [iconBox("schedule", "Un gain de temps", "Des raccourcis testés qui évitent des mois d'essais.")],
                [iconBox("trending_up", "Des résultats", "Une méthode qui a déjà fait ses preuves sur le terrain.")],
              ]),
              spacer(20),
              guarantee("Zéro risque pour vous", "Si vous appliquez la méthode et n'obtenez rien sous 30 jours, on vous rembourse. Simple."),
            ],
            { bg: t.bgB, text: t.ink, py: 64, maxW: 1000 },
          ),
          section([btn("Je commande maintenant", { link: "#etape-suivante" })], { bg: t.bgA, text: t.ink, py: 40, maxW: 720 }),
        ],
      },
      checkoutStep(t, "Votre commande", "Payer et accéder", { bump: true }),
      thankYouStep(t),
    ];
  },
};

// 4 ── WEBINAIRE (inscription → confirmation → replay/offre)
const webinaire: FunnelBlueprint = {
  key: "webinaire",
  label: "Webinaire / atelier en direct",
  tagline: "Inscription → confirmation → offre",
  description: "Remplissez votre atelier en ligne : page d'inscription, page de confirmation avec les détails de connexion, puis une offre présentée après le direct.",
  icon: "presentation", goal: "Remplir un webinaire", recommendedPalette: "bleu-nuit",
  preview: "linear-gradient(135deg,#0a1f52,#1d4ed8 60%,#60a5fa)",
  stepLabels: ["Inscription", "Confirmation", "Offre post-webinaire"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "CAPTURE", name: "Inscription",
        blocks: [
          hero(t, { eyebrow: "Atelier en ligne gratuit", title: "Comment lancer votre activité en ligne sans budget publicité", subtitle: "1 heure en direct, avec vos questions en fin de session. Places limitées.", cta: "Réserver ma place gratuite" }),
          section(
            [
              row([
                [iconBox("event", "Date & heure", "Samedi à 18 h (heure de Dakar / Abidjan).", { align: "left" })],
                [iconBox("videocam", "100 % en ligne", "Depuis votre téléphone ou votre ordinateur.", { align: "left" })],
                [iconBox("card_giftcard", "Cadeau offert", "Un modèle de plan d'action pour les inscrits.", { align: "left" })],
              ]),
              spacer(18),
              list(["Le système complet, étape par étape", "Comment trouver vos premiers clients", "Une session de questions-réponses en direct"], { color: "var(--fn-primary)" }),
              spacer(16),
              leadForm("Je réserve ma place", "Entrez votre email pour recevoir le lien de connexion.", "Réserver ma place gratuite", { name: true, phone: true, next: true, success: "Votre place est réservée ! Détails ci-dessous." }),
            ],
            { bg: t.bgA, text: t.ink, py: 56, maxW: 900 },
          ),
        ],
      },
      {
        stepType: "CONFIRMATION", name: "Confirmation",
        blocks: [
          section(
            [
              iconBox("check_circle", "Votre place est réservée !", "Un email de confirmation vient de vous être envoyé avec le lien de connexion.", { color: "var(--fn-primary)" }),
              spacer(8),
              heading("Notez bien ces informations", { level: 3, color: t.ink }),
              list(["Ajoutez la date à votre agenda tout de suite", "Le lien de connexion est dans votre email (vérifiez les spams)", "Connectez-vous 5 minutes en avance", "Venez avec vos questions !"], { color: "var(--fn-primary)" }),
              spacer(16),
              text("Astuce : enregistrez notre numéro WhatsApp pour recevoir un rappel avant le direct.", { color: t.muted, size: 15 }),
            ],
            { bg: t.bgA, text: t.ink, py: 64, maxW: 720 },
          ),
        ],
      },
      {
        stepType: "LANDING", name: "Offre post-webinaire",
        blocks: [
          section(
            [
              eyebrow("Offre réservée aux participants", { color: "var(--fn-danger)" }),
              heading("L'accompagnement complet, au tarif atelier", { level: 1, color: t.ink, size: 34 }),
              text("Vous avez vu la méthode. Passez à l'action avec notre accompagnement pas à pas, à un tarif réservé aux participants du webinaire.", { color: t.muted, size: 18 }),
              spacer(12),
              countdown("Le tarif atelier expire dans :", 48, "Après ce délai, le prix revient à son tarif normal."),
              spacer(12),
              pricing({ title: "Accompagnement complet", price: 35000, originalPrice: 60000, benefits: ["Programme complet en ligne", "3 sessions de groupe en direct", "Modèles et outils prêts à l'emploi", "Accès à la communauté privée"], ctaText: "Je profite du tarif atelier", badgeText: "Tarif participants", guaranteeText: "Garantie 14 jours" }),
            ],
            { bg: t.bgA, text: t.ink, py: 64, maxW: 760 },
          ),
        ],
      },
      checkoutStep(t, "Accompagnement complet", "Payer au tarif atelier"),
      thankYouStep(t),
    ];
  },
};

// 5 ── EBOOK TRIPWIRE (vente petit prix → checkout → upsell → merci)
const ebookTripwire: FunnelBlueprint = {
  key: "ebook-tripwire",
  label: "Ebook à petit prix (tripwire)",
  tagline: "Vente flash → checkout → upsell → merci",
  description: "Une offre d'appel irrésistible à petit prix (ebook, mini-formation) pour transformer un curieux en acheteur, puis un upsell pour augmenter immédiatement le panier moyen.",
  icon: "book-open", goal: "Convertir en premier achat", recommendedPalette: "terracotta",
  preview: "linear-gradient(135deg,#5c2410,#c0562f 60%,#f0a077)",
  stepLabels: ["Vente flash", "Paiement", "Upsell", "Merci"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "LANDING", name: "Vente flash",
        blocks: [
          hero(t, { eyebrow: "Offre du jour", title: `L'ebook qui vaut ${fcfa(15000)} — aujourd'hui à ${fcfa(2500)}`, subtitle: "80 pages, des exemples concrets et des modèles prêts à l'emploi. Le raccourci le moins cher pour démarrer.", cta: "Je le veux à ce prix", note: "Paiement Wave, Orange Money, MTN MoMo ou carte." }),
          section([countdown("L'offre se termine dans :", 24, "Après le compte à rebours, le prix repasse à son tarif normal.")], { bg: t.bgA, text: t.ink, py: 8, maxW: 760 }),
          section(
            [
              heading("Pourquoi ça vaut 6 fois le prix", { level: 2, color: t.ink }),
              list(["Des années d'expérience condensées en un seul document", "Des modèles à copier au lieu de partir de zéro", "Lisible en une soirée, applicable dès demain", "Bonus : une checklist imprimable"], { color: "var(--fn-primary)" }),
              spacer(16),
              testimonials("Ce qu'en disent les lecteurs", [
                { name: "Ibrahim S.", role: "Bamako, Mali", text: "Pour le prix d'un plat, j'ai eu plus de valeur que dans des formations à 50 000.", rating: 5 },
                { name: "Fatou N.", role: "Dakar, Sénégal", text: "Clair, concret, sans blabla. Je l'ai lu en une soirée et appliqué le lendemain.", rating: 5 },
              ]),
              spacer(16),
              btn("Je télécharge l'ebook maintenant", { link: "#etape-suivante", subText: `Seulement ${fcfa(2500)} — accès immédiat` }),
            ],
            { bg: t.bgB, text: t.ink, py: 56, maxW: 860 },
          ),
        ],
      },
      checkoutStep(t, "Votre ebook", "Payer et télécharger", { bump: true, promo: false }),
      upsellStep(t, {
        title: "Passez à la mini-formation vidéo", pitch: "L'ebook, c'est la théorie. La mini-formation vidéo (2 h) vous montre chaque étape en action. Offre unique à saisir maintenant.",
        bullets: ["2 heures de vidéo, étape par étape", "Les modèles au format modifiable", "Accès à vie + mises à jour"],
        coTitle: "Ajouter la mini-formation", coCta: "OUI, je veux la vidéo", priceLine: `Aujourd'hui : ${fcfa(7500)} au lieu de ${fcfa(17500)}`,
      }),
      thankYouStep(t, { access: "Téléchargez votre ebook dès maintenant." }),
    ];
  },
};

// 6 ── COACHING PREMIUM (candidature → vente → checkout → merci)
const coachingPremium: FunnelBlueprint = {
  key: "coaching-premium",
  label: "Coaching premium (high-ticket)",
  tagline: "Candidature → vente → checkout → merci",
  description: "Pour vendre un accompagnement haut de gamme : on qualifie via une candidature, on présente la valeur avec sérieux et preuves, puis on encaisse un acompte ou le paiement complet.",
  icon: "crown", goal: "Vendre un accompagnement premium", recommendedPalette: "or-sable",
  preview: "linear-gradient(135deg,#5a3a0a,#b7791f 60%,#f0c674)",
  stepLabels: ["Candidature", "Présentation", "Paiement", "Merci"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "CAPTURE", name: "Candidature",
        blocks: [
          hero(t, { eyebrow: "Accompagnement sur mesure", title: "Un accompagnement premium pour atteindre vos objectifs plus vite", subtitle: "Places limitées à quelques personnes par mois. Candidatez pour vérifier si c'est fait pour vous.", cta: "Déposer ma candidature" }),
          section(
            [
              heading("À qui s'adresse cet accompagnement", { level: 3, color: t.ink }),
              list(["Vous avez déjà une activité ou un projet sérieux", "Vous voulez un cadre, une méthode et un suivi rapproché", "Vous êtes prêt à investir pour aller plus vite"], { color: "var(--fn-primary)" }),
              spacer(16),
              leadForm("Candidature (2 minutes)", "Parlez-nous de votre projet, on revient vers vous rapidement.", "Envoyer ma candidature", { name: true, phone: true, next: true, success: "Candidature reçue ! Découvrez le programme ci-dessous." }),
            ],
            { bg: t.bgA, text: t.ink, py: 56, maxW: 720 },
          ),
        ],
      },
      {
        stepType: "LANDING", name: "Présentation",
        blocks: [
          section(
            [
              heading("Un accompagnement, pas juste une formation", { level: 1, color: t.ink, size: 36 }),
              text("Vous n'êtes pas seul face aux vidéos. Vous avancez avec un cadre, des points réguliers et quelqu'un qui répond à vos questions.", { color: t.muted, size: 18 }),
              spacer(18),
              row([
                [iconBox("person", "Sessions individuelles", "Des rendez-vous rien que pour vous et vos objectifs.")],
                [iconBox("forum", "Support prioritaire", "Vos questions traitées en priorité, entre les sessions.")],
                [iconBox("workspace_premium", "Résultats garantis", "Un plan clair et un engagement de résultat.")],
              ]),
            ],
            { bg: t.bgA, text: t.ink, py: 64, maxW: 1000 },
          ),
          section([testimonials("Résultats de nos accompagnés", [
            { name: "Mariam T.", role: "Abidjan", text: "En 90 jours, j'ai structuré mon offre et triplé mes tarifs. L'investissement le plus rentable de l'année.", rating: 5 },
            { name: "David K.", role: "Douala", text: "Le suivi rapproché change tout. J'avais la formation, il me manquait la mise en action.", rating: 5 },
          ])], { bg: t.bgB, text: t.ink, py: 56, maxW: 1000 }),
          section([pricing({ title: "Accompagnement premium — 3 mois", price: 150000, benefits: ["Sessions individuelles chaque semaine", "Support prioritaire par message", "Tous les outils et modèles", "Plan d'action personnalisé"], ctaText: "Réserver ma place", guaranteeText: "Engagement de résultat" })], { bg: t.bgA, text: t.ink, py: 56, maxW: 720 }),
          section([text("Paiement en une fois ou en plusieurs fois — Mobile Money ou carte. Écrivez-nous pour un échelonnement.", { color: t.muted, size: 15 })], { bg: t.bgB, text: t.ink, py: 32, maxW: 720 }),
        ],
      },
      checkoutStep(t, "Accompagnement premium", "Réserver ma place", { bump: false, promo: true }),
      thankYouStep(t, { title: "Bienvenue — votre place est réservée !", access: "Nous vous contactons sous 24 h pour planifier votre première session." }),
    ];
  },
};

// 7 ── BOOTCAMP / COHORTE (vente → checkout → merci)
const bootcamp: FunnelBlueprint = {
  key: "bootcamp",
  label: "Bootcamp / cohorte",
  tagline: "Vente → checkout → merci",
  description: "Vendez une session intensive en groupe avec une date de démarrage : l'urgence de la cohorte et l'énergie collective font grimper les inscriptions.",
  icon: "rocket", goal: "Remplir une cohorte", recommendedPalette: "violet",
  preview: "linear-gradient(135deg,#3b1580,#6d28d9 60%,#a78bfa)",
  stepLabels: ["Vente", "Paiement", "Merci"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "LANDING", name: "Vente",
        blocks: [
          hero(t, { eyebrow: "Prochaine cohorte — places limitées", title: "7 jours pour lancer votre projet, en groupe et en direct", subtitle: "Un défi intensif, encadré, avec une communauté qui avance en même temps que vous. Prêt à passer à l'action ?", cta: "Rejoindre la cohorte", note: "Démarrage lundi prochain — inscriptions bientôt closes." }),
          section([scarcity("places déjà réservées cette semaine", { count: 42 })], { bg: t.bgA, text: t.ink, py: 8, maxW: 900 }),
          section(
            [
              heading("Le programme des 7 jours", { level: 2, color: t.ink }),
              list(["Jour 1-2 : clarifier votre offre et votre cible", "Jour 3-4 : construire votre page et votre message", "Jour 5-6 : lancer et trouver vos premiers contacts", "Jour 7 : bilan en direct et plan pour la suite"], { color: "var(--fn-primary)", icon: "arrow_circle_right" }),
              spacer(18),
              row([
                [iconBox("groups", "En groupe", "L'énergie du collectif pour ne pas abandonner.")],
                [iconBox("live_tv", "En direct", "Des sessions live chaque jour, avec vos questions.")],
                [iconBox("emoji_events", "Des résultats", "Vous finissez la semaine avec un projet lancé.")],
              ]),
            ],
            { bg: t.bgB, text: t.ink, py: 64, maxW: 1000 },
          ),
          section([pricing({ title: "Bootcamp 7 jours — prochaine cohorte", price: 20000, originalPrice: 35000, benefits: ["7 jours de sessions en direct", "Replays disponibles à vie", "Communauté privée de la cohorte", "Modèles et checklists quotidiens"], ctaText: "Je réserve ma place", badgeText: "Inscriptions ouvertes", guaranteeText: "Satisfait ou remboursé avant le jour 2" })], { bg: t.bgA, text: t.ink, py: 56, maxW: 720 }),
          section([countdown("Fin des inscriptions dans :", 72, "Une fois la cohorte lancée, les inscriptions ferment.")], { bg: t.bgB, text: t.ink, py: 40, maxW: 720 }),
        ],
      },
      checkoutStep(t, "Bootcamp 7 jours", "Réserver ma place"),
      thankYouStep(t, { title: "Vous êtes dans la cohorte !", access: "Rejoignez le groupe privé — le lien est dans votre email." }),
    ];
  },
};

// 8 ── ABONNEMENT / MEMBERSHIP (vente → checkout → merci)
const abonnement: FunnelBlueprint = {
  key: "abonnement",
  label: "Abonnement / espace membre",
  tagline: "Vente → checkout → merci",
  description: "Vendez un accès récurrent à un espace membre (contenus, communauté, mises à jour). Idéal pour des revenus réguliers et une relation durable.",
  icon: "repeat", goal: "Créer un revenu récurrent", recommendedPalette: "bordeaux",
  preview: "linear-gradient(135deg,#4a1522,#8b2942 60%,#d98a9c)",
  stepLabels: ["Vente", "Paiement", "Merci"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "LANDING", name: "Vente",
        blocks: [
          hero(t, { eyebrow: "Espace membre", title: "Tout ce qu'il vous faut pour progresser, chaque mois", subtitle: "De nouveaux contenus, une communauté active et un accompagnement continu — pour le prix d'un café par semaine.", cta: "Devenir membre", note: "Sans engagement — résiliable à tout moment." }),
          section(
            [
              heading("Ce qui vous attend à l'intérieur", { level: 2, color: t.ink }),
              row([
                [iconBox("video_library", "Contenus exclusifs", "De nouvelles vidéos et ressources ajoutées chaque mois.")],
                [iconBox("diversity_3", "Communauté active", "Échangez, posez vos questions, restez motivé.")],
                [iconBox("update", "Toujours à jour", "Vous suivez les évolutions sans effort.")],
              ]),
              spacer(20),
              testimonials("Nos membres en parlent", [
                { name: "Aïcha B.", role: "Membre depuis 6 mois", text: "Chaque mois j'apprends quelque chose d'utile. La communauté vaut à elle seule l'abonnement.", rating: 5 },
                { name: "Serge O.", role: "Membre depuis 1 an", text: "Le meilleur rapport valeur-prix que j'aie trouvé. Je ne me désabonnerai pas.", rating: 5 },
              ]),
            ],
            { bg: t.bgB, text: t.ink, py: 64, maxW: 1000 },
          ),
          section([pricing({ title: "Abonnement mensuel", price: 5000, benefits: ["Accès à tous les contenus", "Nouveaux ajouts chaque mois", "Communauté privée", "Sans engagement, résiliable en un clic"], ctaText: "Je deviens membre", badgeText: "Le plus populaire", guaranteeText: "7 jours d'essai satisfait ou remboursé" })], { bg: t.bgA, text: t.ink, py: 56, maxW: 720 }),
          section([faq("Questions fréquentes", [
            { q: "Puis-je arrêter quand je veux ?", a: "Oui, sans engagement. Vous résiliez en un clic depuis votre espace." },
            { q: "Comment je paie chaque mois ?", a: "Par Mobile Money ou carte. Le renouvellement est simple et sécurisé." },
            { q: "Que se passe-t-il si j'arrête ?", a: "Vous gardez l'accès jusqu'à la fin de la période payée." },
          ])], { bg: t.bgB, text: t.ink, py: 56, maxW: 760 }),
        ],
      },
      checkoutStep(t, "Abonnement mensuel", "Devenir membre", { bump: false, promo: true }),
      thankYouStep(t, { title: "Bienvenue dans l'espace membre !", access: "Explorez les contenus et présentez-vous dans la communauté." }),
    ];
  },
};

// 9 ── PRODUIT DIGITAL EXPRESS (page unique vente+checkout → merci)
const produitExpress: FunnelBlueprint = {
  key: "produit-express",
  label: "Produit digital express",
  tagline: "1 page vente + achat → merci",
  description: "Le tunnel le plus court : une seule page qui vend ET encaisse, pour un produit simple (template, pack, preset) qu'on achète sur un coup de cœur.",
  icon: "zap", goal: "Vendre vite un produit simple", recommendedPalette: "novakou",
  preview: "linear-gradient(135deg,#014023,#006e2f 55%,#34d399)",
  stepLabels: ["Vente + achat", "Merci"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "LANDING", name: "Vente + achat",
        blocks: [
          hero(t, { eyebrow: "Disponible immédiatement", title: "Le pack prêt à l'emploi qui vous fait gagner des heures", subtitle: "Téléchargez, utilisez, gagnez du temps. Simple, immédiat, sans abonnement.", cta: "Acheter et télécharger", ctaLink: "", note: "Paiement Mobile Money ou carte — accès immédiat." }),
          section(
            [
              row([
                [image("https://picsum.photos/seed/express-product/700/560", { radius: 16 })],
                [
                  heading("Ce que contient le pack", { level: 3, align: "left", color: t.ink }),
                  list(["Des fichiers prêts à personnaliser", "Un guide d'utilisation clair", "Des bonus pour aller plus loin", "Mises à jour gratuites à vie"], { color: "var(--fn-primary)" }),
                  spacer(14),
                  text("Un achat unique, à vous pour toujours.", { align: "left", color: t.muted, size: 15 }),
                ],
              ], { gap: 40 }),
            ],
            { bg: t.bgB, text: t.ink, py: 56, maxW: 980 },
          ),
          section([scarcity("personnes ont acheté ce pack cette semaine", { count: 31 })], { bg: t.bgA, text: t.ink, py: 8, maxW: 760 }),
          section(
            [
              heading("Ajoutez-le à votre commande", { level: 2, color: t.ink }),
              text("Choisissez Wave, Orange Money, MTN MoMo ou carte bancaire. Le téléchargement se débloque tout de suite.", { color: t.muted, size: 16 }),
              spacer(12),
              checkout("Votre pack", "Payer et télécharger", { bump: true, promo: true }),
            ],
            { bg: t.bgA, text: t.ink, py: 48, maxW: 720 },
          ),
          reassurance(t),
        ],
      },
      thankYouStep(t, { access: "Téléchargez votre pack dès maintenant." }),
    ];
  },
};

// 10 ── OFFRE AGENCE / B2B (vente → prise de contact → merci)
const agenceB2B: FunnelBlueprint = {
  key: "agence-b2b",
  label: "Offre agence / B2B",
  tagline: "Vente → prise de contact → merci",
  description: "Pour vendre une prestation ou un service B2B : on rassure avec des preuves et des résultats, puis on récupère une demande de devis plutôt qu'un paiement direct.",
  icon: "briefcase", goal: "Générer des demandes de devis", recommendedPalette: "bleu-nuit",
  preview: "linear-gradient(135deg,#0b1e3f,#1d4ed8 60%,#7dd3fc)",
  stepLabels: ["Présentation", "Demande de devis", "Merci"],
  build: (amb) => {
    const t = tokens(amb);
    return [
      {
        stepType: "LANDING", name: "Présentation",
        blocks: [
          hero(t, { eyebrow: "Prestation sur mesure", title: "Nous construisons votre présence en ligne, vous vous concentrez sur votre métier", subtitle: "Sites, tunnels de vente, contenus : une équipe qui livre des résultats mesurables, pas des promesses.", cta: "Demander un devis gratuit" }),
          section(
            [stats([
              { value: "120", suffix: "+", label: "projets livrés" },
              { value: "98", suffix: "%", label: "clients satisfaits" },
              { value: "48", suffix: " h", label: "délai de réponse" },
            ])],
            { bg: t.bgA, text: t.ink, py: 8, maxW: 1000 },
          ),
          section(
            [
              heading("Nos prestations", { level: 2, color: t.ink }),
              row([
                [iconBox("language", "Sites & pages", "Des sites rapides, soignés et pensés pour convertir.")],
                [iconBox("filter_alt", "Tunnels de vente", "Des parcours d'achat qui transforment vos visiteurs en clients.")],
                [iconBox("campaign", "Contenus & pub", "Des contenus qui attirent et des campagnes rentables.")],
              ]),
            ],
            { bg: t.bgB, text: t.ink, py: 64, maxW: 1000 },
          ),
          section([testimonials("Ils nous ont fait confiance", [
            { name: "Nadia — Restaurant", role: "Dakar", text: "En 2 mois, notre site remplit nos réservations. Équipe sérieuse et réactive.", rating: 5 },
            { name: "Groupe Sahel", role: "Bamako", text: "Un tunnel de vente qui a doublé nos demandes de devis. Rentabilisé dès le premier mois.", rating: 5 },
          ])], { bg: t.bgA, text: t.ink, py: 56, maxW: 1000 }),
          section([btn("Obtenir mon devis gratuit", { link: "#etape-suivante" })], { bg: t.bgB, text: t.ink, py: 40, maxW: 720 }),
        ],
      },
      {
        stepType: "CAPTURE", name: "Demande de devis",
        blocks: [
          section(
            [
              heading("Parlez-nous de votre projet", { level: 1, color: t.ink, size: 32 }),
              text("Remplissez ce court formulaire : nous revenons vers vous sous 48 h avec une proposition adaptée.", { color: t.muted, size: 17 }),
              spacer(16),
              leadForm("Demande de devis gratuit", "Vos coordonnées et un mot sur votre besoin — c'est tout.", "Envoyer ma demande", { name: true, phone: true, next: true, success: "Demande reçue ! Nous revenons vers vous sous 48 h." }),
              spacer(12),
              text("Réponse sous 48 h ouvrées — sans engagement.", { color: t.muted, size: 14 }),
            ],
            { bg: t.bgA, text: t.ink, py: 64, maxW: 680 },
          ),
        ],
      },
      thankYouStep(t, { title: "Merci — votre demande est bien reçue !", access: "Notre équipe vous recontacte sous 48 h ouvrées." }),
    ];
  },
};

export const FUNNEL_BLUEPRINTS: FunnelBlueprint[] = [
  lancementFormation,
  leadMagnet,
  vslDirect,
  webinaire,
  ebookTripwire,
  coachingPremium,
  bootcamp,
  abonnement,
  produitExpress,
  agenceB2B,
];
