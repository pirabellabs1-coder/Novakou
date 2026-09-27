// Coque des anciens guides écrits à la main.
//
// Reprend exactement l'enveloppe de GuideArticleLayout (coque publique
// `.nkpub`, en-tête `EnTetePage` aligné à gauche + fil d'Ariane, couverture,
// chiffres clés, sommaire collant `SommaireArticle`, colonne de lecture
// `.nka-prose`) sans toucher au JSON-LD : chaque guide garde ses propres
// blocs `application/ld+json`, que le workflow SEO vérifie.
//
// Les 17 guides concernés ont chacun leur propre appel à l'action et leur
// propre liste de guides complémentaires, rédigés à la main. On ne réécrit
// pas ces textes : `fin` les reçoit, restylés via `CarteActionGuide` et
// `SuiteGuides`.

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { CoquePublique } from "../CoquePublique";
import { EnTetePage } from "../EnTetePage";
import { BoutonVerre } from "../BoutonVerre";
import { FilAriane, type EtapeAriane } from "./FilAriane";
import { SommaireArticle, type EntreeSommaire } from "./SommaireArticle";
import "./article.css";

/** Numéro affiché dans le sommaire et les titres de section (« 01 »). */
export const numeroGuide = (i: number) => String(i + 1).padStart(2, "0");

export type InfoEntete = { icone?: LucideIcon; texte: ReactNode };

