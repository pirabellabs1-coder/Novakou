import { ArrowRight, Star } from "lucide-react";
import type { ShopOwner, ShopReview, ShopSocials } from "./types";
import { reseauxPublics, type ShopStats } from "./ShopHero";
import { dateLongue, nombre, note } from "./format";

/**
 * Sections éditoriales de la vitrine : à propos (+ carte contact) et avis.
 * Rythme large (64–96 px), texte en `max-w-prose`, cartes en verre.
 */

export function ShopAbout({
  owner,
  staticBase,
  socials,
}: {
  owner: ShopOwner;
  staticBase: string;
  socials?: ShopSocials;
}) {
  const bio = (owner.bio ?? "").trim();
  const reseaux = reseauxPublics(socials);
  if (!bio && reseaux.length === 0) return null;

  const carte = (
    <div className="nkb-bezel nkb-contact">
      <div className="nkb-contact__core nkb-core">
        <h3>Une question avant d&apos;acheter ?</h3>
        <p>{owner.name} répond directement, en français, dans les meilleurs délais.</p>
        {reseaux.length > 0 && (
          <ul className="nkb-contact__list">
            {reseaux.map(({ href, label, Icone }) => (
              <li key={label}>
                <a
                  href={href}
                  className="nkb-pill"
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                >
                  <Icone strokeWidth={1.6} aria-hidden="true" />
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <div>
          <a href={`${staticBase}/contact`} className="nkb-btn nkb-btn--primary">
            Nous écrire
            <span className="nkb-btn__ico" aria-hidden="true">
              <ArrowRight strokeWidth={2.2} />
            </span>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <section className="nkb-section nkb-section--tint" aria-labelledby="nkb-apropos">
      <div className="nkb-wrap">
        <div className="nkb-split">
          <div className="nkb-reveal">
            <span className="nkb-eyebrow">À propos</span>
            <h2 id="nkb-apropos" className="nkb-h2">
              {bio ? `L'univers de ${owner.name}` : `Contacter ${owner.name}`}
            </h2>
            {bio && <p className="nkb-lead">Qui est derrière cette boutique, et ce que vous y trouverez.</p>}
            {!bio && <div className="mt-6">{carte}</div>}
          </div>
          {bio && (
            <div className="flex flex-col gap-8">
              <p className="nkb-prose nkb-reveal">{bio}</p>
              <div className="nkb-reveal">{carte}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Etoiles({ n }: { n: number }) {
  return (
    <span className="nkb-stars" role="img" aria-label={`Note ${n} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} data-off={i > n ? "" : undefined} aria-hidden="true" />
      ))}
    </span>
  );
}

export function ShopReviews({ reviews, stats }: { reviews: ShopReview[]; stats: ShopStats }) {
  if (reviews.length === 0) return null;
  return (
    <section className="nkb-section" aria-labelledby="nkb-avis">
      <div className="nkb-wrap">
        <div className="nkb-reveal">
          <span className="nkb-eyebrow">Avis</span>
          <h2 id="nkb-avis" className="nkb-h2">
            Ce qu&apos;en disent les élèves
          </h2>
          {stats.avis > 0 && stats.note > 0 && (
            <p className="nkb-lead">
              <strong className="nkb-tabular text-[color:var(--nkb-ink)]">{note(stats.note)} / 5</strong> en moyenne sur{" "}
              <span className="nkb-tabular">{nombre(stats.avis)}</span> avis vérifiés d&apos;acheteurs.
            </p>
          )}
        </div>
        <ul className="nkb-quotes">
          {reviews.map((r) => (
            <li key={r.id} className="nkb-bezel nkb-quote nkb-reveal">
              <figure className="nkb-quote__core">
                <Etoiles n={r.rating} />
                <blockquote className="nkb-quote__text">{r.comment}</blockquote>
                <figcaption className="nkb-quote__who">
                  <strong>{r.author}</strong>
                  {r.itemTitle} · {dateLongue(r.date)}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
