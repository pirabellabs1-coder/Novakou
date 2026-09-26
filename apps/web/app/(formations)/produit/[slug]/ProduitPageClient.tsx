"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShopFooter from "@/components/formations/ShopFooter";
import { FormationsFooter } from "@/components/formations/FormationsFooter";
import { FormationsNavbar } from "@/components/formations/FormationsNavbar";
import { ApercuPdf } from "@/components/formations/ApercuPdf";
import { PAGES_APERCU } from "@/lib/formations/apercu";
import { ShopHeader } from "@/components/formations/ShopHeader";
import { shopFontStack, shopFontHref } from "@/lib/formations/shop-fonts";
import { sora } from "@/lib/fonts";
import { trackEvents } from "@/lib/tracking/events";
import {
  Ban,
  BookOpen,
  CalendarCheck,
  Code,
  Download,
  Eye,
  FileType,
  Flame,
  GraduationCap,
  Infinity as InfinityIcon,
  LayoutDashboard,
  MonitorSmartphone,
  Music,
  Package,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { PixelInjector } from "@/components/formations/PixelInjector";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";
import { InquiryWidget } from "@/components/formations/InquiryWidget";
import AISupportWidget from "@/components/formations/AISupportWidget";
import { SaleAvailability } from "@/components/formations/SaleAvailability";
import { RelatedProducts } from "@/components/formations/RelatedProducts";
import { BlocContact } from "@/components/formations/BlocContact";
import ReviewsCarousel from "@/components/formations/ReviewsCarousel";
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
interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

interface Vendeur {
  // Anonymat : identite perso jamais exposee. On ne garde que l'id (pixels/reco/
  // inquiry) et les pixels marketing du vendeur.
  id: string;
  marketingPixels?: Array<{ type: "FACEBOOK" | "GOOGLE" | "TIKTOK" | "SNAPCHAT" | "PINTEREST"; pixelId: string }>;
}

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  descriptionFormat: string;
  productType: string;          // "PDF" | "VIDEO" | "AUDIO" | "EBOOK" | "TEMPLATE" | etc.
  banner: string | null;
  thumbnail?: string | null;
  price: number;
  originalPrice: number | null;
  currency: string;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  viewsCount: number;
  tags: string[];
  maxBuyers: number | null;
  currentBuyers: number | null;
  salesEndAt?: string | null;
  previewAvailable?: boolean;
  category: { id: string; slug: string; name: string } | null;
  instructeur: Vendeur;
  reviews: Review[];
  shop: { slug: string; name: string; legalName: string | null; font: string | null; themeColor: string | null; logoUrl?: string | null; contactEmail?: string | null; whatsapp?: string | null } | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  PDF: { label: "PDF", icon: FileType },
  EBOOK: { label: "E-book", icon: BookOpen },
  VIDEO: { label: "Vidéo", icon: PlayCircle },
  AUDIO: { label: "Audio", icon: Music },
  TEMPLATE: { label: "Template", icon: LayoutDashboard },
  COURSE: { label: "Cours digital", icon: GraduationCap },
  SOFTWARE: { label: "Logiciel", icon: Code },
  BUNDLE: { label: "Pack", icon: Package },
  OTHER: { label: "Produit digital", icon: ShoppingBag },
};