export function CoqueGuide({
  ariane,
  eyebrow,
  titre,
  sousTitre,
  auteur,
  infos = [],
  couverture,
  chiffres,
  sommaire,
  titreSommaire = "Sommaire",
  uniteSommaire = "sections",
  children,
  apres,
  fin,
}: {
  ariane: EtapeAriane[];
  eyebrow: string;
  titre: ReactNode;
  sousTitre?: ReactNode;
  /** Bloc auteur de l'en-tête (avatar + nom + précision). */
  auteur?: { nom: ReactNode; note?: ReactNode; initiale?: string };
  /** Informations de lecture (durée, date de publication…). */
  infos?: InfoEntete[];
  /** Couverture large sous l'en-tête. */
  couverture?: { src: string; alt: string; legende?: ReactNode };
  /** Chiffres clés sous la couverture. */
  chiffres?: Array<{ valeur: ReactNode; libelle: ReactNode }>;
  /** Entrées du sommaire collant. Absent → colonne de lecture seule. */
  sommaire?: EntreeSommaire[];
  /** Intitulé du sommaire, quand le guide en avait un à lui. */
  titreSommaire?: string;
  uniteSommaire?: string;
  /** Sections du corps, rendues dans `.nka-prose`. */
  children: ReactNode;
  /** Blocs hors prose en fin de colonne (FAQ). */
  apres?: ReactNode;
  /** Blocs pleine largeur après l'article (appel à l'action, guides liés). */
  fin?: ReactNode;
}) {
  const aEntete = Boolean(auteur) || infos.length > 0;

  return (
    <CoquePublique>
      <article>
        <EnTetePage
          align="left"
          avant={<FilAriane etapes={ariane} />}
          eyebrow={eyebrow}
          titre={titre}
          sousTitre={sousTitre}
          infos={
            aEntete ? (
              <span className="nka-infos">
                {auteur && (
                  <span className="nka-auteur">
                    <span className="nka-auteur__av" aria-hidden="true">
                      {auteur.initiale ?? "N"}
                    </span>
                    <span>
                      <b>{auteur.nom}</b>
                      {auteur.note && <small>{auteur.note}</small>}
                    </span>
                  </span>
                )}
                {auteur && infos.length > 0 && <span className="nka-infos__sep" aria-hidden="true" />}
                {infos.map((info, i) => {
                  const Icone = info.icone;
                  return (
                    <span key={i}>
                      {Icone && <Icone strokeWidth={1.9} aria-hidden="true" />}
                      {info.texte}
                    </span>
                  );
                })}
              </span>
            ) : undefined
          }
        />

        {(couverture || (chiffres && chiffres.length > 0)) && (
          <div className="nkp-wrap">
            {couverture && (
              <figure className="nka-couv">
                <div className="nkp-bezel nkp-bezel--xl nkp-bezel--float">
                  <div className="nka-couv__img">
                    <Image
                      src={couverture.src}
                      alt={couverture.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1080px) 100vw, 1000px"
                      priority
                    />
                  </div>
                </div>
                {couverture.legende && <figcaption>{couverture.legende}</figcaption>}
              </figure>
            )}
            {chiffres && chiffres.length > 0 && (
              <ul className="nka-chiffres" aria-label="Chiffres clés">
                {chiffres.map((c, i) => (
                  <li key={i} className="nka-chiffre">
                    <b>{c.valeur}</b>
                    <span>{c.libelle}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="nkp-wrap">
          <div className={`nka-layout${sommaire && sommaire.length > 1 ? "" : " nka-layout--seul"}`}>
            {sommaire && sommaire.length > 1 && (
              <SommaireArticle
                items={sommaire}
                titre={titreSommaire}
                unite={uniteSommaire}
                bas={
                  <Link href="/guides">
                    <ArrowLeft strokeWidth={2} aria-hidden="true" />
                    Tous les guides
                  </Link>
                }
              />
            )}
            <div className="nka-corps">
              <div className="nka-prose">{children}</div>
              {apres}
            </div>
          </div>
        </div>
      </article>
      {fin}
    </CoquePublique>
  );
}

/**
 * Appel à l'action de fin de guide : carte vert nuit, même rendu que le
 * gabarit v2. Le texte reste celui du guide.
 */
export function CarteActionGuide({
  etiquette,
  titre,
  children,
  action,
  actions,
  note,
}: {
  etiquette?: ReactNode;
  titre: ReactNode;
  children?: ReactNode;
  /** Action unique. Ignorée si `actions` est fourni. */
  action?: { href: string; libelle: ReactNode };
  /** Plusieurs actions : la première est mise en avant. */
  actions?: Array<{ href: string; libelle: ReactNode }>;
  note?: ReactNode;
}) {
  const liste = actions && actions.length > 0 ? actions : action ? [action] : [];
  return (
    <section className="nkp-wrap nka-fin" aria-labelledby="guide-cta-titre">
      <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
        <div className="nkp-cta nkp-cta--compact">
          {etiquette && <span className="nkp-tag nkp-tag--dark">{etiquette}</span>}
          <h2 id="guide-cta-titre">{titre}</h2>
          {children}
          {liste.length > 0 && (
            <div className="nkp-actions">
              {liste.map((a, i) => (
                <BoutonVerre
                  key={a.href}
                  href={a.href}
                  variante={i === 0 ? "white" : "glass"}
                  taille="lg"
                  fleche={i === 0}
                >
                  {a.libelle}
                </BoutonVerre>
              ))}
            </div>
          )}
          {note && <small>{note}</small>}
        </div>
      </div>
    </section>
  );
}

export type LienSuite = { href: string; titre: ReactNode; resume?: ReactNode; etiquette?: ReactNode };

/**
 * « À lire ensuite » : les guides complémentaires choisis par le guide,
 * en cartes cliquables. Trois liens → rail de trois colonnes ; nombre pair
 * → deux colonnes, pour ne jamais laisser une carte orpheline.
 */
export function SuiteGuides({
  etiquette,
  titre,
  intro,
  liens,
  retour = true,
}: {
  /** Étiquette au-dessus du titre. Omise par défaut : la plupart de ces
   *  guides ont déjà leur propre intitulé, qu'on ne double pas. */
  etiquette?: ReactNode;
  titre: ReactNode;
  intro?: ReactNode;
  liens: LienSuite[];
  /** Bouton « Retour à tous les guides » sous la grille. */
  retour?: boolean;
}) {
  const grille = liens.length % 2 === 0 ? "nkp-grid-2" : "nkp-rail";
  return (
    <section className="nkp-section nkp-section--compact nkp-section--tint" aria-labelledby="guides-lies-titre">
      <div className="nkp-wrap">
        <div className="nkp-head nkp-head--split nkp-reveal">
          <div>
            {etiquette && <span className="nkp-tag">{etiquette}</span>}
            <h2 id="guides-lies-titre">{titre}</h2>
          </div>
          {intro && <p>{intro}</p>}
        </div>
        <ul className={`${grille} m-0 list-none p-0`}>
          {liens.map((g) => (
            <li key={g.href} className="nkp-reveal">
              <article className="nkp-card nkp-card--hover nka-lie h-full">
                <div className="nkp-card__core">
                  {g.etiquette && <p className="nka-lie__meta">{g.etiquette}</p>}
                  <h3>
                    <Link href={g.href} className="nkp-stretch transition-colors hover:text-[#006e2f]">
                      {g.titre}
                    </Link>
                  </h3>
                  {g.resume && <p className="nkp-card__desc">{g.resume}</p>}
                  <span className="nkp-link" aria-hidden="true">
                    Lire le guide
                    <ArrowRight strokeWidth={2.2} />
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
        {retour && (
          <div className="nkp-center-btn">
            <BoutonVerre href="/guides" fleche>
              Retour à tous les guides
            </BoutonVerre>
          </div>
        )}
      </div>
    </section>
  );
}
