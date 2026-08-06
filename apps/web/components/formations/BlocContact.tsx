// Bloc « Contactez-nous » d'une fiche produit.
//
// Placé APRÈS la description et AVANT les recommandations : c'est le moment où
// l'acheteur a fini de lire, hésite, et où une question sans réponse le fait
// partir. Le mettre après les recommandations reviendrait à l'offrir une fois
// qu'il a déjà cliqué ailleurs.
//
// N'affiche QUE ce que le vendeur a renseigné. Un bouton WhatsApp mort ou un
// e-mail vide inspire moins confiance que leur absence.

type Props = {
  contactEmail?: string | null;
  whatsapp?: string | null;
  /** Nom de la boutique, pour pré-remplir le message WhatsApp. */
  nomBoutique?: string | null;
  /** Titre du produit, pour que le vendeur sache de quoi on parle. */
  titreProduit?: string | null;
  themeColor?: string | null;
  /** Un widget de discussion est-il actif sur la page ? */
  chatDisponible?: boolean;
};

/** Numéro réduit aux chiffres : wa.me refuse espaces, tirets et « + ». */
function numeroWhatsapp(brut: string): string {
  return brut.replace(/\D/g, "");
}

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
  const sujet = titreProduit ? `Question sur « ${titreProduit} »` : "Question sur un produit";
  const message = titreProduit
    ? `Bonjour${nomBoutique ? ` ${nomBoutique}` : ""}, j'ai une question sur « ${titreProduit} ».`
    : `Bonjour${nomBoutique ? ` ${nomBoutique}` : ""}, j'ai une question.`;

  return (
    <section className="mt-6 rounded-2xl border border-[#e3e8ea] bg-white p-5 md:p-6">
      <h2 className="text-[15px] md:text-base font-extrabold text-[#191c1e]">
        Une question sur ce produit&nbsp;?
      </h2>
      <p className="text-[13px] text-[#5c647a] mt-1">
        Contactez-nous, nous répondons rapidement.
      </p>

      <div className="flex flex-wrap gap-2.5 mt-4">
        {wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: "#25D366" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.5-.3z" />
              <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1112 20.2z" />
            </svg>
            WhatsApp
          </a>
        )}

        {mail && (
          <a
            href={`mailto:${mail}?subject=${encodeURIComponent(sujet)}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: couleur }}
          >
            <span className="material-symbols-outlined text-[17px]">mail</span>
            E-mail
          </a>
        )}

        {chatDisponible && (
          <button
            type="button"
            // Le widget de discussion s'ouvre par un événement : ce bloc n'a pas
            // à connaître son implémentation, il se contente de le réveiller.
            onClick={() => window.dispatchEvent(new CustomEvent("novakou:ouvrir-chat"))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-[#191c1e] border border-[#e3e8ea] hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">chat</span>
            Discuter
          </button>
        )}
      </div>

      {mail && (
        <p className="text-[12px] text-[#5c647a] mt-3 break-all">
          Ou écrivez-nous à{" "}
          <a href={`mailto:${mail}`} className="font-semibold underline" style={{ color: couleur }}>
            {mail}
          </a>
        </p>
      )}
    </section>
  );
}
