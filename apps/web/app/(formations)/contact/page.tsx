import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpen, Clock, Mail, ShieldCheck } from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { FormulaireContact } from "@/components/formations/public/FormulaireContact";

/*
 * Page Contact — Server Component (métadonnées dans layout.tsx). Le
 * formulaire (POST /api/support/ticket) est le seul îlot client.
 */

const CANAUX = [
  { Icon: Mail, email: "support@novakou.com", note: "Réponse sous 24 h ouvrées" },
  { Icon: AlertTriangle, email: "paiements@novakou.com", note: "Urgences paiement, réponse sous 2 h" },
  { Icon: ShieldCheck, email: "privacy@novakou.com", note: "RGPD, export/suppression de données" },
];

export default function ContactPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Support Novakou"
        titre={
          <>
            Nous <em>contacter</em>
          </>
        }
        sousTitre="Notre équipe répond en moyenne en moins de 5 minutes en chat, et sous 24 h par email."
        meta={["Réponse sous 24 h ouvrées", "Urgences paiement sous 2 h", "Lundi – vendredi, 8h – 19h GMT"]}
      />

      <section className="nkp-section nkp-section--tint !pt-10" aria-label="Formulaire et coordonnées">
        <div className="nkp-wrap">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 items-start">
            <div className="nkp-bezel nkp-bezel--float nkp-reveal">
              <FormulaireContact />
            </div>

            <aside className="flex flex-col gap-4" aria-label="Autres moyens de nous joindre">
              <div className="nkp-card nkp-reveal">
                <div className="nkp-card__core">
                  <h2 className="!text-[1.05rem]">Autres moyens de nous joindre</h2>
                  <ul className="nkp-list mt-4 !gap-4">
                    {CANAUX.map((c) => (
                      <li key={c.email} className="!items-start">
                        <span className="nkp-ic nkp-ic--sm" aria-hidden="true">
                          <c.Icon strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                          <a href={`mailto:${c.email}`} className="block break-all font-semibold hover:text-[#006e2f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006e2f] rounded">
                            {c.email}
                          </a>
                          <span className="text-[.8rem] text-[#5c6b62]">{c.note}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="nkp-card nkp-reveal">
                <div className="nkp-card__core">
                  <h2 className="!text-[1.05rem]">Avant de nous contacter</h2>
                  <p className="nkp-card__desc text-[.88rem]">La plupart des questions trouvent une réponse immédiate dans le centre d'aide.</p>
                  <Link href="/aide" className="nkp-link mt-4 text-[.9rem]">
                    <BookOpen size={15} strokeWidth={2} aria-hidden="true" />
                    Consulter le centre d'aide
                    <ArrowRight strokeWidth={2.2} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="nkp-card nkp-card--dark nkp-reveal">
                <div className="nkp-card__core">
                  <span className="nkp-ic nkp-ic--dark nkp-ic--sm mb-3" aria-hidden="true">
                    <Clock strokeWidth={1.75} />
                  </span>
                  <h2 className="!text-[1.05rem]">Horaires</h2>
                  <p className="text-[.88rem] mt-1">
                    Lundi – Vendredi
                    <br />
                    8h00 – 19h00 (GMT / heure d'Abidjan)
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
