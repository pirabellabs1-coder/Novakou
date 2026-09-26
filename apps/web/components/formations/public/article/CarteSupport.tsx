import { AtSign, Mail } from "lucide-react";
import { BoutonVerre } from "../BoutonVerre";

/**
 * Bandeau « Pas trouvé votre réponse ? » du centre d'aide — même contenu
 * que celui de l'index (CentreAide), en Server Component pour les pages
 * catégorie et article.
 */
export function CarteSupport() {
  return (
    <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
      <div className="nkp-cta nkp-cta--compact">
        <span className="nkp-tag nkp-tag--dark">Support</span>
        <h2 className="!text-[1.7rem]">Pas trouvé votre réponse ?</h2>
        <p>
          Notre équipe support répond en moins de 5 minutes en chat, sous 24 h par email. Disponible du lundi au
          vendredi, 8h – 19h GMT.
        </p>
        <div className="nkp-actions">
          <BoutonVerre href="/contact" variante="white" fleche>
            <Mail size={16} strokeWidth={2} aria-hidden="true" />
            Envoyer un message
          </BoutonVerre>
          <BoutonVerre href="mailto:support@novakou.com" variante="white">
            <AtSign size={16} strokeWidth={2} aria-hidden="true" />
            support@novakou.com
          </BoutonVerre>
        </div>
      </div>
    </div>
  );
}
