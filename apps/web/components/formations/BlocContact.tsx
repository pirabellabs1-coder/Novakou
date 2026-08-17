// Bloc « Contactez-nous » d'une fiche produit.
//
// Placé APRÈS la description et AVANT les recommandations : c'est le moment où
// l'acheteur a fini de lire, hésite, et où une question sans réponse le fait
// partir. Le mettre après les recommandations reviendrait à l'offrir une fois
// qu'il a déjà cliqué ailleurs.
//
// N'affiche QUE ce que le vendeur a renseigné. Un bouton WhatsApp mort ou un
// e-mail vide inspire moins confiance que leur absence.
//
// Hiérarchie visuelle : UN SEUL bouton plein. Deux aplats de couleur côte à
// côte se neutralisent — l'œil ne sait plus lequel est l'action principale.
// WhatsApp est plein (canal le plus rapide), l'e-mail teinté, le formulaire
// en contour neutre.

import { Mail, MessageSquareText, MessagesSquare } from "lucide-react";

type Props = {
  contactEmail?: string | null;
  whatsapp?: string | null;
  /** Nom de la boutique, pour pré-remplir le message WhatsApp. */
  nomBoutique?: string | null;
  /** Titre du produit, pour que le vendeur sache de quoi on parle. */
  titreProduit?: string | null;
  themeColor?: string | null;
  /**
   * Le formulaire « Une question ? » (InquiryWidget) est-il monté sur la page ?
   * Si oui, on propose un bouton qui l'ouvre. C'est le SEUL canal qui aboutisse
   * quand la boutique n'a renseigné ni e-mail ni WhatsApp — sans lui, l'acheteur
   * arrivé en bas de page n'aurait aucun moyen de poser sa question.
   */
  chatDisponible?: boolean;
};

/** Numéro réduit aux chiffres : wa.me refuse espaces, tirets et « + ». */
function numeroWhatsapp(brut: string): string {
  return brut.replace(/\D/g, "");
}

/**
 * Teinte translucide d'une couleur de boutique. La couleur vient du vendeur :
 * si ce n'est pas un hex à 6 chiffres, on renvoie null et l'appelant retombe
 * sur un style neutre plutôt que d'écrire une valeur CSS invalide.
 */
function teinte(hex: string, alpha: string): string | null {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : null;
}

/** Classes communes : même hauteur, même rythme, cible tactile confortable. */
const BOUTON =
  "flex-1 inline-flex items-center justify-center gap-2.5 min-h-[52px] px-4 py-3 " +
  "rounded-xl text-sm font-bold transition-all duration-150 " +
  "hover:-translate-y-0.5 active:translate-y-0 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export function BlocContact({
  contactEmail,
  whatsapp,
  nomBoutique,
  titreProduit,
  themeColor,
  chatDisponible = false,
}: Props) {
  const wa = whatsapp?.trim() ? numeroWhatsapp(whatsapp) : "";
  const mail = contactEmail?.trim() ?? "";

  // Rien à proposer : on n'affiche pas un bloc vide qui ne ferait que pousser
  // les recommandations plus bas.
  if (!wa && !mail && !chatDisponible) return null;

  const couleur = themeColor || "#006e2f";
  const fondDoux = teinte(couleur, "14");
  const bordDoux = teinte(couleur, "33");
  const sujet = titreProduit ? `Question sur « ${titreProduit} »` : "Question sur un produit";
  const message = titreProduit
    ? `Bonjour${nomBoutique ? ` ${nomBoutique}` : ""}, j'ai une question sur « ${titreProduit} ».`
    : `Bonjour${nomBoutique ? ` ${nomBoutique}` : ""}, j'ai une question.`;

  return (
    <section className="mt-6 rounded-2xl border border-[#e3e8ea] bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span
          className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
          style={fondDoux ? { background: fondDoux, color: couleur } : { background: "#f1f5f4", color: "#006e2f" }}
          aria-hidden
        >
          <MessagesSquare size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] md:text-base font-extrabold text-[#191c1e]">
            Une question sur ce produit&nbsp;?
          </h2>
          <p className="text-[13px] text-[#5c647a] mt-0.5">
            Contactez-nous, nous répondons rapidement.
          </p>
        </div>
      </div>

      {/* Empilés sur mobile (pleine largeur = pouce), alignés et de largeur
          égale dès 640px. flex-1 garde l'équilibre quel que soit le nombre de
          canaux disponibles — de un à trois. */}
      <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
        {wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Poser une question sur WhatsApp"
            className={`${BOUTON} text-white shadow-sm hover:shadow-md focus-visible:ring-[#25D366]`}
            style={{ background: "#25D366" }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="flex-shrink-0">
              <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.5-.3z" />
              <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1112 20.2z" />
            </svg>
            <span className="flex flex-col items-start leading-tight">
              WhatsApp
              <span className="text-[11px] font-medium text-white/85">Réponse la plus rapide</span>
            </span>
          </a>
        )}

        {mail && (
          <a
            href={`mailto:${mail}?subject=${encodeURIComponent(sujet)}`}
            aria-label={`Envoyer un e-mail à ${mail}`}
            className={`${BOUTON} border`}
            style={
              fondDoux && bordDoux
                ? { background: fondDoux, borderColor: bordDoux, color: couleur }
                : { background: "#f1f5f4", borderColor: "#e3e8ea", color: "#006e2f" }
            }
          >
            <Mail size={18} className="flex-shrink-0" />
            <span className="flex flex-col items-start leading-tight">
              E-mail
              <span className="text-[11px] font-medium opacity-70">Ouvre votre messagerie</span>
            </span>
          </a>
        )}

        {chatDisponible && (
          <button
            type="button"
            // Le formulaire s'ouvre par un événement : ce bloc n'a pas à
            // connaître son implémentation, il se contente de le réveiller.
            onClick={() => window.dispatchEvent(new CustomEvent("novakou:ouvrir-chat"))}
            aria-label="Ouvrir le formulaire de message"
            className={`${BOUTON} bg-white border border-[#e3e8ea] text-[#191c1e] hover:bg-slate-50 hover:border-[#cfd8dc] focus-visible:ring-[#5c647a]`}
          >
            <MessageSquareText size={18} className="flex-shrink-0 text-[#5c647a]" />
            <span className="flex flex-col items-start leading-tight">
              Écrire un message
              <span className="text-[11px] font-medium text-[#5c647a]">Sans quitter la page</span>
            </span>
          </button>
        )}
      </div>

      {mail && (
        <p className="text-[12px] text-[#5c647a] mt-3.5 break-all">
          Ou écrivez-nous à{" "}
          <a href={`mailto:${mail}`} className="font-semibold underline underline-offset-2" style={{ color: couleur }}>
            {mail}
          </a>
        </p>
      )}
    </section>
  );
}
