import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  serviceStore,
  notificationStore,
  profileStore,
  getCategoryName,
  getSubCategoryName,
} from "@/lib/dev/data-store";

// GET /api/services — List services for current authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const services = serviceStore.getByUser(session.user.id);

    return NextResponse.json(services);
  } catch (error) {
    console.error("[API /services GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des services" },
      { status: 500 }
    );
  }
}

// POST /api/services — Create a new service from wizard data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.categoryId) {
      return NextResponse.json(
        { error: "Le titre et la categorie sont requis" },
        { status: 400 }
      );
    }

    // Resolve category and subcategory names
    const categoryName = getCategoryName(body.categoryId);
    const subCategoryName = getSubCategoryName(
      body.categoryId,
      body.subCategoryId || ""
    );

    // Fetch vendor profile info
    const profile = profileStore.get(session.user.id);

    // Build images array from wizard data
    const images: string[] = [];
    if (body.mainImage?.url) {
      images.push(body.mainImage.url);
    }
    if (Array.isArray(body.additionalImages)) {
      for (const img of body.additionalImages) {
        if (img?.url) images.push(img.url);
      }
    }
    // Fallback: if body.images is already an array of strings
    if (images.length === 0 && Array.isArray(body.images)) {
      images.push(...body.images);
    }

    // Build the service data
    const serviceData = {
      userId: session.user.id,
      title: body.title,
      language: body.language || "fr",
      description: body.description || null,
      descriptionText:
        body.descriptionText ||
        (typeof body.description === "object" && body.description?.text
          ? body.description.text
          : ""),
      categoryId: body.categoryId,
      categoryName,
      subCategoryId: body.subCategoryId || "",
      subCategoryName,
      tags: Array.isArray(body.tags) ? body.tags : [],
      basePrice: body.basePrice || body.packages?.basic?.price || 0,
      deliveryDays:
        body.baseDeliveryDays ||
        body.deliveryDays ||
        body.packages?.basic?.deliveryDays ||
        7,
      revisions: body.packages?.basic?.revisions || 2,
      packages: body.packages || {
        basic: {
          name: "Basique",
          price: body.basePrice || 0,
          deliveryDays: body.baseDeliveryDays || 7,
          revisions: 1,
          description: "",
        },
        standard: {
          name: "Standard",
          price: Math.round((body.basePrice || 0) * 1.8),
          deliveryDays: body.baseDeliveryDays || 7,
          revisions: 3,
          description: "",
        },
        premium: {
          name: "Premium",
          price: Math.round((body.basePrice || 0) * 3),
          deliveryDays: Math.max(1, (body.baseDeliveryDays || 7) - 1),
          revisions: 5,
          description: "",
        },
      },
      options: Array.isArray(body.options) ? body.options : [],
      expressEnabled: body.baseExpressEnabled || body.expressEnabled || false,
      expressPrice: body.baseExpressPrice || body.expressPrice || 0,
      expressDaysReduction:
        body.baseExpressDaysReduction || body.expressDaysReduction || 0,
      instructionsRequired: body.instructionsRequired || false,
      instructionsContent: body.instructionsContent || null,
      images,
      mainImage: body.mainImage?.url || images[0] || "",
      videoUrl: body.videoUrl || "",
      status: "en_attente" as const,
      isBoosted: false,
      boostedUntil: null,
      boostTier: null,
      metaTitle: body.metaTitle || body.title,
      metaDescription:
        body.metaDescription ||
        `${body.title} - Service professionnel sur FreelanceHigh`,
      faq: Array.isArray(body.faq) ? body.faq : [],
      extras: Array.isArray(body.extras) ? body.extras : [],
      vendorName: profile
        ? `${profile.firstName} ${profile.lastName}`
        : session.user.name || "Freelance",
      vendorAvatar: profile?.photo || "",
      vendorUsername: profile?.username || session.user.id,
      vendorCountry: profile?.country || "",
      vendorBadges: profile?.badges || [],
      vendorRating:
        profile?.userId === session.user.id
          ? serviceStore
              .getByUser(session.user.id)
              .filter((s) => s.ratingCount > 0)
              .reduce(
                (acc, s, _, arr) => acc + s.rating / arr.length,
                0
              ) || 0
          : 0,
      vendorPlan: session.user.plan || "gratuit",
    };

    const service = serviceStore.create(serviceData);

    // Create notification for the user
    notificationStore.add({
      userId: session.user.id,
      title: "Service soumis",
      message: `Votre service "${service.title}" a ete soumis pour validation. Il sera visible apres approbation.`,
      type: "service",
      read: false,
      link: `/dashboard/services`,
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("[API /services POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du service" },
      { status: 500 }
    );
  }
}
