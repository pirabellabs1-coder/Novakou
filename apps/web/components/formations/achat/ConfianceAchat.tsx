import { CreditCard, Smartphone, type LucideIcon } from "lucide-react";

export interface GarantieAchat {
  Icone: LucideIcon;
  texte: string;
}

/**
 * Bloc de réassurance du récapitulatif : garanties (textes fournis par la
 * page, jamais inventés ici) et familles de moyens de paiement.
 *
 * Volontairement AUCUN nom d'opérateur : une liste figée (Orange, Wave…)
 * annonçait à un acheteur un moyen que son pays n'offre pas, juste à côté
 * de l'écran de paiement qui montre, lui, les moyens réellement disponibles.
 * On n'affiche donc que les familles, « selon votre pays ».
 */
export function ConfianceAchat({
  garanties,
  moyens = true,
  className = "",
}: {
  garanties: GarantieAchat[];
  moyens?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {garanties.length > 0 && (
        <ul className="nka-garanties">
          {garanties.map(({ Icone, texte }) => (
            <li key={texte}>
              <Icone aria-hidden="true" />
              <span>{texte}</span>
            </li>
          ))}
        </ul>
      )}
      {moyens && (
        <div className={garanties.length > 0 ? "mt-4 border-t border-[#e6ece8] pt-4" : ""}>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5c6b62]">Moyens de paiement, selon votre pays</p>
          <div className="nka-pay mt-2.5">
            <span className="nka-pay__pill">
              <Smartphone aria-hidden="true" />
              Mobile Money
            </span>
            <span className="nka-pay__pill">
              <CreditCard aria-hidden="true" />
              Carte bancaire
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
