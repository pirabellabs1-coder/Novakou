import Link from "next/link";

export type EtapeAriane = { label: string; href?: string };

/**
 * Fil d'Ariane visible : liste ordonnée, dernier élément = page courante
 * (aria-current, tronqué sur une ligne). Reflète le BreadcrumbList JSON-LD
 * de la page, qui reste la source pour les moteurs.
 */
export function FilAriane({ etapes }: { etapes: EtapeAriane[] }) {
  return (
    <nav className="nka-ariane" aria-label="Fil d'Ariane">
      <ol>
        {etapes.map((e, i) => {
          const derniere = i === etapes.length - 1;
          return (
            <li key={`${i}-${e.label}`}>
              {derniere || !e.href ? (
                <span aria-current={derniere ? "page" : undefined} title={derniere ? e.label : undefined}>
                  {e.label}
                </span>
              ) : (
                <Link href={e.href}>{e.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
