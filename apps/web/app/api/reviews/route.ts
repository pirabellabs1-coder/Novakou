import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { reviewStore, orderStore } from "@/lib/dev/data-store";

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

    let reviews;

    if (orderId) {
      const review = reviewStore.getByOrder(orderId);
      reviews = review ? [review] : [];
    } else if (serviceId) {
      reviews = reviewStore.getByService(serviceId);
    } else if (freelanceId) {
      reviews = reviewStore.getByFreelance(freelanceId);
    } else {
      // Default: return reviews for the current user as freelance
      reviews = reviewStore.getByFreelance(session.user.id);
    }

    // Calculate summary stats
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

    // Star distribution
    const starDistribution = [5, 4, 3, 2, 1].map((star) => ({
      stars: star,
      count: reviews.filter((r) => Math.round(r.rating) === star).length,
      percent: totalReviews > 0
        ? Math.round((reviews.filter((r) => Math.round(r.rating) === star).length / totalReviews) * 100)
        : 0,
    }));

    return NextResponse.json({
      reviews,
      summary: {
        totalReviews,
        avgRating,
        avgQualite,
        avgCommunication,
        avgDelai,
        starDistribution,
      },
    });
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
    const { orderId, qualite, communication, delai, comment } = body;

    if (!orderId || !qualite || !communication || !delai) {
      return NextResponse.json(
        { error: "Champs requis manquants: orderId, qualite, communication, delai" },
        { status: 400 }
      );
    }

    // Validate ratings are 1-5
    if ([qualite, communication, delai].some((r) => r < 1 || r > 5)) {
      return NextResponse.json(
        { error: "Les notes doivent etre entre 1 et 5" },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error("[API /reviews POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'avis" },
      { status: 500 }
    );
  }
}
