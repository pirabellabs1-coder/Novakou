import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { reviewStore, orderStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { z } from "zod";

const createReviewSchema = z.object({
  orderId: z.string().min(1),
  qualite: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
  delai: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

// Helper to compute summary stats from a list of reviews
function computeReviewSummary(reviews: Array<{ rating: number; qualite: number; communication: number; delai: number }>) {
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
    : 0;
  const avgQualite = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.qualite, 0) / totalReviews) * 10) / 10
    : 0;
  const avgCommunication = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.communication, 0) / totalReviews) * 10) / 10
    : 0;
  const avgDelai = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.delai, 0) / totalReviews) * 10) / 10
    : 0;

  const starDistribution = [5, 4, 3, 2, 1].map((star) => ({
    stars: star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
    percent: totalReviews > 0
      ? Math.round((reviews.filter((r) => Math.round(r.rating) === star).length / totalReviews) * 100)
      : 0,
  }));

  return { totalReviews, avgRating, avgQualite, avgCommunication, avgDelai, starDistribution };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const freelanceId = searchParams.get("freelanceId");
    const serviceId = searchParams.get("serviceId");
    const orderId = searchParams.get("orderId");
    const role = searchParams.get("role");

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      let reviews;

      if (orderId) {
        const review = reviewStore.getByOrder(orderId);
        reviews = review ? [review] : [];
      } else if (serviceId) {
        reviews = reviewStore.getByService(serviceId);
      } else if (freelanceId) {
        reviews = reviewStore.getByFreelance(freelanceId);
      } else if (role === "client") {
        // Client wants reviews they LEFT (as author)
        reviews = reviewStore.getByClient(session.user.id);
      } else {
        // Default: return reviews for the current user as freelance (received)
        reviews = reviewStore.getByFreelance(session.user.id);
      }

      // Calculate summary stats
      const summary = computeReviewSummary(reviews);

      return NextResponse.json({ reviews, summary });
    } else {
      // Build Prisma where clause based on query params
      const where: Record<string, unknown> = {};
      if (orderId) {
        where.orderId = orderId;
      } else if (serviceId) {
        where.serviceId = serviceId;
      } else if (freelanceId) {
        where.targetId = freelanceId;
      } else if (role === "client") {
        // Client: reviews they authored
        where.authorId = session.user.id;
      } else {
        where.targetId = session.user.id;
      }

      const dbReviews = await prisma.review.findMany({
        where,
        include: {
          author: { select: { name: true, image: true, avatar: true, country: true, countryFlag: true } },
          service: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // Map to same shape as dev-store
      const reviews = dbReviews.map((r) => {
        const author = r.author as { name?: string; image?: string; avatar?: string; country?: string; countryFlag?: string } | null;
        return {
          id: r.id,
          orderId: r.orderId,
          serviceId: r.serviceId,
          clientId: r.authorId,
          clientName: author?.name || "",
          clientAvatar: author?.avatar || author?.image || "",
          clientCountry: author?.countryFlag || author?.country || "",
          freelanceId: r.targetId,
          serviceTitle: (r.service as { title?: string } | null)?.title || "",
          qualite: r.quality ?? 0,
          communication: r.communication ?? 0,
          delai: r.timeliness ?? 0,
          rating: r.rating,
          comment: r.comment || "",
          reply: r.response || null,
          repliedAt: r.response ? r.updatedAt.toISOString() : null,
          helpful: 0,
          reported: false,
          createdAt: r.createdAt.toISOString(),
        };
      });

      const summary = computeReviewSummary(reviews);

      return NextResponse.json({ reviews, summary });
    }
  } catch (error) {
    console.error("[API /reviews GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des avis" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const result = createReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }
    const { orderId, qualite, communication, delai, comment } = result.data;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // Get the order
      const order = orderStore.getById(orderId);
      if (!order) {
        return NextResponse.json(
          { error: "Commande introuvable" },
          { status: 404 }
        );
      }

      // Only the client can leave a review
      if (order.clientId !== session.user.id) {
        return NextResponse.json(
          { error: "Seul le client peut laisser un avis" },
          { status: 403 }
        );
      }

      // Block reviews on disputed orders
      if (["litige", "dispute"].includes((order.status || "").toLowerCase())) {
        return NextResponse.json(
          { error: "Impossible de laisser un avis pour une commande en litige" },
          { status: 400 }
        );
      }

      // Order must be completed
      if (order.status !== "termine") {
        return NextResponse.json(
          { error: "La commande doit etre terminee pour laisser un avis" },
          { status: 400 }
        );
      }

      // Check if already reviewed
      const existingReview = reviewStore.getByOrder(orderId);
      if (existingReview) {
        return NextResponse.json(
          { error: "Un avis a deja ete laisse pour cette commande" },
          { status: 409 }
        );
      }

      const review = reviewStore.create({
        orderId,
        serviceId: order.serviceId,
        clientId: session.user.id,
        clientName: order.clientName,
        clientAvatar: order.clientAvatar,
        clientCountry: order.clientCountry,
        freelanceId: order.freelanceId,
        serviceTitle: order.serviceTitle,
        qualite,
        communication,
        delai,
        comment: comment || "",
      });

      return NextResponse.json({ review }, { status: 201 });
    } else {
      // Get the order from DB
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return NextResponse.json(
          { error: "Commande introuvable" },
          { status: 404 }
        );
      }

      // Only the client can leave a review
      if (order.clientId !== session.user.id) {
        return NextResponse.json(
          { error: "Seul le client peut laisser un avis" },
          { status: 403 }
        );
      }

      // Block reviews on disputed orders
      if (["LITIGE", "DISPUTE"].includes(order.status)) {
        return NextResponse.json(
          { error: "Impossible de laisser un avis pour une commande en litige" },
          { status: 400 }
        );
      }

      // Order must be completed
      if (order.status !== "TERMINE") {
        return NextResponse.json(
          { error: "La commande doit etre terminee pour laisser un avis" },
          { status: 400 }
        );
      }

      // Check if already reviewed
      const existingReview = await prisma.review.findFirst({ where: { orderId } });
      if (existingReview) {
        return NextResponse.json(
          { error: "Un avis a deja ete laisse pour cette commande" },
          { status: 409 }
        );
      }

      const rating = Math.round(((qualite + communication + delai) / 3) * 10) / 10;

      const dbReview = await prisma.review.create({
        data: {
          orderId,
          serviceId: order.serviceId || "",
          authorId: session.user.id,
          targetId: order.freelanceId,
          rating,
          quality: qualite,
          communication,
          timeliness: delai,
          comment: comment || "",
        },
        include: {
          author: { select: { name: true, image: true, avatar: true, country: true, countryFlag: true } },
          service: { select: { title: true } },
        },
      });

      // Update service rating and ratingCount
      if (order.serviceId) {
        const allReviews = await prisma.review.findMany({
          where: { serviceId: order.serviceId },
          select: { rating: true },
        });
        const avgRating = allReviews.length > 0
          ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10
          : 0;
        await prisma.service.update({
          where: { id: order.serviceId },
          data: { rating: avgRating, ratingCount: allReviews.length },
        });
      }

      // Update freelance profile stats
      const allFreelanceReviews = await prisma.review.findMany({
        where: { targetId: order.freelanceId },
        select: { rating: true },
      });
      const freelanceAvg = allFreelanceReviews.length > 0
        ? Math.round((allFreelanceReviews.reduce((sum, r) => sum + r.rating, 0) / allFreelanceReviews.length) * 10) / 10
        : 0;
      await prisma.freelancerProfile.updateMany({
        where: { userId: order.freelanceId },
        data: { completionRate: freelanceAvg },
      }).catch(() => {}); // ignore if profile doesn't exist

      // Map to same shape as dev-store
      const author = dbReview.author as { name?: string; image?: string; avatar?: string; country?: string; countryFlag?: string } | null;
      const review = {
        id: dbReview.id,
        orderId: dbReview.orderId,
        serviceId: dbReview.serviceId,
        clientId: dbReview.authorId,
        clientName: author?.name || "",
        clientAvatar: author?.avatar || author?.image || "",
        clientCountry: author?.countryFlag || author?.country || "",
        freelanceId: dbReview.targetId,
        serviceTitle: (dbReview.service as { title?: string } | null)?.title || "",
        qualite: dbReview.quality ?? qualite,
        communication: dbReview.communication ?? communication,
        delai: dbReview.timeliness ?? delai,
        rating: dbReview.rating,
        comment: dbReview.comment || "",
        reply: null,
        repliedAt: null,
        helpful: 0,
        reported: false,
        createdAt: dbReview.createdAt.toISOString(),
      };

      return NextResponse.json({ review }, { status: 201 });
    }
  } catch (error) {
    console.error("[API /reviews POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'avis" },
      { status: 500 }
    );
  }
}
