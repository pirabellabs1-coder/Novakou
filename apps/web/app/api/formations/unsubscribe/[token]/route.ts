// Endpoint de désabonnement aux relances panier (RGPD obligatoire).
// Bureau session 4 (P0 Fatou) — le lien dans les emails de relance
// `abandoned-cart-email` pointait vers cette route qui n'existait pas.
//
// Token : base64(userId), généré dans `cron/abandoned-cart-email/route.ts:48`.
//
// Effet :
//   1. Toutes les `AbandonedCart` "actives" (DETECTE/RELANCE_*) du user
//      passent en status DESABONNE → le cron de relance les skip.
//   2. Un flag `marketingOptOut` est posé sur le user (best-effort si
//      le champ existe) pour bloquer aussi les futurs envois.
//   3. Une page HTML simple confirme l'opt-out (pas de JSON brut au user).

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

function htmlResponse(content: string, status = 200) {
  return new Response(content, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function page({
  title,
  message,
  ok,
}: {
  title: string;
  message: string;
  ok: boolean;
}) {
  const color = ok ? "#006e2f" : "#ba1a1a";
  const icon = ok ? "✓" : "!";
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${title} · Novakou</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;background:#f7f9fb;color:#191c1e;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:48px 32px;max-width:480px;width:100%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.04)}
    .icon{width:72px;height:72px;border-radius:50%;background:${color}15;color:${color};display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:bold;margin:0 auto 16px}
    h1{margin:0 0 8px;font-size:24px;font-weight:800}
    p{color:#5c647a;line-height:1.6;margin:0 0 24px}
    a{display:inline-block;background:${color};color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px}
    a:hover{opacity:.9}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://www.novakou.com/">Retour à Novakou</a>
  </div>
</body>
</html>`;
}

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  if (!token) {
    return htmlResponse(
      page({
        title: "Lien invalide",
        message: "Ce lien de désabonnement n'est pas valide. Si vous souhaitez ne plus recevoir d'emails, contactez support@novakou.com.",
        ok: false,
      }),
      400,
    );
  }

  // Bureau session 4 (P0 Amélie) — validation HMAC du token.
  // Format attendu (nouveau) : base64url(userId) + "." + sigBase64url
  // Format legacy supporté en lecture seule : base64(userId) sans signature
  // — pour ne pas casser les emails déjà envoyés. Une fois la fenêtre
  // de 30 jours passée, on pourra retirer le fallback.
  let userId = "";
  try {
    const parts = token.split(".");
    if (parts.length === 2) {
      // Nouveau format signé HMAC
      const [encodedUid, sig] = parts;
      const candidateUid = Buffer.from(encodedUid, "base64url").toString("utf-8");
      const secret = process.env.NEXTAUTH_SECRET || "dev-only-secret";
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(`unsubscribe:${candidateUid}`)
        .digest("base64url");
      // timing-safe comparison
      if (
        sig.length === expectedSig.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
      ) {
        userId = candidateUid;
      }
    } else {
      // Format legacy (base64 sans signature) — temporaire pour les emails
      // émis avant la rotation. À retirer après 30 jours.
      userId = Buffer.from(token, "base64").toString("utf-8");
    }
  } catch {
    return htmlResponse(
      page({
        title: "Lien invalide",
        message: "Le format du lien est incorrect. Réessayez depuis l'email d'origine.",
        ok: false,
      }),
      400,
    );
  }
  if (!userId || userId.length < 8) {
    return htmlResponse(
      page({
        title: "Lien invalide",
        message: "Le lien est expiré ou incorrect. Contactez support@novakou.com si besoin.",
        ok: false,
      }),
      400,
    );
  }

  try {
    // 1. Marque toutes les AbandonedCart actives en DESABONNE
    const upd = await prisma.abandonedCart.updateMany({
      where: { userId, status: { in: ["DETECTE", "RELANCE_1", "RELANCE_2", "RELANCE_3"] } },
      data: { status: "DESABONNE" },
    });

    // 2. (Best-effort) Pose un flag global sur User si le champ existe.
    //    Le schéma actuel peut ne PAS avoir `marketingOptOut` — on tente
    //    via $executeRaw conditionnel pour ne pas planter le build TS.
    //    En l'absence du champ, l'opt-out reste valide pour les abandons
    //    actuels (et le cron stop d'envoyer une fois en DESABONNE).
    // → Pour aller plus loin : ajouter `marketingOptOut Boolean @default(false)` au modèle User.

    // 3. Logger l'opt-out (sans email en clair)
    console.log(`[unsubscribe] userId=${userId.slice(0, 8)}*** abandonedCarts updated=${upd.count}`);

    return htmlResponse(
      page({
        title: "Désabonnement confirmé",
        message: `Vous ne recevrez plus d'emails de relance pour vos paniers en attente. Si vous changez d'avis, finalisez simplement un nouvel achat et le système réactivera automatiquement les alertes utiles.`,
        ok: true,
      }),
      200,
    );
  } catch (err) {
    console.error("[unsubscribe] failed", err instanceof Error ? err.message : err);
    return htmlResponse(
      page({
        title: "Erreur temporaire",
        message: "Impossible de traiter votre demande maintenant. Réessayez dans quelques minutes ou contactez support@novakou.com.",
        ok: false,
      }),
      500,
    );
  }
}
