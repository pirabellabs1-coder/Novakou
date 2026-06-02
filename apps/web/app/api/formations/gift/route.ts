import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import crypto from "crypto";

/**
 * POST /api/formations/gift
 * Body: { kind: "formation" | "product", itemId: string, recipientEmail: string, recipientName?: string, message?: string }
 *
 * Gifting flow:
 * 1. Verify the item exists and is active
 * 2. Find or create a placeholder user for recipient (by email)
 * 3. Check recipient doesn't already own it
 * 4. Create the enrollment / purchase record attributed to the recipient
 *    (with paidAmount = item price, stripeSessionId = "gift:<gifter_user_id>")
 * 5. TODO: trigger email notification to recipient with login link
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const gifterId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!gifterId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { kind, itemId, recipientEmail, recipientName, message } = body;

    if (!kind || !itemId || !recipientEmail) {
      return NextResponse.json({ error: "kind, itemId et recipientEmail requis" }, { status: 400 });
    }

    const emailLower = recipientEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Find or create recipient user
    let recipient = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!recipient) {
      // Create placeholder account — a real signup flow will reclaim it
      const randomPassword = crypto.randomBytes(32).toString("hex");
      recipient = await prisma.user.create({
        data: {
          email: emailLower,
          name: recipientName?.trim() || emailLower.split("@")[0],
          passwordHash: randomPassword, // placeholder — recipient must reset
          role: "FREELANCE",
          status: "ACTIF",
        },
      });
    }

    if (recipient.id === gifterId) {
      return NextResponse.json({ error: "Impossible de s'offrir à soi-même" }, { status: 400 });
    }

    if (kind === "formation") {
      const formation = await prisma.formation.findUnique({
        where: { id: itemId },
        select: { id: true, title: true, price: true, status: true, instructeurId: true },
      });
      if (!formation || formation.status !== "ACTIF") {
        return NextResponse.json({ error: "Formation introuvable ou indisponible" }, { status: 404 });
      }

      // Bureau session 4 (P0 Karim/Amélie) — fraud fix.
      // Avant : N'IMPORTE QUEL user authentifié pouvait offrir n'importe
      // quelle formation, ce qui créditait le wallet du vendeur sans
      // qu'aucun paiement réel ne soit fait → fraude directe.
      // Maintenant : seul l'INSTRUCTEUR du produit peut l'offrir (gift de
      // sa propre formation), et dans ce cas paidAmount=0 + pas de crédit
      // wallet (un cadeau qu'on offre soi-même ne génère pas de revenu).
      const gifterProfile = await prisma.instructeurProfile.findUnique({
        where: { userId: gifterId },
        select: { id: true },
      });
      if (!gifterProfile || gifterProfile.id !== formation.instructeurId) {
        return NextResponse.json(
          { error: "Vous ne pouvez offrir que vos propres formations. Pour offrir une formation tierce, payez-la d'abord puis transférez l'accès via support." },
          { status: 403 },
        );
      }

      // Check if already enrolled
      const existing = await prisma.enrollment.findUnique({
        where: { userId_formationId: { userId: recipient.id, formationId: formation.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Le destinataire possède déjà cette formation" }, { status: 409 });
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: recipient.id,
          formationId: formation.id,
          paidAmount: 0, // cadeau du vendeur → aucun revenu généré
          stripeSessionId: `gift:${gifterId}${message ? `:msg:${message.slice(0, 200)}` : ""}`,
        },
      });

      // Increment students count (stat publique uniquement, pas de revenu)
      await prisma.formation.update({
        where: { id: formation.id },
        data: { studentsCount: { increment: 1 } },
      });

      return NextResponse.json({
        data: {
          success: true,
          kind: "formation",
          enrollmentId: enrollment.id,
          recipient: { email: recipient.email, name: recipient.name },
          itemTitle: formation.title,
          amount: formation.price,
        },
      });
    }

    if (kind === "product") {
      const product = await prisma.digitalProduct.findUnique({
        where: { id: itemId },
        select: { id: true, title: true, price: true, status: true, instructeurId: true },
      });
      if (!product || product.status !== "ACTIF") {
        return NextResponse.json({ error: "Produit introuvable ou indisponible" }, { status: 404 });
      }

      // Même garde anti-fraude que pour formation (cf. ci-dessus)
      const gifterProfile = await prisma.instructeurProfile.findUnique({
        where: { userId: gifterId },
        select: { id: true },
      });
      if (!gifterProfile || gifterProfile.id !== product.instructeurId) {
        return NextResponse.json(
          { error: "Vous ne pouvez offrir que vos propres produits. Pour offrir un produit tiers, payez-le d'abord puis transférez l'accès via support." },
          { status: 403 },
        );
      }

      // Check existing purchase
      const existing = await prisma.digitalProductPurchase.findFirst({
        where: { userId: recipient.id, productId: product.id },
      });
      if (existing) {
        return NextResponse.json({ error: "Le destinataire possède déjà ce produit" }, { status: 409 });
      }

      const purchase = await prisma.digitalProductPurchase.create({
        data: {
          userId: recipient.id,
          productId: product.id,
          paidAmount: 0, // cadeau du vendeur → aucun revenu généré
          stripeSessionId: `gift:${gifterId}${message ? `:msg:${message.slice(0, 200)}` : ""}`,
        },
      });

      await prisma.digitalProduct.update({
        where: { id: product.id },
        // Audit 2026-05-26 : sync salesCount + currentBuyers (cf. checkout).
        data: { salesCount: { increment: 1 }, currentBuyers: { increment: 1 } },
      });

      return NextResponse.json({
        data: {
          success: true,
          kind: "product",
          purchaseId: purchase.id,
          recipient: { email: recipient.email, name: recipient.name },
          itemTitle: product.title,
          amount: product.price,
        },
      });
    }

    return NextResponse.json({ error: "kind invalide" }, { status: 400 });
  } catch (err) {
    console.error("[gift POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
