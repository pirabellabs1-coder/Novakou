// POST /api/marketing/popups/impression — vue / clic / fermeture / conversion
// d'un pop-up, et capture d'email pour les pop-ups EMAIL_CAPTURE.
//
// Route PUBLIQUE (visiteur non connecté) : tout ce qui vient du corps de la
// requête est suspect.
//   - `popupId` est vérifié en base : sans ce contrôle, n'importe qui pouvait
//     créer des PopupImpression pour un identifiant inventé (lignes orphelines)
//     ou gonfler les compteurs d'un pop-up appartenant à un autre vendeur.
//   - `userId` n'est JAMAIS lu du corps : il vient de la session. Sinon un
//     visiteur pouvait attribuer ses impressions à l'identifiant d'un autre
//     compte (empoisonnement des statistiques + fuite d'identifiant).
//   - un plafond par visiteur et par pop-up limite le gonflage de compteurs.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/api-rate-limit";

const ACTIONS = ["view", "click", "close", "convert"] as const;
type Action = (typeof ACTIONS)[number];

// Compteur du modèle SmartPopup à incrémenter, par action. Les anciens noms
// (« impressions », « clicks ») n'existaient pas : chaque vue levait une
// PrismaClientValidationError et les statistiques restaient à zéro.
const COMPTEUR: Partial<Record<Action, "totalImpressions" | "totalClicks" | "totalConversions">> = {
  view: "totalImpressions",
  click: "totalClicks",
  convert: "totalConversions",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const { popupId, action, visitorId, email } = body as {
      popupId?: unknown; action?: unknown; visitorId?: unknown; email?: unknown;
    };

    if (!popupId || typeof popupId !== "string") {
      return NextResponse.json({ error: "popupId requis" }, { status: 400 });
    }
    if (typeof action !== "string" || !ACTIONS.includes(action as Action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }
    const act = action as Action;

    const visiteur = typeof visitorId === "string" ? visitorId.slice(0, 64) : null;

    // Le pop-up doit exister et être actif : on ne compte pas pour un pop-up
    // supprimé ou mis en pause (sinon les stats repartent à la hausse après la
    // désactivation).
    const popup = await prisma.smartPopup.findFirst({
      where: { id: popupId, isActive: true },
      select: { id: true, popupType: true, emailListTag: true },
    });
    if (!popup) {
      return NextResponse.json({ error: "Pop-up introuvable" }, { status: 404 });
    }

    // 30 évènements max par visiteur, par pop-up et par heure : largement au-delà
    // d'un usage normal (1 vue + 1 clic), assez bas pour qu'un script ne gonfle
    // pas un taux de conversion.
    const cle = `popup-impression:${popup.id}:${visiteur ?? req.headers.get("x-forwarded-for") ?? "anon"}`;
    const rl = await rateLimit(cle, 30, 3_600_000);
    if (!rl.allowed) {
      return NextResponse.json({ success: true, throttled: true });
    }

    // L'email capturé : c'est LA raison d'être d'un pop-up EMAIL_CAPTURE. Avant,
    // il n'était envoyé à personne et le visiteur lisait quand même « Merci pour
    // votre inscription » — le vendeur perdait chaque adresse.
    let emailPropre: string | null = null;
    if (typeof email === "string" && email.trim()) {
      if (popup.popupType !== "EMAIL_CAPTURE") {
        return NextResponse.json({ error: "Ce pop-up ne collecte pas d'email" }, { status: 400 });
      }
      const candidat = email.trim().toLowerCase().slice(0, 190);
      if (!EMAIL_RE.test(candidat)) {
        return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
      }
      emailPropre = candidat;
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    await prisma.popupImpression.create({
      data: {
        popupId: popup.id,
        action: act,
        userId,
        visitorId: visiteur,
        metadata: emailPropre
          ? { email: emailPropre, tag: popup.emailListTag ?? null }
          : undefined,
      },
    });

    const champ = COMPTEUR[act];
    if (champ) {
      await prisma.smartPopup.update({
        where: { id: popup.id },
        data: { [champ]: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true, captured: !!emailPropre });
  } catch (error) {
    console.error("[POST /api/marketing/popups/impression]", error);
    // Suivi non bloquant : ne jamais casser l'affichage d'une vitrine.
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
