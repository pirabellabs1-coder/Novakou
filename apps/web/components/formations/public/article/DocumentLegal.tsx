import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, FileText } from "lucide-react";
import { CoquePublique } from "../CoquePublique";
import { EnTetePage } from "../EnTetePage";
import { SommaireArticle } from "./SommaireArticle";
import "./article.css";

export type SectionLegale = {
  titre: string;
  contenu: ReactNode;
  /** Ancre ; par défaut `s{n}` (déjà en usage sur /confidentialite). */
  id?: string;
  /** Étiquette à droite du titre (ex. « Obligatoires »). */
  badge?: ReactNode;
};

/** Documents légaux publics, pour la navigation croisée sous le sommaire. */
const DOCUMENTS = [
  { href: "/cgu", label: "Conditions générales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

const numero = (i: number) => String(i + 1).padStart(2, "0");

/**
 * Gabarit des documents légaux : en-tête commun, sommaire collant, sections
 * numérotées en prose (≈ 68 caractères). Présentation uniquement — le texte
 * juridique arrive tel quel par `intro`, `sections[].contenu` et `pied` ;
 * la numérotation suit l'ordre des sections, comme dans les documents.
 */
export function DocumentLegal({
  chemin,
  eyebrow,
  titre,
  miseAJour,
  sousTitre,
  intro,
  avant,
  sections,
  pied,
}: {
  /** Chemin de la page, pour la marquer dans la liste des documents. */
  chemin: string;
  eyebrow: string;
  titre: string;
  /** Date telle qu'affichée dans le document (« 12 juillet 2026 »). */
  miseAJour: string;
  sousTitre?: ReactNode;
  /** Paragraphe d'ouverture, avant l'article 1. */
  intro?: ReactNode;
  /** Bloc placé avant les sections (ex. « En bref »). */
  avant?: ReactNode;
  sections: SectionLegale[];
  /** Renvois de fin (« Voir aussi… »). */
  pied?: ReactNode;
}) {
  const entrees = sections.map((s, i) => ({ id: s.id ?? `s${i + 1}`, label: s.titre, n: numero(i) }));
  const autres = DOCUMENTS.filter((d) => d.href !== chemin);

  return (
    <CoquePublique>
      <EnTetePage
        align="left"
        eyebrow={eyebrow}
        titre={titre}
        sousTitre={sousTitre}
        infos={
          <span className="nka-infos">
            <span>
              <CalendarDays strokeWidth={1.9} aria-hidden="true" />
              Dernière mise à jour : {miseAJour}
            </span>
            <span>
              <FileText strokeWidth={1.9} aria-hidden="true" />
              {sections.length} sections
            </span>
          </span>
        }
      />

      <div className="nkp-wrap">
        <div className="nka-layout">
          <SommaireArticle
            items={entrees}
            bas={
              <>
                <p className="nka-toc__t">Autres documents</p>
                {autres.map((d) => (
                  <Link key={d.href} href={d.href}>
                    <FileText strokeWidth={1.9} aria-hidden="true" />
                    {d.label}
                  </Link>
                ))}
              </>
            }
          />

          <article className="nka-corps nka-prose">
            {intro && <div className="nka-chapo">{intro}</div>}
            {avant}
            {sections.map((s, i) => {
              const { id } = entrees[i];
              return (
                <section key={id} id={id} className="nka-sec" aria-labelledby={`${id}-titre`}>
                  <div className="nka-sec__tete">
                    <h2 id={`${id}-titre`}>
                      <span className="nka-sec__n">{numero(i)}</span>
                      <span>{s.titre}</span>
                    </h2>
                    {s.badge}
                  </div>
                  {s.contenu}
                </section>
              );
            })}
            {pied && <footer className="nka-pied">{pied}</footer>}
          </article>
        </div>
      </div>
    </CoquePublique>
  );
}
