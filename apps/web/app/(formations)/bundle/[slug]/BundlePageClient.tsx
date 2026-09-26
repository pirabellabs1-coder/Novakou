"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CalendarCheck,
  Gift,
  GraduationCap,
  Infinity as InfinityIcon,
  MonitorSmartphone,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { usePrix } from "@/components/formations/Prix";
import { UnifiedPaymentScreen } from "@/components/formations/UnifiedPaymentScreen";
import { KkiapayWidget, type KkiapayInit } from "@/components/formations/KkiapayWidget";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";
import { sora } from "@/lib/fonts";
import { productImageSrc } from "@/lib/utils/image-url";
import "@/components/formations/fiche/fiche.css";
import { EnTeteFiche } from "@/components/formations/fiche/EnTeteFiche";
import { VignetteFiche } from "@/components/formations/fiche/VignetteFiche";
import { CarteAchat } from "@/components/formations/fiche/CarteAchat";
import { BarreAchatMobile } from "@/components/formations/fiche/BarreAchatMobile";
import { FaqFiche, SectionFiche, type QuestionFaq } from "@/components/formations/fiche/SectionsFiche";
import { useRevealFiche } from "@/components/formations/fiche/use-reveal";
import { mouvementReduit } from "@/components/formations/fiche/reveal";

// Le formateur vit DANS le composant et derive du pays choisi : il couvre
// ainsi tous les prix de cet ecran d un coup. En fonction de module, il
// fallait ecrire « FCFA » en dur — donc rater la conversion partout.

interface BundleItem {
  kind: "formation" | "product";
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  price: number;
}

interface Bundle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  banner: string | null;
  priceXof: number;
  originalPriceXof: number | null;
  itemsSum: number;
  savings: number;
  savingsPct: number;
  purchases: number;
  instructeur: { id: string };
  shop: { id: string; slug: string; name: string; logoUrl: string | null; themeColor: string | null } | null;
  items: BundleItem[];
}

const FAQ_PACK: QuestionFaq[] = [
  {
    q: "Que se passe-t-il après le paiement ?",
    r: (
      <>
        Dès que le paiement est confirmé, chaque article du pack — formations et produits — apparaît dans votre espace{" "}
        <strong>Mes achats</strong>, sans rien avoir à réclamer.
      </>
    ),
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    r: (
      <>
        Mobile Money (Orange Money, MTN, Moov, Wave…) et carte bancaire, selon votre pays. Choisissez votre pays et votre moyen
        directement dans la carte d&apos;achat.
      </>
    ),
  },
  {
    q: "Faut-il un compte pour acheter ?",
    r: <>Non : une adresse e-mail suffit. C&apos;est là que le pack vous est envoyé, et elle vous permet d&apos;y accéder ensuite.</>,
  },
  {
    q: "Puis-je être remboursé ?",
    r: (
      <>
        Les formations du pack sont remboursables pendant une courte période, tant qu&apos;elles n&apos;ont pas été consommées
        au-delà d&apos;un certain seuil ; un produit téléchargé ne l&apos;est pas. Les modalités exactes sont dans nos{" "}
        <Link href="/cgu">conditions générales</Link>.
      </>
    ),
  },
];

const CHAMP =
  "w-full rounded-full bg-white px-4 py-3 text-sm text-[#0e1512] placeholder:text-[#8a968e] " +
  "shadow-[inset_0_0_0_1px_rgba(14,21,18,.1),inset_0_1px_0_#fff] outline-none transition-shadow " +
  "focus:shadow-[inset_0_0_0_1px_#006e2f,0_0_0_4px_rgba(0,110,47,.12)]";

