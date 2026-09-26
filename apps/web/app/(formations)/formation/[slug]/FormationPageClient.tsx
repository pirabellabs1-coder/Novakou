"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShopFooter from "@/components/formations/ShopFooter";
import { FormationsFooter } from "@/components/formations/FormationsFooter";
import { FormationsNavbar } from "@/components/formations/FormationsNavbar";
import { ShopHeader } from "@/components/formations/ShopHeader";
import { shopFontStack, shopFontHref } from "@/lib/formations/shop-fonts";
import { sora } from "@/lib/fonts";
import { trackEvents } from "@/lib/tracking/events";
import {
  ArrowRight,
  Award,
  CalendarCheck,
  Clock,
  Flame,
  Globe,
  GraduationCap,
  Infinity as InfinityIcon,
  Lock,
  MonitorSmartphone,
  Play,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PixelInjector } from "@/components/formations/PixelInjector";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";
import { RelatedProducts } from "@/components/formations/RelatedProducts";
import ReviewsCarousel from "@/components/formations/ReviewsCarousel";
import { InquiryWidget } from "@/components/formations/InquiryWidget";
import { BlocContact } from "@/components/formations/BlocContact";
import AISupportWidget from "@/components/formations/AISupportWidget";
import "@/components/formations/fiche/fiche.css";
import { EnTeteFiche } from "@/components/formations/fiche/EnTeteFiche";
import { VignetteFiche } from "@/components/formations/fiche/VignetteFiche";
import { CarteAchat } from "@/components/formations/fiche/CarteAchat";
import { BarreAchatMobile } from "@/components/formations/fiche/BarreAchatMobile";
import {
  Accordeon,
  EtatChargementFiche,
  EtatIntrouvable,
  FaqFiche,
  ListeAvis,
  ListeCoches,
  SectionFiche,
  type QuestionFaq,
} from "@/components/formations/fiche/SectionsFiche";
import { useRevealFiche } from "@/components/formations/fiche/use-reveal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lesson {
  id: string;
  title: string;
  duration: number | null;
  isFree: boolean;
  order: number;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  lessonCount: number;
  duration: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

interface Vendeur {
  // Anonymat : identite perso jamais exposee. On ne garde que l'id (pixels/reco/
  // inquiry) et les pixels marketing du vendeur.
  id: string;
  marketingPixels?: Array<{ type: "FACEBOOK" | "GOOGLE" | "TIKTOK" | "SNAPCHAT" | "PINTEREST"; pixelId: string }>;
}

