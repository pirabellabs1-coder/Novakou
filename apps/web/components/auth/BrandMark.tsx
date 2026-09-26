import Link from "next/link";

/** Marque Novakou : monogramme + nom. Lien vers l'accueil. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`nkauth-brand ${className}`} aria-label="Novakou — retour à l’accueil">
      <span className="nkauth-brand-mark" aria-hidden="true">
        NK
      </span>
      <span className="nkauth-brand-name">Novakou</span>
    </Link>
  );
}
