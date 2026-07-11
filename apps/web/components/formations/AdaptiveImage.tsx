/**
 * Image de carte qui s'adapte à TOUTE taille/ratio sans être rognée
 * (`object-contain`). À placer dans un conteneur `relative` au fond neutre
 * (ex. `aspect-square bg-slate-100`). Les badges positionnés en absolute
 * APRÈS ce composant restent au-dessus (ordre du DOM, pas de z-index).
 *
 * ⚠️ PERFORMANCE : ce composant est rendu N fois par page (une par carte).
 * Il NE DOIT PAS utiliser de filtre CSS coûteux (blur…) : un `blur-2xl` par
 * carte × 12+ cartes = tempête de recompositions GPU → la page « vibre » /
 * rame au chargement et au scroll sur mobile Android. Le fond du conteneur
 * (bg-slate-100) suffit pour les rares images non carrées (léger cadre neutre).
 */
export default function AdaptiveImage({
  src,
  alt,
  imgClassName,
}: {
  src: string;
  alt: string;
  imgClassName?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`absolute inset-0 w-full h-full object-contain ${imgClassName ?? ""}`}
    />
  );
}
