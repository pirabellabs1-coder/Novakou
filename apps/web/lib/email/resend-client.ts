// Client Resend partagé entre tous les emails transactionnels.
//
// Pourquoi un wrapper ?
//   - `new Resend(undefined)` throw au boot. Il faut un guard sur RESEND_API_KEY.
//   - Mais en local dev / CI, RESEND_API_KEY est souvent absent, et on ne veut PAS
//     que chaque envoi d'email crash le flow (checkout, register, KYC...).
//   - Avant : `const resend = ... ?? null` puis appel `resend.emails.send(...)` →
//     erreur TS18047 + crash runtime si la clé manque.
//
// Ce wrapper offre la même API qu'un client Resend natif, mais no-op quand la
// clé manque : il log un warning et retourne `{ data: null, error: null }`.

import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";

const client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

let warned = false;
function warnOnce() {
  if (!warned) {
    warned = true;
    console.warn("[email] RESEND_API_KEY non configurée — les emails sont désactivés.");
  }
}

export const resend = {
  emails: {
    async send(options: CreateEmailOptions) {
      if (!client) {
        warnOnce();
        return { data: null, error: null } as unknown as Awaited<ReturnType<Resend["emails"]["send"]>>;
      }
      return client.emails.send(options);
    },
  },
};

export const isResendConfigured = client !== null;
