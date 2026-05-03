import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/reviews?formationId=xxx | ?productId=xxx | ?bundleId=xxx | ?planId=xxx
 * Returns recent reviews for a formation, digital product, bundle, or subscription plan (public).
 *
 * POST /api/formations/reviews
 * Body: { kind: "formation" | "product" | "bundle" | "subscription", itemId, rating, comment }
 * Auth required. Buyer-only (must own the item).
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formationId = searchParams.get("formationId");
    const productId = searchParams.get("productId");
    const bundleId = searchParams.get("bundleId");
    const planId = searchParams.get("planId");

    if (bundleId) {
      const reviews = await prisma.productBundleReview.findMany({
        where: { bundleId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, rating: true, comment: true, response: true, respondedAt: true, createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      });
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      return NextResponse.json({ data: reviews, summary: { count: reviews.length, avgRating } });
    }

    if (planId) {
      const reviews = await prisma.subscriptionPlanReview.findMany({
        where: { planId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, rating: true, comment: true, response: true, respondedAt: true, createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      });
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      return NextResponse.json({ data: reviews, summary: { count: reviews.length, avgRating } });
    }

    if (formationId) {
      const reviews = await prisma.formationReview.findMany({
        where: { formationId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, rating: true, comment: true, response: true, respondedAt: true, createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      });
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
      return NextResponse.json({
        data: reviews,
        summary: { count: reviews.length, avgRating },
      });
    }

    if (productId) {
      const reviews = await prisma.digitalProductReview.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, rating: true, comment: true, createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      });
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
      return NextResponse.json({
        data: reviews,
        summary: { count: reviews.length, avgRating },
      });
    }

    return NextResponse.json({ error: "formationId, productId, bundleId ou planId requis" }, { status: 400 });
  } catch (err) {
    console.error("[reviews GET]", err);
    return NextResponse.json({ data: [], summary: { count: 0, avgRating: 0 } });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { kind, itemId, rating, comment } = body;

    if (!kind || !itemId || !rating || !comment) {
      return NextResponse.json({ error: "kind, itemId, rating et comment requis" }, { status: 400 });
    }
    const r = parseInt(rating);
    if (isNaN(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "rating doit être entre 1 et 5" }, { status: 400 });
    }
    if (typeof comment !== "string" || comment.trim().length < 5) {
      return NextResponse.json({ error: "Le commentaire doit faire au moins 5 caractères" }, { status: 400 });
    }

    if (kind === "formation") {
      // Check user has enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_formationId: { userId, formationId: itemId } },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "Vous devez être inscrit à cette formation" }, { status: 403 });
      }
      // Verified purchase : require >= 50% progress (or completed) before
      // allowing the user to leave a review. Avoids spam reviews from people
      // who barely opened the formation.
      if (!enrollment.completedAt && (enrollment.progress ?? 0) < 50) {
        return NextResponse.json(
          {
            error: "Vous devez avoir consommé au moins 50 % de la formation pour laisser un avis",
            code: "INSUFFICIENT_PROGRESS",
            progress: enrollment.progress ?? 0,
          },
          { status: 403 },
        );
      }
      // Edit window : if a review already exists and was created > 30 days ago,
      // refuse the modification (prevents history rewriting).
      const existing = await prisma.formationReview.findUnique({
        where: { userId_formationId: { userId, formationId: itemId } },
        select: { createdAt: true },
      });
      if (existing) {
        const ageMs = Date.now() - existing.createdAt.getTime();
        if (ageMs > 30 * 24 * 60 * 60 * 1000) {
          return NextResponse.json(
            { error: "La fenêtre de modification (30 jours) est dépassée", code: "EDIT_WINDOW_EXPIRED" },
            { status: 403 },
          );
        }
      }
      // Upsert review (one per user per formation)
      const review = await prisma.formationReview.upsert({
        where: { userId_formationId: { userId, formationId: itemId } },
        create: {
          userId,
          formationId: itemId,
          enrollmentId: enrollment.id,
          rating: r,
          comment: comment.trim(),
        },
        update: {
          rating: r,
          comment: comment.trim(),
        },
      });
      // Recompute formation rating + count
      const allReviews = await prisma.formationReview.findMany({
        where: { formationId: itemId },
        select: { rating: true },
      });
      const avg = allReviews.reduce((s, x) => s + x.rating, 0) / allReviews.length;
      await prisma.formation.update({
        where: { id: itemId },
        data: { rating: avg, reviewsCount: allReviews.length },
      });
      return NextResponse.json({ data: review });
    }

    if (kind === "product") {
      const purchase = await prisma.digitalProductPurchase.findFirst({
        where: { userId, productId: itemId },
      });
      if (!purchase) {
        return NextResponse.json({ error: "Vous devez avoir acheté ce produit" }, { status: 403 });
      }
      const review = await prisma.digitalProductReview.upsert({
        where: { userId_productId: { userId, productId: itemId } },
        create: { userId, productId: itemId, rating: r, comment: comment.trim() },
        update: { rating: r, comment: comment.trim() },
      });
      const allReviews = await prisma.digitalProductReview.findMany({
        where: { productId: itemId },
        select: { rating: true },
      });
      const avg = allReviews.reduce((s, x) => s + x.rating, 0) / allReviews.length;
      await prisma.digitalProduct.update({
        where: { id: itemId },
        data: { rating: avg, reviewsCount: allReviews.length },
      });
      return NextResponse.json({ data: review });
    }

    if (kind === "bundle") {
      // Le user doit avoir acheté ce bundle
      const purchase = await prisma.productBundlePurchase.findFirst({
        where: { userId, bundleId: itemId },
      });
      if (!purchase) {
        return NextResponse.json({ error: "Vous devez avoir acheté ce pack" }, { status: 403 });
      }
      const review = await prisma.productBundleReview.upsert({
        where: { userId_bundleId: { userId, bundleId: itemId } },
        create: { userId, bundleId: itemId, rating: r, comment: comment.trim() },
        update: { rating: r, comment: comment.trim() },
      });
      const allReviews = await prisma.productBundleReview.findMany({
        where: { bundleId: itemId },
        select: { rating: true },
      });
      const avg = allReviews.reduce((s, x) => s + x.rating, 0) / allReviews.length;
      await prisma.productBundle.update({
        where: { id: itemId },
        data: { rating: avg, reviewsCount: allReviews.length },
      });
      return NextResponse.json({ data: review });
    }

    if (kind === "subscription") {
      // Le user doit avoir une subscription active OU passée sur ce plan
      const sub = await prisma.subscription.findFirst({
        where: { userId, planId: itemId },
      });
      if (!sub) {
        return NextResponse.json(
          { error: "Vous devez être ou avoir été abonné à ce plan" },
          { status: 403 },
        );
      }
      const review = await prisma.subscriptionPlanReview.upsert({
        where: { userId_planId: { userId, planId: itemId } },
        create: { userId, planId: itemId, rating: r, comment: comment.trim() },
        update: { rating: r, comment: comment.trim() },
      });
      const allReviews = await prisma.subscriptionPlanReview.findMany({
        where: { planId: itemId },
        select: { rating: true },
      });
      const avg = allReviews.reduce((s, x) => s + x.rating, 0) / allReviews.length;
      await prisma.subscriptionPlan.update({
        where: { id: itemId },
        data: { rating: avg, reviewsCount: allReviews.length },
      });
      return NextResponse.json({ data: review });
    }

    return NextResponse.json({ error: "kind invalide" }, { status: 400 });
  } catch (err) {
    console.error("[reviews POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
