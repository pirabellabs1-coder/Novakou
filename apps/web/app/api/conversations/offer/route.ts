import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { offreStore, orderStore } from "@/lib/dev/data-store";
import { calculateCommissionEur, normalizePlanName } from "@/lib/plans";

/**
 * POST /api/conversations/offer
 * Create an offer within a conversation context.
 * Body: { conversationId, recipientId, recipientName, title, amount, delay, revisions, description, validityDays }
 * Returns: { offre, message } — the offer + a message object to display in chat
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || (IS_DEV ? "dev-user" : null);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, recipientId, recipientName, title, amount, delay, revisions, description, validityDays } = body;

    if (!title || !amount || !delay || !description) {
      return NextResponse.json({ error: "Champs requis: title, amount, delay, description" }, { status: 400 });
    }

    // Input bounds validation
    const numAmount = Number(amount);
    const numDelay = Number(delay);
    const numRevisions = Number(revisions) || 0;
    if (isNaN(numAmount) || numAmount < 5 || numAmount > 50000) {
      return NextResponse.json({ error: "Le montant doit être entre 5 € et 50 000 €." }, { status: 400 });
    }
    if (isNaN(numDelay) || numDelay < 1 || numDelay > 180) {
      return NextResponse.json({ error: "Le délai doit être entre 1 et 180 jours." }, { status: 400 });
    }
    if (numRevisions < 0 || numRevisions > 10) {
      return NextResponse.json({ error: "Le nombre de révisions doit être entre 0 et 10." }, { status: 400 });
    }

    const validDays = Number(validityDays) || 14;
    const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();

    const offerMessageData = {
      title,
      amount: Number(amount),
      delay,
      revisions: Number(revisions) || 2,
      description,
      status: "en_attente",
      validityDays: validDays,
      expiresAt,
    };

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const offre = offreStore.create({
        freelanceId: userId,
        clientId: recipientId || undefined,
        client: recipientName || "Client",
        clientEmail: "",
        title,
        amount: Number(amount),
        delay,
        revisions: Number(revisions) || 2,
        description,
        validityDays: validDays,
      });

      // Persist offer message in the conversation so both parties can see it
      if (conversationId) {
        const { conversationStore } = await import("@/lib/dev/data-store");
        conversationStore.sendMessage(
          conversationId, userId,
          `Offre: ${title} — ${Number(amount)} EUR`,
          "offer",
          undefined, undefined, undefined, undefined, undefined,
          { ...offerMessageData, offerId: offre.id },
        );
      }

      return NextResponse.json({
        offre,
        offerMessageData: { ...offerMessageData, offerId: offre.id },
      }, { status: 201 });
    }

    // Production: Prisma
    const { prisma } = await import("@/lib/prisma");
    const dbOffre = await prisma.offer.create({
      data: {
        freelanceId: userId,
        clientId: recipientId || null,
        clientName: recipientName || "Client",
        clientEmail: "",
        title,
        amount: Number(amount),
        delay,
        revisions: Number(revisions) || 2,
        description,
        validityDays: validDays,
        expiresAt: new Date(expiresAt),
        status: "EN_ATTENTE",
      },
    });

    // Persist offer message in the conversation so both parties can see it
    if (conversationId) {
      const fullOfferData = { ...offerMessageData, offerId: dbOffre.id };
      await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: `Offre: ${title} — ${Number(amount)} EUR`,
          type: "SYSTEM",
          linkPreviewData: { _type: "offer", ...fullOfferData },
        },
      });
    }

    return NextResponse.json({
      offre: dbOffre,
      offerMessageData: { ...offerMessageData, offerId: dbOffre.id },
    }, { status: 201 });
  } catch (error) {
    console.error("[API /conversations/offer POST]", error);
    return NextResponse.json({ error: "Erreur lors de la creation de l'offre" }, { status: 500 });
  }
}

/**
 * PATCH /api/conversations/offer
 * Accept or refuse an offer from a conversation.
 * Body: { offerId, action: "accept" | "refuse" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || (IS_DEV ? "dev-user" : null);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { offerId, action } = body;

    if (!offerId || !["accept", "refuse"].includes(action)) {
      return NextResponse.json({ error: "offerId et action (accept/refuse) requis" }, { status: 400 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const offre = offreStore.getById(offerId);
      if (!offre) {
        return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
      }

      if (action === "accept") {
        offreStore.updateStatus(offerId, "acceptee");

        // Create order from accepted offer
        const order = orderStore.create({
          serviceId: "",
          serviceTitle: offre.title || "Offre personnalisee",
          category: "",
          clientId: userId,
          clientName: session?.user?.name || "Client",
          clientAvatar: "",
          clientCountry: "",
          freelanceId: offre.freelanceId,
          freelanceName: (offre as unknown as Record<string, unknown>).freelanceName as string || "Freelance",
          status: "en_attente",
          amount: offre.amount || 0,
          commission: (offre.amount || 0) * 0.2,
          packageType: "custom",
          // Freelance has 3 days to validate, then actual deadline starts
          deadline: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
          deliveredAt: null,
          completedAt: null,
          progress: 0,
          revisionsLeft: offre.revisions || 2,
          messages: [],
          timeline: [{
            id: `t${Date.now()}`,
            type: "created" as const,
            title: "Offre acceptee",
            description: `Offre "${offre.title}" acceptee — Le freelance a 3 jours pour valider et commencer le travail.`,
            timestamp: new Date().toISOString(),
          }],
          files: [],
        });

        return NextResponse.json({
          ok: true,
          newStatus: "acceptee",
          order,
        });
      }

      // Refuse
      offreStore.updateStatus(offerId, "refusee");
      return NextResponse.json({ ok: true, newStatus: "refusee" });
    }

    // Production: Prisma
    const { prisma } = await import("@/lib/prisma");
    const offre = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { freelance: { select: { plan: true } } },
    });

    if (!offre) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    // Authorization: only the client (recipient) can accept/refuse
    if (offre.clientId && offre.clientId !== userId) {
      return NextResponse.json({ error: "Vous n'etes pas autorise a modifier cette offre" }, { status: 403 });
    }

    if (action === "accept") {
      const commission = calculateCommissionEur(normalizePlanName(offre.freelance?.plan || "gratuit"), offre.amount);

      const result = await prisma.$transaction(async (tx) => {
        await tx.offer.update({ where: { id: offerId }, data: { status: "ACCEPTEE" } });

        const order = await tx.order.create({
          data: {
            clientId: userId,
            freelanceId: offre.freelanceId,
            status: "EN_ATTENTE",
            escrowStatus: "HELD",
            amount: offre.amount,
            commission,
            packageType: "custom",
            deadline: new Date(Date.now() + 3 * 86400000), // 3 days to validate
          },
        });

        // Update the offer message in DB to reflect accepted status
        await tx.$executeRaw`
          UPDATE "Message"
          SET "linkPreviewData" = jsonb_set("linkPreviewData"::jsonb, '{status}', '"acceptee"')
          WHERE "type" = 'SYSTEM'
          AND "linkPreviewData"::jsonb->>'_type' = 'offer'
          AND "linkPreviewData"::jsonb->>'offerId' = ${offerId}
        `;

        return order;
      });

      return NextResponse.json({ ok: true, newStatus: "acceptee", order: result });
    }

    // Refuse
    await prisma.$transaction(async (tx) => {
      await tx.offer.update({ where: { id: offerId }, data: { status: "REFUSEE" } });
      // Update the offer message in DB to reflect refused status
      await tx.$executeRaw`
        UPDATE "Message"
        SET "linkPreviewData" = jsonb_set("linkPreviewData"::jsonb, '{status}', '"refusee"')
        WHERE "type" = 'SYSTEM'
        AND "linkPreviewData"::jsonb->>'_type' = 'offer'
        AND "linkPreviewData"::jsonb->>'offerId' = ${offerId}
      `;
    });
    return NextResponse.json({ ok: true, newStatus: "refusee" });
  } catch (error) {
    console.error("[API /conversations/offer PATCH]", error);
    return NextResponse.json({ error: "Erreur lors du traitement de l'offre" }, { status: 500 });
  }
}