interface Formation {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  description: string | null;
  descriptionFormat: string;
  learnPoints: string[];
  requirements: string[];
  targetAudience: string | null;
  locale: string;
  thumbnail: string | null;
  previewVideo: string | null;
  level: string;
  languages: string[];
  duration: number;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  hasCertificate: boolean;
  maxStudents: number | null;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  viewsCount: number;
  totalLessons: number;
  category: { id: string; slug: string; name: string } | null;
  instructeur: Vendeur;
  sections: Section[];
  reviews: Review[];
  shop: { slug: string; name: string; legalName: string | null; font: string | null; themeColor: string | null; logoUrl?: string | null; contactEmail?: string | null; whatsapp?: string | null } | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

const LEVEL_LABELS: Record<string, { label: string; chip: string }> = {
  DEBUTANT: { label: "Débutant", chip: "nkf-chip--green" },
  INTERMEDIAIRE: { label: "Intermédiaire", chip: "nkf-chip--amber" },
  AVANCE: { label: "Avancé", chip: "nkf-chip--red" },
  TOUS_NIVEAUX: { label: "Tous niveaux", chip: "" },
};

// Objections classiques avant l'achat d'une formation. Rien de chiffré : les
// délais et seuils de remboursement vivent dans la configuration (CGU §9).
const FAQ_FORMATION: QuestionFaq[] = [
  {
    q: "Comment accéder à la formation après l'achat ?",
    r: (
      <>
        Dès que le paiement est confirmé, la formation apparaît dans votre espace <strong>Mes formations</strong>. Vous suivez les
        leçons à votre rythme, depuis un téléphone ou un ordinateur.
      </>
    ),
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    r: (
      <>
        Mobile Money (Orange Money, MTN, Moov, Wave…) et carte bancaire, selon votre pays. Le choix se fait à l&apos;étape suivante,
        sur une page de paiement sécurisée.
      </>
    ),
  },
  {
    q: "L'accès est-il limité dans le temps ?",
    r: <>Non : l&apos;accès est à vie. Vous pouvez revoir les leçons autant de fois que vous le souhaitez.</>,
  },
  {
    q: "Puis-je être remboursé ?",
    r: (
      <>
        Oui, pendant une courte période après l&apos;achat et tant que la formation n&apos;a pas été consommée au-delà d&apos;un certain
        seuil. Les modalités exactes sont dans nos <Link href="/cgu">conditions générales</Link>.
      </>
    ),
  },
];

const FAQ_CERTIFICAT: QuestionFaq = {
  q: "Un certificat est-il délivré ?",
  r: <>Oui : un certificat de complétion est généré une fois toutes les leçons terminées, disponible dans votre espace.</>,
};

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function FormationPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const racineRef = useRef<HTMLDivElement>(null);
  const enteteRef = useRef<HTMLDivElement>(null);
  const carteRef = useRef<HTMLElement>(null);
  useRevealFiche(racineRef, formation?.id ?? "");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formations/public/formation/${slug}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setFormation(json.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Police de la boutique du vendeur (identité typographique cohérente).
  useEffect(() => {
    const font = formation?.shop?.font;
    const href = shopFontHref(font ?? null);
    if (!href) return;
    const id = `shopfont-${font}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [formation?.shop?.font]);

  function retour() {
    // Retour à la page précédente si on a un historique interne,
    // sinon fallback vers le catalogue (cas d'arrivée directe depuis Google).
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/explorer");
  }

  function handleBuyNow() {
    if (!formation) return;
    trackEvents.ctaClick({ id: formation.id, kind: "formation", price: formation.price, title: formation.title }, "fiche_formation");
    router.push(`/checkout?fids=${formation.id}`);
  }

  async function handleAddToCart() {
    if (!formation || addingToCart) return;
    setAddingToCart(true);
    try {
      const res = await fetch("/api/formations/apprenant/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId: formation.id }),
      });
      if (res.ok) {
        // Reste « Ajouté au panier » (coloré) : on ne réinitialise plus.
        setAddedToCart(true);
        trackEvents.addToCart({ id: formation.id, kind: "formation", price: formation.price, title: formation.title });
        // Notify the navbar cart badge to refresh
        try {
          window.dispatchEvent(new CustomEvent("nk:cart-change"));
        } catch { /* ignore */ }
      }
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) return <EtatChargementFiche />;

  if (error || !formation) {
    return (
      <EtatIntrouvable
        Icone={GraduationCap}
        titre="Formation introuvable"
        texte="Cette formation n'existe pas ou n'est plus disponible."
      />
    );
  }

  const levelInfo = LEVEL_LABELS[formation.level] ?? { label: formation.level, chip: "" };
  const discount = formation.originalPrice && formation.originalPrice > formation.price
    ? Math.round(((formation.originalPrice - formation.price) / formation.originalPrice) * 100)
    : 0;

  // Police de la boutique : corps ET titres, pour garder son identité.
  const policeBoutique = formation.shop?.font ? shopFontStack(formation.shop.font) : null;
  const stylePolice = policeBoutique
    ? ({ fontFamily: policeBoutique, "--nkf-display": policeBoutique } as CSSProperties)
    : undefined;

  // Fil d'Ariane : depuis une boutique, on ne renvoie JAMAIS vers la place de
  // marché (les concurrents du vendeur) — la catégorie reste un simple texte.
  const fil = [
    formation.shop ? { label: formation.shop.name, href: `/${formation.shop.slug}` } : { label: "Explorer", href: "/explorer" },
    ...(formation.category
      ? [{ label: formation.category.name, href: formation.shop ? undefined : `/explorer?categorie=${formation.category.slug}` }]
      : []),
    { label: formation.title },
  ];

  const faq = formation.hasCertificate ? [...FAQ_FORMATION, FAQ_CERTIFICAT] : FAQ_FORMATION;
  const programmeMeta = [
    `${formation.sections.length} section${formation.sections.length > 1 ? "s" : ""}`,
    `${formation.totalLessons} leçon${formation.totalLessons > 1 ? "s" : ""}`,
    ...(formation.duration > 0 ? [fmtDuration(formation.duration)] : []),
  ].join(" · ");

  return (
    <div
      ref={racineRef}
      className={`nkf ${sora.variable} min-h-screen bg-[#f7f9fb] pb-24 lg:pb-0 ${formation.shop ? "" : "pt-16 lg:pt-[76px]"}`}
      style={stylePolice}
    >
      {/* En-tête : celui de la BOUTIQUE quand la formation en a une, pour que
          l'acheteur reste dans son univers. Le menu plateforme est masqué sur
          cette route (ConditionalPlatformNavbar) ; on le remet seulement si la
          formation n'appartient à aucune boutique. */}
      {formation.shop ? (
        <ShopHeader
          shopName={formation.shop.name}
          logoUrl={formation.shop.logoUrl ?? null}
          themeColor={formation.shop.themeColor}
          staticBase={`/${formation.shop.slug}`}
        />
      ) : (
        <FormationsNavbar />
      )}

      {/* Pixels vendeur (FB, Google, TikTok) — event ViewContent avec valeur */}
      <PixelInjector
        pixels={formation.instructeur.marketingPixels ?? []}
        event={{ name: "ViewContent", value: formation.price, currency: "XOF" }}
      />

      {/* Widget IA Support Client (si vendeur actif) */}
      <AISupportWidget
        instructeurId={formation.instructeur.id}
        pageContext={`Le visiteur consulte la formation "${formation.title}" à ${formation.price} F CFA.`}
      />

      <div className="mx-auto max-w-6xl px-4 pb-14 pt-5 md:px-6 md:pb-20 md:pt-7">
        {/* Grille : en-tête sur toute la largeur, puis contenu à gauche et
            carte d'achat à droite (collante, sur deux rangées). Sur mobile,
            l'ordre du DOM fait foi : en-tête, visuel, carte, contenu. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_auto_1fr] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(0,1fr)_384px]">
          <div ref={enteteRef} className="lg:col-span-2">
            <EnTeteFiche
              fil={fil}
              onRetour={retour}
              eyebrow={formation.category?.name ?? "Formation en ligne"}
              titre={formation.title}
              sousTitre={formation.shortDesc}
              note={formation.rating}
              nbAvis={formation.reviewsCount}
              // Le nombre d'apprenants n'est une preuve qu'au-delà de 100 (règle de
              // l'ancienne fiche) ; en dessous il dessert la formation.
              compteur={
                formation.studentsCount > 100
                  ? { valeur: formation.studentsCount, libelle: formation.studentsCount > 1 ? "apprenants" : "apprenant" }
                  : null
              }
              infos={[
                ...(formation.totalLessons > 0
                  ? [
                      <Fragment key="lecons">
                        <PlayCircle aria-hidden="true" />
                        <strong>{formation.totalLessons}</strong> leçon{formation.totalLessons > 1 ? "s" : ""}
                      </Fragment>,
                    ]
                  : []),
                ...(formation.duration > 0
                  ? [
                      <Fragment key="duree">
                        <Clock aria-hidden="true" />
                        <strong>{fmtDuration(formation.duration)}</strong> de contenu
                      </Fragment>,
                    ]
                  : []),
                ...(formation.languages.length > 0
                  ? [
                      <Fragment key="langues">
                        <Globe aria-hidden="true" />
                        {formation.languages.map((l) => l.toUpperCase()).join(", ")}
                      </Fragment>,
                    ]
                  : []),
              ]}
              badges={
                <>
                  <span className={`nkf-chip ${levelInfo.chip}`}>{levelInfo.label}</span>
                  {formation.hasCertificate && (
                    <span className="nkf-chip nkf-chip--green">
                      <Award aria-hidden="true" />
                      Certificat inclus
                    </span>
                  )}
                  {formation.studentsCount > 100 && (
                    <span className="nkf-chip nkf-chip--amber">
                      <Flame aria-hidden="true" />
                      Populaire
                    </span>
                  )}
                </>
              }
              boutique={
                formation.shop ? { nom: formation.shop.name, href: `/${formation.shop.slug}`, logoUrl: formation.shop.logoUrl } : null
              }
            />
          </div>

          {/* Visuel : la vidéo de présentation quand il y en a une (elle vivait
              dans la colonne prix, à l'étroit), sinon la vignette 16:9. */}
          <div className="lg:col-start-1 lg:row-start-2">
            <VignetteFiche
              src={formation.thumbnail}
              alt={formation.title}
              Icone={PlayCircle}
              media={
                formation.previewVideo ? (
                  <video
                    src={formation.previewVideo}
                    controls
                    preload="metadata"
                    poster={formation.thumbnail ?? undefined}
                    className="absolute inset-0 h-full w-full bg-black object-cover"
                  />
                ) : undefined
              }
              badges={
                <>
                  <span className="nkf-tag">
                    <PlayCircle aria-hidden="true" />
                    {formation.previewVideo ? "Aperçu vidéo" : "Formation vidéo"}
                  </span>
                  {discount > 0 && !formation.isFree && <span className="nkf-tag nkf-tag--ink tabular-nums">−{discount} %</span>}
                </>
              }
            />
          </div>

          <aside ref={carteRef} className="lg:col-start-2 lg:row-start-2 lg:row-span-2" aria-label="Acheter cette formation">
            <div className="lg:sticky lg:top-24">
              <CarteAchat
                prix={formation.price}
                prixInitial={formation.originalPrice}
                gratuit={formation.isFree}
                principal={{
                  libelle: formation.isFree ? "Commencer maintenant" : "Acheter maintenant",
                  onClick: handleBuyNow,
                  Icone: formation.isFree ? Play : Zap,
                }}
                panier={
                  !formation.isFree
                    ? { onClick: handleAddToCart, etat: addedToCart ? "ajoute" : addingToCart ? "chargement" : "repos" }
                    : null
                }
                moyensPaiement={!formation.isFree}
                garanties={[
                  { Icone: CalendarCheck, contenu: formation.isFree ? "Accès immédiat" : "Accès immédiat après paiement" },
                  { Icone: InfinityIcon, contenu: "Accès à vie" },
                  ...(formation.hasCertificate ? [{ Icone: Award, contenu: "Certificat de complétion" }] : []),
                  { Icone: MonitorSmartphone, contenu: "Accessible sur mobile & desktop" },
                  { Icone: ShieldCheck, contenu: "Paiement 100 % sécurisé" },
                  {
                    Icone: RotateCcw,
                    contenu: (
                      <>
                        Remboursement encadré — <Link href="/cgu">conditions</Link>
                      </>
                    ),
                  },
                ]}
                boutique={formation.shop ? { nom: formation.shop.name, href: `/${formation.shop.slug}` } : null}
                partage={formation.title}
              >
                <div className="mt-3">
                  <InquiryWidget
                    formationId={formation.id}
                    productTitle={formation.title}
                    vendorName={formation.shop?.name ?? "la boutique"}
                  />
                </div>
              </CarteAchat>
            </div>
          </aside>

          <div className="grid gap-6 lg:col-start-1 lg:row-start-3 lg:self-start">
            {formation.learnPoints && formation.learnPoints.length > 0 && (
              <SectionFiche id="objectifs" titre="Ce que vous allez apprendre" eyebrow="Objectifs">
                <ListeCoches items={formation.learnPoints} colonnes={2} />
              </SectionFiche>
            )}

            {formation.description && (
              <SectionFiche id="description" titre="Description" eyebrow="À propos de cette formation">
                <div className="nkf-prose">
                  {/* Rendu unifié HTML/Markdown — identique à l'éditeur (nk-rich) */}
                  <TiptapRenderer content={formation.description} />
                </div>
              </SectionFiche>
            )}

            {formation.sections && formation.sections.length > 0 && (
              <SectionFiche id="programme" titre="Programme de la formation" eyebrow="Contenu" meta={programmeMeta}>
                <div className="grid gap-2.5">
                  {formation.sections.map((s, i) => (
                    <Accordeon
                      key={s.id}
                      num={i + 1}
                      titre={s.title}
                      meta={`${s.lessonCount} leçon${s.lessonCount > 1 ? "s" : ""}${s.duration > 0 ? ` · ${fmtDuration(s.duration)}` : ""}`}
                      defautOuvert={i === 0}
                    >
                      <ul className="m-0 list-none p-0">
                        {s.lessons.map((l) => (
                          <li key={l.id} className="nkf-lesson">
                            {l.isFree ? (
                              <PlayCircle className="text-[#006e2f]" aria-hidden="true" />
                            ) : (
                              <Lock className="text-[#8a968e]" aria-hidden="true" />
                            )}
                            <span className="min-w-0 flex-1 truncate">{l.title}</span>
                            {l.isFree && <span className="nkf-chip nkf-chip--green">Aperçu</span>}
                            {l.duration ? <span className="text-xs tabular-nums text-[#5c6b62]">{fmtDuration(l.duration)}</span> : null}
                            {!l.isFree && <span className="sr-only">(réservé aux inscrits)</span>}
                          </li>
                        ))}
                      </ul>
                    </Accordeon>
                  ))}
                </div>
              </SectionFiche>
            )}

            {formation.targetAudience && (
              <SectionFiche id="pour-qui" titre="À qui s'adresse cette formation ?" eyebrow="Pour qui">
                <p className="max-w-[68ch] whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-[#2f3a34]">{formation.targetAudience}</p>
              </SectionFiche>
            )}

            {formation.requirements && formation.requirements.length > 0 && (
              <SectionFiche id="prerequis" titre="Prérequis" eyebrow="Avant de commencer">
                <ListeCoches items={formation.requirements} Icone={ArrowRight} />
              </SectionFiche>
            )}

            <SectionFiche id="faq" titre="Questions fréquentes" eyebrow="Avant d'acheter">
              <FaqFiche items={faq} />
            </SectionFiche>

            <SectionFiche
              id="avis"
              titre="Avis des apprenants"
              eyebrow="Ils ont suivi la formation"
              meta={`${formation.reviewsCount} avis`}
            >
              {formation.reviews.length >= 2 ? (
                <>
                  <ReviewsCarousel reviews={formation.reviews} themeColor={formation.shop?.themeColor ?? "#006e2f"} sansCadre />
                  {/* Liste complète (avec les réponses du créateur) repliée sous le carrousel. */}
                  <div className="mt-5">
                    <Accordeon titre={`Lire tous les avis (${formation.reviews.length})`}>
                      <ListeAvis avis={formation.reviews} vide="Aucun avis pour cette formation pour l'instant." />
                    </Accordeon>
                  </div>
                </>
              ) : (
                <ListeAvis avis={formation.reviews} vide="Aucun avis pour cette formation pour l'instant." />
              )}
            </SectionFiche>

            {/* Contact : l'acheteur vient de finir la description, il hésite, et
                c'est là qu'une question sans réponse le fait partir. Même
                placement que la fiche produit — les deux pages se lisent pareil. */}
            <div className="nkf-reveal [&>section]:mt-0">
              <BlocContact
                contactEmail={formation.shop?.contactEmail}
                whatsapp={formation.shop?.whatsapp}
                nomBoutique={formation.shop?.name}
                titreProduit={formation.title}
                themeColor={formation.shop?.themeColor}
                chatDisponible
              />
            </div>
          </div>
        </div>

        {/* Recommandations « Vous aimerez aussi » (v2 Phase 2) */}
        <div className="nkf-reveal mt-10 md:mt-14">
          <RelatedProducts instructeurId={formation.instructeur?.id} excludeId={formation.id} title="Autres produits de la boutique" />
        </div>
      </div>

      {/* Pied de page = celui de la boutique du vendeur (footer plateforme masqué). */}
      {formation.shop ? (
        <ShopFooter shopSlug={formation.shop.slug} shopName={formation.shop.name} legalName={formation.shop.legalName} />
      ) : (
        <FormationsFooter />
      )}

      {/* Barre d'achat fixe en bas — sous `lg` uniquement. */}
      <BarreAchatMobile
        prix={formation.price}
        prixInitial={formation.originalPrice}
        gratuit={formation.isFree}
        libelle={formation.isFree ? "Commencer" : "Acheter"}
        Icone={formation.isFree ? Play : Zap}
        onClick={handleBuyNow}
        apresRef={enteteRef}
        carteRef={carteRef}
      />
    </div>
  );
}
