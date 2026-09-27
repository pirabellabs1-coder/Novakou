// Encadrés et blocs partagés des anciens guides écrits à la main.
//
// Chacun des 17 guides redéfinissait ses propres TipBox / WarnBox / ProTip /
// SectionHeading / MockupFrame avec des styles en ligne (constantes locales
// `S`, `SH`, `C`). Tout est rassemblé ici, dans la même langue visuelle que
// GuideArticleLayout : encadrés `nka-note`, sections numérotées `nka-sec`,
// chiffres `nka-chiffre`, tokens de public.css / article.css.
//
// Aucun texte n'est ajouté par ces composants : les pictogrammes sont
// vectoriels et `aria-hidden`, les libellés (« Astuce », « Attention »…)
// ne s'affichent que si le guide en passe un explicitement.

import type { ReactNode } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Rocket,
  type LucideIcon,
} from "lucide-react";

/* ── Titres de section ─────────────────────────────────────── */

/**
 * Section numérotée du corps : `<section id>` (cible du sommaire et des
 * ancres) + titre. `n` est décoratif ; `apres` reçoit une étiquette posée à
 * droite du titre (durée de lecture du chapitre, par exemple).
 */
export function SectionGuide({
  id,
  n,
  titre,
  apres,
  children,
}: {
  id: string;
  n?: string;
  titre: ReactNode;
  apres?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="nka-sec" aria-labelledby={`${id}-titre`}>
      <div className="nka-sec__tete">
        <h2 id={`${id}-titre`}>
          {n && (
            <span className="nka-sec__n" aria-hidden="true">
              {n}
            </span>
          )}
          <span>{titre}</span>
        </h2>
        {apres}
      </div>
      {children}
    </section>
  );
}

/** Étiquette sobre à droite d'un titre (durée du chapitre, état). */
export function EtiquetteGuide({ children, actif = false }: { children: ReactNode; actif?: boolean }) {
  return <span className={`nka-badge${actif ? " nka-badge--on" : ""}`}>{children}</span>;
}

/* ── Encadrés ──────────────────────────────────────────────── */

type Variante = "info" | "succes" | "attention" | "astuce" | "pro";

const PICTOS: Record<Variante, { icone: LucideIcon; nom: string }> = {
  info: { icone: Info, nom: "Information" },
  succes: { icone: CheckCircle2, nom: "À retenir" },
  attention: { icone: AlertTriangle, nom: "Attention" },
  astuce: { icone: Lightbulb, nom: "Astuce" },
  pro: { icone: Rocket, nom: "Conseil de pro" },
};

const CLASSES: Record<Variante, string> = {
  info: "nka-note",
  succes: "nka-note nka-note--success",
  attention: "nka-note nka-note--warning",
  astuce: "nka-note nka-note--tip",
  pro: "nka-note nka-note--pro",
};

function Encadre({ variante, titre, children }: { variante: Variante; titre?: string; children: ReactNode }) {
  const { icone: Icone, nom } = PICTOS[variante];
  return (
    <div className={CLASSES[variante]} role="note" aria-label={titre ?? nom}>
      <span className="nka-note__ic" aria-hidden="true">
        <Icone strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        {titre && <p className="nka-note__t">{titre}</p>}
        <div className="nka-note__c">{children}</div>
      </div>
    </div>
  );
}

/** Encadré vert : bon à savoir. Remplace les anciens `TipBox`. */
export function Astuce({ titre, children }: { titre?: string; children: ReactNode }) {
  return (
    <Encadre variante="astuce" titre={titre}>
      {children}
    </Encadre>
  );
}

/** Encadré ambre : piège à éviter. Remplace `WarnBox` / `WarningBox`. */
export function Attention({ titre, children }: { titre?: string; children: ReactNode }) {
  return (
    <Encadre variante="attention" titre={titre}>
      {children}
    </Encadre>
  );
}

/** Encadré bleu-gris : conseil avancé. Remplace `ProTip`. */
export function ProAstuce({ titre, children }: { titre?: string; children: ReactNode }) {
  return (
    <Encadre variante="pro" titre={titre}>
      {children}
    </Encadre>
  );
}

/** Encadré neutre : note, mise en contexte. */
export function NoteGuide({ titre, children }: { titre?: string; children: ReactNode }) {
  return (
    <Encadre variante="info" titre={titre}>
      {children}
    </Encadre>
  );
}

/* ── Étapes ────────────────────────────────────────────────── */

/**
 * Étape d'un mode opératoire. `libelle` porte le rang en clair quand le
 * guide l'affichait (« Étape 3 ») ; sinon le numéro reste décoratif dans la
 * pastille. `picto` (emoji du guide d'origine) est du contenu : conservé.
 */
export function Etape({
  n,
  libelle,
  titre,
  picto,
  kpi,
  children,
}: {
  n: number;
  libelle?: ReactNode;
  titre?: ReactNode;
  picto?: ReactNode;
  kpi?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="nka-etape">
      <span className="nka-etape__n" aria-hidden={picto ? undefined : "true"}>
        {picto ?? n}
      </span>
      <div className="nka-etape__c">
        {libelle && <p className="nka-etape__lbl">{libelle}</p>}
        {titre && <p className="nka-etape__t">{titre}</p>}
        {children}
        {kpi && <p className="nka-etape__kpi">{kpi}</p>}
      </div>
    </div>
  );
}

