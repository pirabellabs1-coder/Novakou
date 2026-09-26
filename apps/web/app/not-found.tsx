import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Compass, LifeBuoy, Mail, Search } from "lucide-react";
import { PageEtat } from "@/components/formations/public/PageEtat";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";

const PISTES: { href: string; titre: string; desc: string; icone: LucideIcon }[] = [
  { href: "/explorer", titre: "Marketplace", desc: "Formations et produits numériques en vente.", icone: Compass },
  { href: "/aide", titre: "Centre d'aide", desc: "Réponses sur les paiements, la vente, le compte.", icone: LifeBuoy },
  { href: "/guides", titre: "Guides gratuits", desc: "Créer, vendre et automatiser depuis l'Afrique.", icone: BookOpen },
  { href: "/contact", titre: "Contact", desc: "Notre équipe vous répond sous 24 h.", icone: Mail },
];

/*
 * 404 racine — rendue hors du groupe (formations), donc sans barre de
 * navigation : PageEtat fournit marque et pied. La recherche est un simple
 * formulaire GET vers la marketplace (?q=), utilisable sans JavaScript.
 */
export default function NotFound() {
  return (
    <PageEtat
      pied={
        <>
          © 2026 Novakou · <Link href="/mentions-legales">Mentions légales</Link>
        </>
      }
    >
      <EnTetePage
        eyebrow="Erreur 404"
        titre={
          <>
            Cette page est <em>introuvable</em>
          </>
        }
        sousTitre="La page que vous recherchez n'existe pas ou a été déplacée. Cherchez ce qu'il vous faut, ou repartez d'un endroit sûr."
        actions={
          <>
            <BoutonVerre href="/" variante="primary" taille="lg" fleche>
              Retour à l&apos;accueil
            </BoutonVerre>
            <BoutonVerre href="/explorer" taille="lg">
              Explorer la marketplace
            </BoutonVerre>
          </>
        }
      >
        <form action="/explorer" method="get" role="search" className="nkp-search mx-auto max-w-xl">
          <label htmlFor="recherche-404" className="sr-only">
            Rechercher une formation ou un produit
          </label>
          <Search strokeWidth={1.75} aria-hidden="true" />
          <input id="recherche-404" type="search" name="q" placeholder="Formation, e-book, mentor…" autoComplete="off" enterKeyHint="search" />
        </form>
      </EnTetePage>

      <nav className="nkp-wrap !pb-12" aria-label="Pages utiles">
        <ul className="nkp-grid-4 nkp-grid-2--sm m-0 list-none p-0">
          {PISTES.map(({ href, titre, desc, icone: Icone }) => (
            <li key={href}>
              <div className="nkp-card nkp-card--hover h-full">
                <div className="nkp-card__core">
                  <span className="nkp-ic nkp-ic--sm mb-3" aria-hidden="true">
                    <Icone strokeWidth={1.9} />
                  </span>
                  <Link href={href} className="nkp-stretch text-[.98rem] font-semibold transition-colors hover:text-[#006e2f]">
                    {titre}
                  </Link>
                  <p className="mt-1 text-[.82rem] leading-snug text-[#5c6b62]">{desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </PageEtat>
  );
}