// Objections classiques avant un achat numérique. Rien de chiffré ici : les
// délais et seuils de remboursement vivent dans la configuration (CGU §9).
const FAQ_PRODUIT: QuestionFaq[] = [
  {
    q: "Comment récupérer le produit après l'achat ?",
    r: (
      <>
        Dès que le paiement est confirmé, le fichier est disponible dans votre espace <strong>Mes achats</strong>, accessible à tout
        moment depuis un téléphone ou un ordinateur.
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
    q: "Puis-je poser une question avant d'acheter ?",
    r: <>Oui : le bouton « Une question ? » envoie votre message directement à la boutique.</>,
  },
  {
    q: "Et si je change d'avis ?",
    r: (
      <>
        Un contenu numérique téléchargé n&apos;est pas remboursable : le téléchargement vaut renonciation au droit de rétractation. En
        cas de problème (fichier inaccessible, contenu non conforme), Novakou arbitre les litiges — voir les{" "}
        <Link href="/cgu">conditions générales</Link>.
      </>
    ),
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ProduitPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Mis à jour par <SaleAvailability> à chaque tick (deadline ou stock atteint).
  // Permet de désactiver le bouton "Acheter" en temps réel sans recharger la page.
  const [canBuy, setCanBuy] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [addedCart, setAddedCart] = useState(false);
  // L'aperçu PDF se dessine sur canvas (coûteux sur téléphone) : monté
  // seulement quand l'acheteur ouvre l'accordéon, comme l'ancien onglet.
  const [apercuOuvert, setApercuOuvert] = useState(false);

  const racineRef = useRef<HTMLDivElement>(null);
  const enteteRef = useRef<HTMLDivElement>(null);
  const carteRef = useRef<HTMLElement>(null);
  useRevealFiche(racineRef, product?.id ?? "");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formations/public/produit/${slug}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setProduct(json.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Charge la police de la boutique du vendeur (si définie) pour que la page
  // produit adopte l'identité typographique de la boutique.
  useEffect(() => {
    const font = product?.shop?.font;
    const href = shopFontHref(font ?? null);
    if (!href) return;
    const id = `shopfont-${font}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [product?.shop?.font]);

  function retour() {
    // Retour d'où l'on vient (boutique, catalogue) ; arrivée directe → catalogue.
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/explorer");
  }

  function handleBuyNow() {
    if (!product) return;
    trackEvents.ctaClick({ id: product.id, kind: "product", price: product.price, title: product.title }, "fiche_produit");
    router.push(`/checkout?pids=${product.id}`);
  }

  async function handleAddToCart() {
    if (!product || addingCart || addedCart) return;
    setAddingCart(true);
    try {
      const res = await fetch("/api/formations/apprenant/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        setAddedCart(true); // reste coloré
        trackEvents.addToCart({ id: product.id, kind: "product", price: product.price, title: product.title });
        try { window.dispatchEvent(new CustomEvent("nk:cart-change")); } catch { /* ignore */ }
      }
    } finally {
      setAddingCart(false);
    }
  }

  if (loading) return <EtatChargementFiche />;

  if (error || !product) {
    return (
      <EtatIntrouvable Icone={ShoppingBag} titre="Produit introuvable" texte="Ce produit n'existe pas ou n'est plus disponible." />
    );
  }

  const typeInfo = TYPE_LABELS[product.productType] ?? TYPE_LABELS.OTHER;
  const TypeIcon = typeInfo.icon;
  const isFree = product.price === 0;
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  // Réunion d'urgence du 2026-05-26 (audit Karim+Fatou+Amélie) :
  // `currentBuyers` est un seed manuel saisi par le vendeur ; `salesCount` est le
  // compteur incrémenté par chaque achat réel. La jauge publique DOIT refléter
  // les vraies ventes — on prend le max pour que les ventes réelles dépassent
  // tout seed inflationniste et restent la source de vérité dès qu'elles
  // dépassent le boost initial.
  const displayedSold = Math.max(product.currentBuyers ?? 0, product.salesCount ?? 0);
  const remaining = product.maxBuyers != null
    ? Math.max(0, product.maxBuyers - displayedSold)
    : null;

  // Police de la boutique : corps ET titres, pour garder son identité.
  const policeBoutique = product.shop?.font ? shopFontStack(product.shop.font) : null;
  const stylePolice = policeBoutique
    ? ({ fontFamily: policeBoutique, "--nkf-display": policeBoutique } as CSSProperties)
    : undefined;

  // Fil d'Ariane : depuis une boutique, on ne renvoie JAMAIS vers la place de
  // marché (les concurrents du vendeur) — la catégorie reste un simple texte.
  const fil = [
    product.shop ? { label: product.shop.name, href: `/${product.shop.slug}` } : { label: "Explorer", href: "/explorer" },
    ...(product.category
      ? [{ label: product.category.name, href: product.shop ? undefined : `/explorer?categorie=${product.category.slug}` }]
      : []),
    { label: product.title },
  ];

  const libelleAchat = !canBuy ? "Vente terminée" : isFree ? "Télécharger maintenant" : "Acheter maintenant";
  const IconeAchat = !canBuy ? Ban : isFree ? Download : ShoppingCart;

  return (
    <div
      ref={racineRef}
      className={`nkf ${sora.variable} min-h-screen bg-[#f7f9fb] pb-24 lg:pb-0 ${product.shop ? "" : "pt-16 lg:pt-[76px]"}`}
      style={stylePolice}
    >
      {/* En-tête : celui de la BOUTIQUE quand le produit en a une, pour que
          l'acheteur reste dans son univers. Le menu plateforme est masqué sur
          cette route (ConditionalPlatformNavbar) ; on le remet seulement si le
          produit n'appartient à aucune boutique. */}
      {product.shop ? (
        <ShopHeader
          shopName={product.shop.name}
          logoUrl={product.shop.logoUrl ?? null}
          themeColor={product.shop.themeColor}
          staticBase={`/${product.shop.slug}`}
        />
      ) : (
        <FormationsNavbar />
      )}

      {/* Pixels vendeur : FB, Google, TikTok — event ViewContent */}
      <PixelInjector
        pixels={product.instructeur.marketingPixels ?? []}
        event={{ name: "ViewContent", value: product.price, currency: "XOF" }}
      />

      {/* Widget IA Support Client (si vendeur actif) */}
      <AISupportWidget
        instructeurId={product.instructeur.id}
        pageContext={`Le visiteur consulte le produit "${product.title}" à ${product.price} F CFA.`}
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
              eyebrow={product.category?.name ?? typeInfo.label}
              titre={product.title}
              note={product.rating}
              nbAvis={product.reviewsCount}
              // Ni nombre de ventes, ni date d'ajout (demande fondateur) : un petit
              // chiffre ou une vieille date dessert le produit sans rien dire de sa valeur.
              compteur={null}
              badges={
                product.tags.length > 0 || product.salesCount > 50 || (remaining !== null && remaining < 50) ? (
                  <>
                    {product.salesCount > 50 && (
                      <span className="nkf-chip nkf-chip--amber">
                        <Flame aria-hidden="true" />
                        Populaire
                      </span>
                    )}
                    {remaining !== null && remaining < 50 && (
                      <span className="nkf-chip nkf-chip--red tabular-nums">
                        Plus que {remaining} {remaining > 1 ? "places" : "place"}
                      </span>
                    )}
                    {product.tags.slice(0, 4).map((t) => (
                      <span key={t} className="nkf-chip">
                        #{t}
                      </span>
                    ))}
                  </>
                ) : undefined
              }
              boutique={product.shop ? { nom: product.shop.name, href: `/${product.shop.slug}`, logoUrl: product.shop.logoUrl } : null}
            />
          </div>

          {/* Visuel : l'image du produit EN ENTIER (jamais rognée), fond flouté. */}
          <div className="lg:col-start-1 lg:row-start-2">
            <VignetteFiche
              src={product.banner ?? product.thumbnail}
              alt={product.title}
              ajuster="contain"
              Icone={TypeIcon}
              badges={
                <>
                  <span className="nkf-tag">
                    <TypeIcon aria-hidden="true" />
                    {typeInfo.label}
                  </span>
                  {/* La catégorie est déjà l'eyebrow du titre ; un produit gratuit
                      à prix initial afficherait « −100 % », sans intérêt. */}
                  {discount > 0 && !isFree && <span className="nkf-tag nkf-tag--ink tabular-nums">−{discount} %</span>}
                </>
              }
            />
          </div>

          <aside ref={carteRef} className="lg:col-start-2 lg:row-start-2 lg:row-span-2" aria-label="Acheter ce produit">
            <div className="lg:sticky lg:top-24">
              <CarteAchat
                prix={product.price}
                prixInitial={product.originalPrice}
                gratuit={isFree}
                principal={{ libelle: libelleAchat, onClick: handleBuyNow, disabled: !canBuy, Icone: IconeAchat }}
                panier={!isFree && canBuy ? { onClick: handleAddToCart, etat: addedCart ? "ajoute" : addingCart ? "chargement" : "repos" } : null}
                moyensPaiement={!isFree}
                garanties={[
                  { Icone: CalendarCheck, contenu: isFree ? "Accès immédiat" : "Accès immédiat après paiement" },
                  { Icone: InfinityIcon, contenu: "Accès et téléchargement à vie" },
                  { Icone: TypeIcon, contenu: `Format ${typeInfo.label}` },
                  { Icone: MonitorSmartphone, contenu: "Accessible sur mobile & desktop" },
                  { Icone: ShieldCheck, contenu: "Paiement 100 % sécurisé" },
                  {
                    Icone: RotateCcw,
                    contenu: (
                      <>
                        Litiges encadrés par Novakou — <Link href="/cgu">conditions</Link>
                      </>
                    ),
                  },
                ]}
                boutique={product.shop ? { nom: product.shop.name, href: `/${product.shop.slug}` } : null}
                partage={product.title}
              >
                {/* Compte à rebours + barre de progression — affichés uniquement
                    si le vendeur a configuré une deadline ou un stock max. */}
                <SaleAvailability
                  salesEndAt={product.salesEndAt}
                  maxBuyers={product.maxBuyers}
                  currentBuyers={displayedSold}
                  onAvailabilityChange={setCanBuy}
                />
                <div className="mt-3">
                  <InquiryWidget productId={product.id} productTitle={product.title} vendorName={product.shop?.name ?? "la boutique"} />
                </div>
              </CarteAchat>
            </div>
          </aside>

          <div className="grid gap-6 lg:col-start-1 lg:row-start-3 lg:self-start">
            <SectionFiche id="description" eyebrow="À propos de ce produit">
              {product.description ? (
                <div className="nkf-prose">
                  {/* Rendu unifié HTML/Markdown — identique à l'éditeur (nk-rich) */}
                  <TiptapRenderer content={product.description} />
                </div>
              ) : (
                <p className="text-sm text-[#5c6b62]">Aucune description fournie pour ce produit.</p>
              )}
            </SectionFiche>

            <SectionFiche id="inclus" titre="Ce que vous obtenez" eyebrow="Inclus">
              <ListeCoches
                items={[
                  <span key="format">
                    Format <strong>{typeInfo.label}</strong>
                  </span>,
                  isFree ? "Téléchargement immédiat" : "Téléchargement immédiat après paiement",
                  "Accès à vie depuis votre espace Mes achats",
                  "Lisible sur mobile et ordinateur",
                ]}
                colonnes={2}
              />
              {/* Aperçu : 2 premières pages filigranées, rendues sur canvas. */}
              {product.previewAvailable && (
                <div className="mt-6">
                  <Accordeon
                    titre={`Aperçu gratuit — ${PAGES_APERCU} première${PAGES_APERCU > 1 ? "s" : ""} page${PAGES_APERCU > 1 ? "s" : ""}`}
                    ouvert={apercuOuvert}
                    onChange={setApercuOuvert}
                  >
                    <div className="flex items-start gap-3 rounded-xl bg-[#fff4e0] px-4 py-3 text-xs leading-relaxed text-[#6b3a00]">
                      <Eye size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <p>
                        Les pages affichées portent un filigrane Novakou. Achetez le produit pour télécharger le fichier complet sans
                        filigrane.
                      </p>
                    </div>
                    <div className="mt-4">{apercuOuvert && <ApercuPdf produitId={product.id} titre={product.title} />}</div>
                  </Accordeon>
                </div>
              )}
            </SectionFiche>

            <SectionFiche id="faq" titre="Questions fréquentes" eyebrow="Avant d'acheter">
              <FaqFiche items={FAQ_PRODUIT} />
            </SectionFiche>

            <SectionFiche
              id="avis"
              titre="Avis des acheteurs"
              eyebrow="Ils l'ont acheté"
              meta={`${product.reviewsCount} avis`}
            >
              {product.reviews.length >= 2 ? (
                <>
                  <ReviewsCarousel reviews={product.reviews} themeColor={product.shop?.themeColor ?? "#006e2f"} sansCadre />
                  <div className="mt-5">
                    <Accordeon titre={`Lire tous les avis (${product.reviews.length})`}>
                      <ListeAvis avis={product.reviews} vide="Aucun avis pour ce produit pour l'instant." />
                    </Accordeon>
                  </div>
                </>
              ) : (
                <ListeAvis
                  avis={product.reviews}
                  vide="Aucun avis pour ce produit pour l'instant."
                  sousVide="Soyez le premier à laisser votre retour après l'achat."
                />
              )}
            </SectionFiche>

            {/* Contact : l'acheteur vient de finir la description, il hésite, et
                c'est là qu'une question sans réponse le fait partir. Après les
                recommandations, on le lui offrirait une fois déjà parti ailleurs. */}
            <div className="nkf-reveal [&>section]:mt-0">
              <BlocContact
                contactEmail={product.shop?.contactEmail}
                whatsapp={product.shop?.whatsapp}
                nomBoutique={product.shop?.name}
                titreProduit={product.title}
                themeColor={product.shop?.themeColor}
                // Le formulaire est monté plus haut, sans condition : on peut donc
                // toujours proposer de l'ouvrir. C'est ce qui garantit un chemin vers
                // le vendeur même quand la boutique n'a ni e-mail ni WhatsApp.
                chatDisponible
              />
            </div>
          </div>
        </div>

        {/* Recommandations « Vous aimerez aussi » (v2 Phase 2) */}
        <div className="nkf-reveal mt-10 md:mt-14">
          <RelatedProducts instructeurId={product.instructeur?.id} excludeId={product.id} title="Autres produits de la boutique" />
        </div>
      </div>

      {/* Pied de page = celui de la BOUTIQUE du vendeur (identité = boutique).
          Le footer plateforme est masqué sur cette route. */}
      {product.shop ? (
        <ShopFooter shopSlug={product.shop.slug} shopName={product.shop.name} legalName={product.shop.legalName} />
      ) : (
        <FormationsFooter />
      )}

      {/* Barre d'achat fixe en bas — sous `lg` uniquement (au-delà, la carte
          d'achat est collante). Apparaît une fois l'en-tête dépassé. */}
      {canBuy && (
        <BarreAchatMobile
          prix={product.price}
          prixInitial={product.originalPrice}
          gratuit={isFree}
          libelle={isFree ? "Télécharger" : "Acheter"}
          Icone={isFree ? Download : ShoppingCart}
          onClick={handleBuyNow}
          apresRef={enteteRef}
          carteRef={carteRef}
        />
      )}
    </div>
  );
}