/** Suite d'étapes : trait de liaison vertical entre les pastilles. */
export function Etapes({ children }: { children: ReactNode }) {
  return <div className="nka-etapes-l">{children}</div>;
}

/* ── Chiffres ──────────────────────────────────────────────── */

/** Grille de chiffres clés (2 à 4). Remplace `StatBox` et les grilles maison. */
export function Chiffres({
  items,
  source,
}: {
  items: Array<{ valeur: ReactNode; libelle: ReactNode }>;
  /** Mention de source sous la grille (texte du guide d'origine). */
  source?: ReactNode;
}) {
  return (
    <>
      <ul className="nka-chiffres">
        {items.map((c, i) => (
          <li key={i} className="nka-chiffre">
            <b>{c.valeur}</b>
            <span>{c.libelle}</span>
          </li>
        ))}
      </ul>
      {source && <p className="nka-source">{source}</p>}
    </>
  );
}

/* ── Maquettes d'écran ─────────────────────────────────────── */

/**
 * Cadre « capture d'écran » : double-bezel, barre de titre sobre, corps
 * blanc. Remplace `MockupFrame`, `MockupBox` et `Capture`. `legende` rend
 * une `<figcaption>` — les guides qui légendaient leur capture gardent
 * leur texte.
 */
export function Maquette({
  titre,
  legende,
  plein = false,
  children,
}: {
  titre?: ReactNode;
  legende?: ReactNode;
  /** Contenu collé aux bords du cadre (tableau pleine largeur). */
  plein?: boolean;
  children: ReactNode;
}) {
  const cadre = (
    <div className="nkp-bezel nka-maq__bz">
      <div className="nka-maq__in">
        {titre && (
          <div className="nka-maq__tete">
            <span className="nka-maq__pts" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="nka-maq__t">{titre}</span>
          </div>
        )}
        <div className={`nka-maq__corps${plein ? " nka-maq__corps--plein" : ""}`}>{children}</div>
      </div>
    </div>
  );

  if (!legende) return <div className="nka-maq">{cadre}</div>;
  return (
    <figure className="nka-maq">
      {cadre}
      <figcaption>{legende}</figcaption>
    </figure>
  );
}

/** Image légendée pleine largeur dans le corps (même rendu que `GImage`). */
export function FigureGuide({
  src,
  alt,
  legende,
  priorite = false,
}: {
  src: string;
  alt: string;
  legende?: ReactNode;
  priorite?: boolean;
}) {
  return (
    <figure className="nka-fig">
      <div className="nkp-bezel">
        <div className="nka-fig__img">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 760px) 100vw, 680px"
            priority={priorite}
          />
        </div>
      </div>
      {legende && <figcaption>{legende}</figcaption>}
    </figure>
  );
}

/* ── Petits éléments d'interface dans les maquettes ────────── */

/** Faux bouton d'une maquette : décoratif, jamais focusable. */
export function FauxBouton({ children, fantome = false }: { children: ReactNode; fantome?: boolean }) {
  return <span className={`nka-fbtn${fantome ? " nka-fbtn--ghost" : ""}`}>{children}</span>;
}

/** Ligne clé / valeur d'une maquette (réglage, champ). */
export function LigneMaquette({ cle, valeur }: { cle: ReactNode; valeur: ReactNode }) {
  return (
    <p className="nka-mline">
      <span>{cle}</span>
      <b>{valeur}</b>
    </p>
  );
}

/**
 * Liste de paliers : une étiquette ou un intitulé, une valeur à droite, une
 * explication. Sert aux fourchettes de revenus, aux semaines d'un plan, aux
 * niveaux d'une progression. Aucun numéro n'est ajouté : seuls les libellés
 * du guide s'affichent.
 */
export function Paliers({
  items,
}: {
  items: Array<{ etiquette?: ReactNode; titre?: ReactNode; valeur?: ReactNode; texte: ReactNode }>;
}) {
  return (
    <ul className="nka-paliers">
      {items.map((p, i) => (
        <li key={i}>
          {p.etiquette && <span className="nka-palier__e">{p.etiquette}</span>}
          <div className="nka-palier__c">
            {(p.titre || p.valeur) && (
              <p className="nka-palier__t">
                {p.titre && <span>{p.titre}</span>}
                {p.valeur && <b>{p.valeur}</b>}
              </p>
            )}
            <p className="nka-palier__d">{p.texte}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Répartition en barres (part des paiements, du trafic…). Une seule teinte :
 * la couleur ne porte aucune information, la valeur est écrite à côté du
 * libellé — lisible aussi sans distinguer les couleurs.
 */
export function Barres({ items }: { items: Array<{ libelle: ReactNode; valeur: ReactNode; part: number }> }) {
  return (
    <ul className="nka-barres">
      {items.map((b, i) => (
        <li key={i}>
          <p className="nka-barres__t">
            <span>{b.libelle}</span>
            <b>{b.valeur}</b>
          </p>
          <span className="nka-barres__p" aria-hidden="true">
            <i style={{ width: `${Math.max(0, Math.min(100, b.part))}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Grille sobre de cartes dans le corps (points clés, comparatifs). */
export function CartesGuide({ items }: { items: Array<{ titre: ReactNode; texte: ReactNode }> }) {
  return (
    <div className="nka-cartes">
      {items.map((c, i) => (
        <div key={i} className="nka-carte">
          <p className="nka-carte__t">{c.titre}</p>
          <p className="nka-carte__d">{c.texte}</p>
        </div>
      ))}
    </div>
  );
}
