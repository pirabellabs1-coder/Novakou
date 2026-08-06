"use client";

import { useDeviseAffichage } from "@/components/formations/SelecteurDevise";
import { formaterPrix } from "@/lib/currency/rates";

/**
 * LE seul endroit qui écrit un prix.
 *
 * POURQUOI CE COMPOSANT EXISTE
 * Chaque écran reformatait son prix dans son coin, avec « FCFA » écrit en dur
 * à côté. Résultat : brancher la conversion demandait de les retrouver un par
 * un, et il en restait toujours. Une même page a affiché « 48 000 GNF » en
 * haut et « 2 000 FCFA » plus bas — plus déroutant qu'une page entièrement en
 * FCFA, parce que l'acheteur ne sait plus lequel des deux le concerne.
 *
 * Passer par ici rend cet oubli IMPOSSIBLE : il n'y a plus de devise à écrire
 * à la main.
 *
 * Le prix STOCKÉ reste en FCFA. Seule sa lecture suit le pays choisi, et le
 * vendeur touche toujours le montant qu'il a fixé.
 */
export function Prix({
  fcfa,
  gratuitSi,
  className,
}: {
  /** Montant en FCFA — la seule devise de vérité. */
  fcfa: number;
  /** Affiche « Gratuit » plutôt que « 0 ». */
  gratuitSi?: boolean;
  className?: string;
}) {
  const devise = useDeviseAffichage();
  const estGratuit = gratuitSi ?? fcfa === 0;
  return <span className={className}>{estGratuit ? "Gratuit" : formaterPrix(fcfa, devise)}</span>;
}

/**
 * Variante non-JSX, pour les rares endroits qui ont besoin de la chaîne
 * elle-même (attribut `title`, texte d'un bouton, message construit).
 * À n'utiliser QUE dans un composant client — c'est un crochet.
 */
export function usePrix() {
  const devise = useDeviseAffichage();
  return (fcfa: number) => formaterPrix(fcfa, devise);
}
