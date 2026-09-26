"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock, RotateCcw, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { inter, sora } from "@/lib/fonts";
import { NovakouLogo } from "@/components/formations/CountryFlag";
import { EtapesAchat } from "@/components/formations/achat/EtapesAchat";
import "@/components/formations/achat/achat.css";
import { PixelInjector, type Pixel } from "@/components/formations/PixelInjector";
import { trackEvents } from "@/lib/tracking/events";

/**
 * Page d'attente d'un encaissement DIRECT (push Mobile Money).
 *
 * L'acheteur ne quitte pas Novakou : il reçoit la demande de confirmation sur
 * son téléphone, et cette page interroge le statut jusqu'à la réponse.
 *
 * Le statut vient du serveur, qui le demande lui-même au fournisseur — jamais
 * du navigateur : sinon n'importe qui pourrait se déclarer « payé ».
 */

const POLL_MS = 4000;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 min : au-delà, l'opérateur a expiré

/**
 * URL de retour vers le site du vendeur, avec la référence du paiement.
 * Même contrat que /payment/return et que la documentation du lien intégré :
 * `?ref=<référence>&status=success`, pour que le site du vendeur puisse
 * reconnaître la commande sans nous redemander quoi que ce soit.
 */
function urlVendeur(base: string, ref: string): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}ref=${encodeURIComponent(ref)}&status=success`;
}

function AttenteInner() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref") ?? "";
  const provider = params.get("provider") ?? "";
  const pid = params.get("pid") ?? "";

  const [state, setState] = useState<"pending" | "success" | "failed" | "timeout">("pending");
  const [delivered, setDelivered] = useState(true);
  // Motif de l'échec, tel que la passerelle l'a donné puis traduit côté serveur.
  // Sans lui, un solde insuffisant, un plafond atteint et une panne opérateur
  // s'affichaient tous « refusé ou annulé » : l'acheteur ne savait pas quoi
  // corriger, donc il ne réessayait pas.
  const [echec, setEchec] = useState<{ titre: string; explication: string }>({
    titre: "Paiement non abouti",
    explication:
      "La demande n'a pas été validée. Aucun montant n'a été débité — vous pouvez réessayer.",
  });
  const startedAt = useRef(Date.now());

  // ÉVÉNEMENT D'ACHAT. Cette page redirigeait directement vers l'espace
  // apprenant, sans passer par la page de retour qui déclenche les pixels :
  // aucune vente Mobile Money — donc la majorité — n'était remontée à
  // Facebook, TikTok ou Google. Un vendeur payait sa publicité sans jamais
  // pouvoir mesurer ce qu'elle rapportait.
  const [achatPixels, setAchatPixels] = useState<Pixel[]>([]);
  const [achatMontant, setAchatMontant] = useState(0);

  // Lien de paiement intégré : le vendeur veut récupérer l'acheteur sur SON
  // site après le paiement. Cette page renvoyait tout le monde vers
  // /apprenant/mes-produits sans jamais lire cette consigne — et comme le
  // Mobile Money passe TOUJOURS par ici, la redirection ne se produisait
  // jamais sur la majorité des ventes.
  const [redirectVendeur, setRedirectVendeur] = useState("");

  useEffect(() => {
    // Page ouverte sans référence de paiement (lien tronqué, retour arrière,
    // favori) : ce n'est PAS un refus de l'opérateur. L'annoncer comme tel
    // faisait croire à un échec bancaire là où il n'y avait aucune demande.
    if (!ref || !provider || !pid) {
      setEchec({
        titre: "Paiement introuvable",
        explication:
          "Ce lien ne correspond à aucune demande de paiement en cours. Reprenez votre commande depuis la boutique.",
      });
      setState("failed");
      return;
    }
    let stopped = false;

    async function poll() {
      if (stopped) return;
      if (Date.now() - startedAt.current > TIMEOUT_MS) { setState("timeout"); return; }
      try {
        const res = await fetch(
          `/api/formations/payment/collect-status?ref=${encodeURIComponent(ref)}` +
            `&provider=${encodeURIComponent(provider)}&pid=${encodeURIComponent(pid)}`,
        );
        const j = await res.json();
        const s = j?.data?.status;
        if (s === "success") {
          setDelivered(j?.data?.delivered !== false);
          setState("success");

          const montant = Number(j?.data?.amount ?? 0);
          const formationIds: string[] = j?.data?.formationIds ?? [];
          const productIds: string[] = j?.data?.productIds ?? [];

          // Source de vérité Novakou d'abord, pixels tiers ensuite.
          if (montant > 0) {
            trackEvents.purchase({
              orderId: ref,
              total: montant,
              itemCount: formationIds.length + productIds.length,
              currency: "XOF",
              paymentMethod: provider,
              items: [
                ...formationIds.map((id) => ({ id, kind: "formation" as const })),
                ...productIds.map((id) => ({ id, kind: "product" as const })),
              ],
            });
            setAchatMontant(montant);
          }

          // Pixels des vendeurs concernés.
          if (formationIds.length > 0 || productIds.length > 0) {
            const qs = new URLSearchParams();
            if (formationIds.length) qs.set("formationIds", formationIds.join(","));
            if (productIds.length) qs.set("productIds", productIds.join(","));
            try {
              const px = await fetch(`/api/formations/public/pixels?${qs.toString()}`).then((r) => r.json());
              setAchatPixels(px.data ?? []);
            } catch { /* les pixels ne doivent jamais bloquer une livraison */ }
          }

          // Assez de temps pour que les pixels partent avant la navigation.
          // 2,5 s suffisaient à lire la confirmation, pas forcément à laisser
          // aboutir des requêtes vers trois régies sur un réseau lent.
          const vendeur = String(j?.data?.paylinkRedirectUrl ?? "");
          if (vendeur) {
            setRedirectVendeur(vendeur);
            // Plus long que les 4 s habituelles : la page affiche la référence
            // de paiement, et l'acheteur doit avoir le temps de la noter avant
            // de quitter Novakou. Un bouton permet de partir tout de suite.
            setTimeout(() => { window.location.href = urlVendeur(vendeur, ref); }, 8000);
            return;
          }
          setTimeout(() => router.push("/apprenant/mes-produits"), 4000);
          return;
        }
        if (s === "failed") {
          if (j?.data?.titre) {
            setEchec({ titre: j.data.titre, explication: j.data.explication ?? "" });
          }
          setState("failed");
          return;
        }
      } catch {
        // Erreur réseau : on retente, le paiement peut être en cours.
      }
      setTimeout(poll, POLL_MS);
    }

    poll();
    return () => { stopped = true; };
  }, [ref, provider, pid, router]);

  // Affichage seul : phrase courte annoncée aux lecteurs d'écran à chaque
  // changement d'état (la carte visible, elle, change entièrement).
  const annonce =
    state === "pending"
      ? "En attente de confirmation sur votre téléphone."
      : state === "success"
        ? "Paiement confirmé."
        : state === "failed"
          ? echec.titre
          : "Toujours en attente de confirmation.";

  const etapesAttente = [
    { libelle: "Demande envoyée" },
    {
      libelle: "Validez sur votre téléphone",
      detail: "Gardez votre téléphone à portée de main : la demande expire au bout de quelques minutes.",
    },
    { libelle: "Confirmation" },
  ];

  // Lien d'aide : nouvel onglet, pour ne pas quitter l'écran de suivi.
  const aide = (
    <p className="mt-6 text-[13px] text-[#5c6b62]">
      Une question ?{" "}
      <a
        href="/aide"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded font-semibold text-[#0e1512] underline decoration-[rgba(14,21,18,0.25)] underline-offset-[3px] hover:text-[#006e2f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006e2f]"
      >
        Centre d&apos;aide
      </a>
    </p>
  );

  return (
    <div className={`nka ${inter.variable} ${sora.variable} flex min-h-screen items-center justify-center bg-[#f7f9fb] px-4 py-10`}>
      {/* `eventId` = notre référence interne : Meta et TikTok dédupliquent
          ainsi si l'acheteur repasse par la page de retour. */}
      {state === "success" && achatPixels.length > 0 && (
        <PixelInjector
          pixels={achatPixels}
          event={{ name: "Purchase", value: achatMontant, currency: "XOF", eventId: ref || undefined }}
        />
      )}
      <div className="nka-hero w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <span className="nka-brand">
            <span aria-hidden="true" className="flex">
              <NovakouLogo size={32} />
            </span>
            <span className="nka-brand__txt">Novakou</span>
          </span>
        </div>

        <p role="status" className="sr-only">{annonce}</p>

        <div className="nka-bezel nka-bezel--float nka-bezel--xl">
          <div className="nka-bezel__core px-6 py-9 text-center sm:px-9">
            {state === "pending" && (
              <>
                <div className="nka-wait" aria-hidden="true">
                  <span className="nka-wait__ring" />
                  <span className="nka-wait__ring" />
                  <span className="nka-wait__core">
                    <span className="nka-wait__vibe">
                      <Smartphone />
                    </span>
                  </span>
                </div>
                <h1 className="nka-h1 nka-h1--sm mt-4">
                  Confirmez sur votre téléphone
                </h1>
                <p className="nka-lead mt-2">
                  Une demande de paiement vient d&apos;être envoyée sur votre numéro.
                  Saisissez votre code pour valider — cette page se met à jour toute seule.
                </p>
                <EtapesAchat
                  vertical
                  courante={1}
                  etapes={etapesAttente}
                  libelle="Étapes du paiement"
                  className="mt-7 rounded-2xl bg-[#f7faf8] p-4 shadow-[inset_0_0_0_1px_rgba(14,21,18,0.06)]"
                />
                <div className="mt-6 flex items-center justify-center gap-2.5 text-[13px] font-semibold text-[#5c6b62]">
                  <span className="nka-dots text-[#006e2f]" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  En attente de confirmation…
                </div>
                <p className="mt-2 text-xs text-[#5c6b62]">
                  Ne fermez pas cette page.
                </p>
              </>
            )}

            {state === "success" && (
              <>
                <div className="nka-wait nka-wait--ok" aria-hidden="true">
                  <span className="nka-wait__core">
                    <CheckCircle2 />
                  </span>
                </div>
                <h1 className="nka-h1 nka-h1--sm mt-4">Paiement confirmé</h1>
                <p className="nka-lead mt-2">
                  {delivered
                    ? "Merci ! Votre achat est disponible dans votre espace."
                    : "Merci ! Votre paiement est bien reçu. La mise à disposition de votre achat est en cours — vous recevrez un e-mail dès qu'il sera prêt."}
                </p>
                <EtapesAchat
                  vertical
                  courante={etapesAttente.length}
                  etapes={etapesAttente.map(({ libelle }) => ({ libelle }))}
                  libelle="Étapes du paiement"
                  className="mt-7 rounded-2xl bg-[#f7faf8] p-4 shadow-[inset_0_0_0_1px_rgba(14,21,18,0.06)]"
                />
                {redirectVendeur && (
                  <>
                    <p className="mt-6 text-[13px] text-[#5c6b62]">
                      Vous allez être redirigé vers le site du vendeur.
                    </p>
                    {/* La référence est le numéro commun acheteur/vendeur : elle doit
                        rester lisible avant de quitter Novakou. */}
                    {ref && (
                      <p className="mt-2">
                        <span className="nka-ref">
                          Référence : <code>{ref}</code>
                        </span>
                      </p>
                    )}
                    <a
                      href={urlVendeur(redirectVendeur, ref)}
                      className="nka-btn nka-btn--primary nka-btn--block nka-btn--lg mt-5"
                    >
                      <span className="nka-btn__label">Continuer maintenant</span>
                      <span className="nka-btn__ico" aria-hidden="true">
                        <ArrowRight strokeWidth={2.2} />
                      </span>
                    </a>
                  </>
                )}
              </>
            )}

            {state === "failed" && (
              <>
                <div className="nka-wait nka-wait--fail" aria-hidden="true">
                  <span className="nka-wait__core">
                    <XCircle />
                  </span>
                </div>
                <h1 className="nka-h1 nka-h1--sm mt-4">{echec.titre}</h1>
                <p className="nka-lead mt-2">{echec.explication}</p>
                <button
                  onClick={() => router.back()}
                  className="nka-btn nka-btn--primary nka-btn--block nka-btn--lg mt-7"
                >
                  <span className="nka-btn__label">
                    <RotateCcw aria-hidden="true" />
                    Réessayer
                  </span>
                </button>
                {aide}
              </>
            )}

            {state === "timeout" && (
              <>
                <div className="nka-wait nka-wait--amber" aria-hidden="true">
                  <span className="nka-wait__core">
                    <Clock />
                  </span>
                </div>
                <h1 className="nka-h1 nka-h1--sm mt-4">Toujours en attente</h1>
                <p className="nka-lead mt-2">
                  Nous n&apos;avons pas reçu de confirmation. Si vous avez validé le paiement,
                  il sera pris en compte automatiquement et vous recevrez un e-mail.
                </p>
                {aide}
              </>
            )}
          </div>
        </div>

        <p className="mt-5 inline-flex w-full items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5c6b62]">
          <ShieldCheck size={13} className="text-[#006e2f]" aria-hidden="true" />
          Paiement sécurisé par Novakou
        </p>
      </div>
    </div>
  );
}

export default function AttentePage() {
  return (
    <Suspense fallback={null}>
      <AttenteInner />
    </Suspense>
  );
}
