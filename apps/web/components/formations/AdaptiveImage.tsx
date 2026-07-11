/**
 * Image de carte qui s'adapte à TOUTE taille/ratio sans être rognée :
 *   - un calque flouté (object-cover) remplit joliment le cadre,
 *   - l'image réelle est affichée EN ENTIER par-dessus (object-contain).
 *
 * À placer dans un conteneur `relative` (ex. aspect-square). Les badges
 * positionnés en absolute APRÈS ce composant restent au-dessus (ordre du DOM,
 * pas de z-index sur les images).
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
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-contain ${imgClassName ?? ""}`}
      />
    </>
  );
}
