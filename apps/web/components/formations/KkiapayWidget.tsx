"use client";

import { useEffect, useRef } from "react";

/**
 * Fenêtre de paiement KkiaPay.
 *
 * KkiaPay n'a pas d'API serveur pour débiter un client : le paiement se fait
 * obligatoirement dans LEUR fenêtre, ouverte par le navigateur. C'est la seule
 * passerelle de notre système qui fonctionne ainsi — les autres poussent la
 * demande sur le téléphone depuis notre serveur.
 *
 * Conséquence sur la sûreté : ce composant ne décide RIEN. Il reçoit un
 * identifiant de transaction du navigateur et le transmet au serveur, qui le
 * revérifie auprès de KkiaPay et compare le montant avant de livrer. Un
 * acheteur qui fabriquerait un identifiant n'obtiendrait rien.
 *
 * Le SDK est importé depuis npm (pas de script distant à autoriser) mais il
 * ouvre une iframe sur `widget-v3.kkiapay.me` — d'où l'entrée `frame-src`
 * correspondante dans la CSP (next.config.ts).
 */

export type KkiapayInit = {
  publicKey: string;
  amount: number;
  /** "momo" | "card" — ce que le registre a résolu pour cet opérateur. */
  paymentMethod: string;
  phone?: string;
  email?: string;
  name?: string;
  internalRef: string;
  /** Pays ISO-2 en majuscules, pour restreindre la fenêtre au bon marché. */
  country?: string;
  sandbox?: boolean;
};

type Props = {
  init: KkiapayInit;
  /** Paiement constaté et livré côté serveur. */
  onDelivered: () => void;
  /** Échec, abandon, ou vérification refusée. */
  onFailed: (message: string) => void;
};

/** Pays acceptés par la fenêtre KkiaPay (enum CountryCode de leur SDK). */
const SUPPORTED_COUNTRIES = new Set(["BJ", "CI", "SN", "TG", "NE"]);

export function KkiapayWidget({ init, onDelivered, onFailed }: Props) {
  // Les callbacks changent à chaque rendu : on les lit par référence pour ne
  // pas ré-ouvrir la fenêtre à chaque fois.
  const cbRef = useRef({ onDelivered, onFailed });
  cbRef.current = { onDelivered, onFailed };

  const openedRef = useRef(false);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;

    let cancelled = false;

    (async () => {
      let sdk: typeof import("kkiapay");
      try {
        sdk = await import("kkiapay");
      } catch {
        cbRef.current.onFailed("La fenêtre de paiement n'a pas pu se charger. Réessayez.");
        return;
      }
      if (cancelled) return;

      sdk.addSuccessListener(async (data) => {
        const transactionId = (data as { transactionId?: string } | undefined)?.transactionId;
        if (!transactionId) {
          cbRef.current.onFailed("Paiement sans référence. Contactez-nous si vous avez été débité.");
          return;
        }
        try {
          const res = await fetch("/api/formations/payment/kkiapay-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId, internalRef: init.internalRef }),
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json.data?.delivered) {
            cbRef.current.onDelivered();
            return;
          }
          if (res.ok && json.data?.status === "success") {
            // Encaissé mais pas encore livré : surtout ne pas dire « échec ».
            // Le cron de réconciliation prendra le relais.
            cbRef.current.onFailed(
              "Paiement reçu. L'accès à votre achat arrive dans un instant — vous recevrez un e-mail.",
            );
            return;
          }
          cbRef.current.onFailed(json.error ?? "Le paiement n'a pas pu être confirmé.");
        } catch {
          cbRef.current.onFailed(
            "Paiement reçu mais confirmation impossible. Vérifiez vos e-mails dans quelques minutes.",
          );
        }
      });

      sdk.addFailedListener(() => {
        cbRef.current.onFailed("Le paiement a été refusé ou annulé.");
      });

      const country = (init.country ?? "").toUpperCase();
      sdk.openKkiapayWidget({
        amount: Math.round(init.amount),
        key: init.publicKey,
        sandbox: init.sandbox === true,
        phone: init.phone || undefined,
        email: init.email || undefined,
        name: init.name || undefined,
        // Restreint la fenêtre au marché de l'acheteur quand on le connaît :
        // sans ça, KkiaPay propose tous ses pays et l'acheteur peut choisir un
        // opérateur qui n'est pas le sien.
        // Le SDK type ces champs avec des enums qu'il n'exporte pas comme
        // valeurs : on passe les chaînes attendues et on cale le type.
        countries: (SUPPORTED_COUNTRIES.has(country) ? [country] : undefined) as never,
        paymentMethods: [init.paymentMethod === "card" ? "card" : "momo"] as never,
        data: init.internalRef,
      });
    })();

    return () => {
      cancelled = true;
      void import("kkiapay")
        .then((sdk) => {
          sdk.removeKkiapayListener("success");
          sdk.removeKkiapayListener("failed");
        })
        .catch(() => null);
    };
  }, [init]);

  return null;
}
