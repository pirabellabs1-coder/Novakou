import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import {
  serviceStore,
  notificationStore,
  profileStore,
  getCategoryName,
  getSubCategoryName,
} from "@/lib/dev/data-store";
import { canCreateService, normalizePlanName } from "@/lib/plans";

// GET /api/services — List services for current authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV) {
      const services = serviceStore.getByUser(session.user.id);

      return NextResponse.json(services);
    }

    // Production: Prisma
    const services = await prisma.service.findMany({
      where: { userId: session.user.id },
      include: { category: true, options: true, media: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("[API /services GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des services" },
      { status: 500 }
    );
  }
}

// Helper: generate a URL-safe slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 200);
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

    // --- Plan enforcement: check service limit ---
    const userPlan = normalizePlanName(session.user.plan);
    if (IS_DEV) {
      const activeServices = serviceStore.getByUser(session.user.id)
        .filter((s) => s.status === "actif" || s.status === "en_attente");
      if (!canCreateService(userPlan, activeServices.length)) {
        const limit = userPlan === "GRATUIT" ? 7 : "illimite";
        return NextResponse.json(
          {
            error: `Limite de services atteinte pour votre plan (${limit}). Passez a un plan superieur pour publier plus de services.`,
            code: "SERVICE_LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    } else {
      const activeServicesCount = await prisma.service.count({
        where: {
          userId: session.user.id,
          status: { in: ["ACTIF", "EN_ATTENTE"] },
        },
      });
      if (!canCreateService(userPlan, activeServicesCount)) {
        const { getPlanLimits, formatLimit } = await import("@/lib/plans");
        const limits = getPlanLimits(userPlan);
        return NextResponse.json(
          {
            error: `Limite de services atteinte pour votre plan (${formatLimit(limits.serviceLimit)}). Passez a un plan superieur pour publier plus de services.`,
            code: "SERVICE_LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    if (IS_DEV) {
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
    }

    // Production: Prisma
    // Generate a unique slug
    let slug = generateSlug(body.title);
    const existingSlug = await prisma.service.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

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
    if (images.length === 0 && Array.isArray(body.images)) {
      images.push(...body.images);
    }

    const basePrice = body.basePrice || body.packages?.basic?.price || 5;
    const deliveryDays =
      body.baseDeliveryDays ||
      body.deliveryDays ||
      body.packages?.basic?.deliveryDays ||
      7;
    const revisions = body.packages?.basic?.revisions || 1;

    const descriptionText =
      body.descriptionText ||
      (typeof body.description === "object" && body.description?.text
        ? body.description.text
        : typeof body.description === "string"
          ? body.description
          : "");

    // Build ServiceMedia entries from wizard data
    const mediaEntries: { url: string; type: string; isPrimary: boolean; order: number }[] = [];
    if (body.mainImage?.url) {
      mediaEntries.push({ url: body.mainImage.url, type: "IMAGE", isPrimary: true, order: 0 });
    }
    if (Array.isArray(body.additionalImages)) {
      body.additionalImages.forEach((img: { url?: string }, idx: number) => {
        if (img?.url) {
          mediaEntries.push({ url: img.url, type: "IMAGE", isPrimary: false, order: idx + 1 });
        }
      });
    }
    if (body.videoUrl) {
      mediaEntries.push({ url: body.videoUrl, type: "VIDEO", isPrimary: false, order: mediaEntries.length });
    }

    // Build ServiceOption entries
    const optionEntries: { name: string; price: number; description?: string }[] = [];
    if (Array.isArray(body.options)) {
      for (const opt of body.options) {
        if (opt?.name && opt?.price != null) {
          optionEntries.push({ name: opt.name, price: opt.price, description: opt.description || "" });
        }
      }
    }

    const service = await prisma.service.create({
      data: {
        title: body.title,
        slug,
        language: body.language || "fr",
        description:
          typeof body.description === "object" ? body.description : undefined,
        descriptionText: descriptionText || undefined,
        categoryId: body.categoryId,
        subCategoryId: body.subCategoryId || undefined,
        userId: session.user.id,
        status: "EN_ATTENTE",
        basePrice,
        price: basePrice,
        deliveryDays,
        revisions,
        instructionsRequired: body.instructionsRequired || false,
        instructionsContent: body.instructionsContent || undefined,
        tags: Array.isArray(body.tags) ? body.tags : [],
        images,
        packages: body.packages || {
          basic: {
            name: "Basique",
            price: basePrice,
            deliveryDays,
            revisions: 1,
            description: "",
          },
          standard: {
            name: "Standard",
            price: Math.round(basePrice * 1.8),
            deliveryDays,
            revisions: 3,
            description: "",
          },
          premium: {
            name: "Premium",
            price: Math.round(basePrice * 3),
            deliveryDays: Math.max(1, deliveryDays - 1),
            revisions: 5,
            description: "",
          },
        },
        faq: Array.isArray(body.faq) ? body.faq : undefined,
        extras: Array.isArray(body.extras) ? body.extras : undefined,
        ...(mediaEntries.length > 0 ? {
          media: {
            create: mediaEntries,
          },
        } : {}),
        ...(optionEntries.length > 0 ? {
          options: {
            create: optionEntries,
          },
        } : {}),
      },
      include: { category: true, options: true, media: true },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Service soumis",
        message: `Votre service "${body.title}" est en attente de validation`,
        type: "SYSTEM",
        link: `/dashboard/services`,
      },
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