export default function BundlePageClient({ bundle }: { bundle: Bundle }) {
  const router = useRouter();
  const fmtFCFA = usePrix();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kkiapay, setKkiapay] = useState<KkiapayInit | null>(null);
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [name, setName] = useState(session?.user?.name ?? "");
  const connecte = !!session?.user?.id;

  const racineRef = useRef<HTMLDivElement>(null);
  const enteteRef = useRef<HTMLDivElement>(null);
  const carteRef = useRef<HTMLElement>(null);
  useRevealFiche(racineRef, bundle.id);

  const n = bundle.items.length;
  const libelleArticles = `${n} article${n > 1 ? "s" : ""}`;

  /**
   * Achat d'un pack par le MÊME chemin que tout le reste : l'écran de paiement
   * unique, puis /payment/init. Le pack est développé côté serveur en ses
   * formations et produits — c'est lui qui décide du contenu et du prix.
   *
   * Avant, ce parcours avait sa propre route et partait sur la page hébergée
   * d'une passerelle retirée : deux tunnels d'achat, dont un que plus personne
   * ne corrigeait.
   */
  async function startPayment({ operator, phone }: { operator: string; phone?: string; hosted: boolean }) {
    if (!connecte && !email.trim()) {
      setError("Votre e-mail est nécessaire pour recevoir le pack.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/formations/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle.id,
          ...(connecte ? {} : { guestEmail: email.trim(), guestName: name.trim() || undefined }),
          paymentMethod: operator,
          phone,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Le paiement n'a pas pu démarrer.");
        setLoading(false);
        return;
      }
      if (json.data?.mode === "widget") {
        setKkiapay(json.data as KkiapayInit);
        return;
      }
      const url = json.data?.checkout_url ?? json.checkout_url;
      if (!url) {
        setError("Réponse de paiement invalide.");
        setLoading(false);
        return;
      }
      window.location.href = url;
    } catch {
      setError("Connexion impossible. Réessayez.");
      setLoading(false);
    }
  }

  function retour() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/explorer");
  }

  // Sur mobile, le paiement se choisit dans la carte : la barre y conduit.
  function allerALaCarte() {
    document.getElementById("achat")?.scrollIntoView({ behavior: mouvementReduit() ? "auto" : "smooth", block: "start" });
  }

  return (
    <div ref={racineRef} className={`nkf ${sora.variable} min-h-screen bg-[#f7f9fb] pb-24 lg:pb-0`}>
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-5 md:px-6 md:pb-20 md:pt-7">
        {/* Grille : en-tête pleine largeur, contenu à gauche, carte d'achat à
            droite (collante, deux rangées). Sur mobile : en-tête, visuel,
            contenu du pack, puis la carte — on voit ce qu'on achète avant de
            choisir son moyen de paiement. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_auto_1fr] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(0,1fr)_384px]">
          <div ref={enteteRef} className="lg:col-span-2">
            <EnTeteFiche
              fil={[{ label: "Explorer", href: "/explorer" }, { label: "Packs" }, { label: bundle.title }]}
              onRetour={retour}
              eyebrow={`Pack · ${libelleArticles}`}
              titre={bundle.title}
              // Pas de nombre d'achats : même règle que la fiche produit (demande fondateur).
              compteur={null}
              badges={
                bundle.savingsPct > 0 ? (
                  <span className="nkf-chip nkf-chip--green tabular-nums">
                    <Gift aria-hidden="true" />
                    −{bundle.savingsPct} % par rapport à l&apos;achat séparé
                  </span>
                ) : undefined
              }
              boutique={bundle.shop ? { nom: bundle.shop.name, href: `/${bundle.shop.slug}`, logoUrl: bundle.shop.logoUrl } : null}
            />
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            <VignetteFiche
              src={bundle.banner ?? bundle.thumbnail}
              alt={bundle.title}
              Icone={Gift}
              badges={
                <>
                  <span className="nkf-tag">
                    <Gift aria-hidden="true" />
                    Pack — {libelleArticles}
                  </span>
                  {bundle.savingsPct > 0 && <span className="nkf-tag nkf-tag--ink tabular-nums">−{bundle.savingsPct} %</span>}
                </>
              }
            />
          </div>

          <div className="grid gap-6 lg:col-start-1 lg:row-start-3 lg:self-start">
            {bundle.description && (
              <SectionFiche id="description" titre="Description" eyebrow="À propos de ce pack">
                <div className="nkf-prose">
                  <TiptapRenderer content={bundle.description} />
                </div>
              </SectionFiche>
            )}

            <SectionFiche id="contenu" titre={`Ce pack contient (${n})`} eyebrow="Inclus" meta={`Valeur séparée : ${fmtFCFA(bundle.itemsSum)}`}>
              <ul className="m-0 grid list-none gap-2.5 p-0">
                {bundle.items.map((it) => {
                  const Icone = it.kind === "formation" ? GraduationCap : Package;
                  const src = it.image ? (productImageSrc(it.image, 200) ?? it.image) : null;
                  // La description d'un produit est du HTML d'éditeur : on n'en
                  // garde que le texte pour l'extrait, jamais les balises.
                  const extrait = it.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null;
                  return (
                    <li key={`${it.kind}-${it.id}`}>
                      <Link href={it.kind === "formation" ? `/formation/${it.slug}` : `/produit/${it.slug}`} className="nkf-item group">
                        <span className="nkf-item__img" aria-hidden="true">
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt="" loading="lazy" decoding="async" />
                          ) : (
                            <Icone size={28} strokeWidth={1.25} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#006e2f]">
                            {it.kind === "formation" ? "Formation" : "Produit"}
                          </span>
                          {/* Pas de `block` à côté de line-clamp : les deux fixent display, et block l'emportait (extraits sur 40 lignes). */}
                          <span className="mt-0.5 line-clamp-1 text-[0.9375rem] font-bold tracking-tight text-[#0e1512] transition-colors group-hover:text-[#006e2f]">
                            {it.title}
                          </span>
                          {extrait && <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#5c6b62]">{extrait}</span>}
                        </span>
                        <span className="flex-shrink-0 text-right">
                          <span className="block text-sm font-extrabold tabular-nums text-[#0e1512]">{fmtFCFA(it.price)}</span>
                          <span className="block text-[10px] text-[#5c6b62]">valeur unitaire</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SectionFiche>

            <SectionFiche id="faq" titre="Questions fréquentes" eyebrow="Avant d'acheter">
              <FaqFiche items={FAQ_PACK} />
            </SectionFiche>
          </div>

          <aside ref={carteRef} className="lg:col-start-2 lg:row-start-2 lg:row-span-2" aria-label="Acheter ce pack">
            <div className="lg:sticky lg:top-24">
              <CarteAchat
                etiquette="Prix du pack"
                prix={bundle.priceXof}
                prixInitial={bundle.itemsSum > bundle.priceXof ? bundle.itemsSum : null}
                sousPrix={
                  bundle.savings > 0 ? (
                    <>
                      Vous économisez <strong className="tabular-nums text-[#006e2f]">{fmtFCFA(bundle.savings)}</strong> par rapport à
                      l&apos;achat séparé.
                    </>
                  ) : undefined
                }
                garanties={[
                  { Icone: CalendarCheck, contenu: "Accès immédiat après paiement" },
                  { Icone: InfinityIcon, contenu: `Accès à vie aux ${libelleArticles}` },
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
                boutique={bundle.shop ? { nom: bundle.shop.name, href: `/${bundle.shop.slug}` } : null}
                partage={bundle.title}
              >
                {!connecte && (
                  <div className="mt-5 grid gap-2">
                    <label htmlFor="pack-email" className="sr-only">
                      Votre e-mail
                    </label>
                    <input
                      id="pack-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre e-mail"
                      required
                      className={CHAMP}
                    />
                    <label htmlFor="pack-nom" className="sr-only">
                      Votre nom (facultatif)
                    </label>
                    <input
                      id="pack-nom"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom (facultatif)"
                      className={CHAMP}
                    />
                    <p className="text-[11px] text-[#5c6b62]">C&apos;est là que le pack sera envoyé.</p>
                  </div>
                )}

                {/* L'écran de paiement de la plateforme, identique à celui d'un
                    achat simple : pays, moyen, numéro, puis paiement. */}
                <div className="mt-5">
                  {kkiapay && (
                    // Passerelle à fenêtre : elle s'ouvre SUR notre page, l'acheteur
                    // ne part jamais ailleurs.
                    <KkiapayWidget
                      init={kkiapay}
                      onDelivered={() => { window.location.href = `/payment/return?ref=${encodeURIComponent(kkiapay.internalRef)}`; }}
                      onFailed={(m) => { setKkiapay(null); setError(m); setLoading(false); }}
                    />
                  )}
                  <UnifiedPaymentScreen
                    embedded
                    amount={bundle.priceXof}
                    buyerName={name.trim() || null}
                    merchantName={bundle.shop?.name ?? undefined}
                    submitting={loading}
                    onPay={(args) => { void startPayment(args); }}
                  />
                </div>

                {error && (
                  <p role="alert" className="mt-3 rounded-xl bg-[#fdecea] px-3 py-2 text-xs font-medium text-[#b42318]">
                    {error}
                  </p>
                )}
              </CarteAchat>
            </div>
          </aside>
        </div>
      </div>

      {/* Barre fixe (sous `lg`) : le paiement se choisit dans la carte, la
          barre y amène. */}
      <BarreAchatMobile
        prix={bundle.priceXof}
        prixInitial={bundle.itemsSum > bundle.priceXof ? bundle.itemsSum : null}
        libelle="Acheter le pack"
        Icone={ShoppingBag}
        onClick={allerALaCarte}
        apresRef={enteteRef}
        carteRef={carteRef}
      />
    </div>
  );
}
