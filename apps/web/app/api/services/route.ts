import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import {
  serviceStore,
  notificationStore,
  profileStore,
  getCategoryName,
  getSubCategoryName,
} from "@/lib/dev/data-store";
import { canCreateService, normalizePlanName } from "@/lib/plans";
import { emitEvent } from "@/lib/events/dispatcher";
import { notifyAdmins } from "@/lib/admin/notify";

// GET /api/services — List services for current authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const services = serviceStore.getByUser(session.user.id);

      return NextResponse.json(services);
    }

    // Production: Prisma — with REAL stats from related data
    // Include services owned by user OR owned by user's agency
    const userRole = (session.user as Record<string, unknown>).role as string;
    let serviceWhere: Record<string, unknown> = { userId: session.user.id };
    if (userRole === "AGENCE" || userRole === "agence") {
      const agencyProfile = await prisma.agencyProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (agencyProfile) {
        serviceWhere = { OR: [{ userId: session.user.id }, { agencyId: agencyProfile.id }] };
      }
    }

    // Try full query with new relations first; fall back to basic if tables don't exist yet
    let enriched;
    try {
      const services = await prisma.service.findMany({
        where: serviceWhere,
        include: {
          category: true,
          options: true,
          media: true,
          _count: {
            select: {
              viewTracking: true,
              clickTracking: true,
              reviews: true,
              propositions: true,
            },
          },
          orders: {
            where: { status: "TERMINE" },
            select: { id: true, freelancerPayout: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      enriched = services.map((s) => ({
        ...s,
        views: s._count.viewTracking || s.views,
        clicks: s._count.clickTracking,
        orderCount: s.orders.length || s.orderCount,
        totalRevenue: s.orders.reduce((sum, o) => sum + (o.freelancerPayout || 0), 0) || s.totalRevenue,
        ratingCount: s._count.reviews || s.ratingCount,
        totalContacts: s._count.propositions || s.totalContacts,
        orders: undefined,
        _count: undefined,
      }));
    } catch {
      // Fallback: basic query without new Phase 1 relations (migration not yet deployed)
      const services = await prisma.service.findMany({
        where: serviceWhere,
        include: {
          category: true,
          _count: { select: { reviews: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      enriched = services.map((s) => ({
        ...s,
        ratingCount: s._count?.reviews || s.ratingCount,
        _count: undefined,
      }));
    }

    return NextResponse.json(enriched);
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
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const activeServices = serviceStore.getByUser(session.user.id)
        .filter((s) => s.status === "actif" || s.status === "en_attente");
      if (!canCreateService(userPlan, activeServices.length)) {
        const limit = userPlan === "DECOUVERTE" ? 5 : "illimite";
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

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
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
          `${body.title} - Service professionnel sur Novakou`,
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
        message: `Votre service "${service.title}" est en attente de validation par l'equipe.`,
        type: "service",
        read: false,
        link: `/dashboard/services`,
      });

      // Notify admins about new service to review
      notifyAdmins({
        title: "Service a valider",
        message: `"${service.title}" par ${session.user.name || "Freelance"} — en attente de validation`,
        type: "service",
        link: "/admin/services",
      }).catch(() => {});

      return NextResponse.json(service);
    }

    // Production: Prisma
    // Determine agencyId if user is an agency
    let agencyId: string | undefined;
    if ((session.user as Record<string, unknown>).role === "AGENCE" || (session.user as Record<string, unknown>).role === "agence") {
      const agencyProfile = await prisma.agencyProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (agencyProfile) {
        agencyId = agencyProfile.id;
      }
    }

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

    // Build ServiceMedia entries from wizard data (Prisma model uses sortOrder, not order)
    const mediaEntries: { url: string; type: "IMAGE" | "VIDEO"; isPrimary: boolean; sortOrder: number }[] = [];
    if (body.mainImage?.url) {
      mediaEntries.push({ url: body.mainImage.url, type: "IMAGE", isPrimary: true, sortOrder: 0 });
    }
    if (Array.isArray(body.additionalImages)) {
      body.additionalImages.forEach((img: { url?: string }, idx: number) => {
        if (img?.url) {
          mediaEntries.push({ url: img.url, type: "IMAGE", isPrimary: false, sortOrder: idx + 1 });
        }
      });
    }
    if (body.videoUrl) {
      mediaEntries.push({ url: body.videoUrl, type: "VIDEO", isPrimary: false, sortOrder: mediaEntries.length });
    }

    // Build ServiceOption entries (Prisma model uses title/extraPrice, not name/price)
    const optionEntries: { title: string; extraPrice: number; description?: string; sortOrder: number }[] = [];
    if (Array.isArray(body.options)) {
      for (let i = 0; i < body.options.length; i++) {
        const opt = body.options[i];
        if ((opt?.name || opt?.title) && opt?.price != null) {
          optionEntries.push({
            title: opt.name || opt.title,
            extraPrice: Number(opt.price || opt.extraPrice || 0),
            description: opt.description || "",
            sortOrder: i,
          });
        }
      }
    }

    // Ensure category exists (upsert if needed)
    let categoryId = body.categoryId;
    const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existingCategory) {
      // Try by name/slug
      const byName = await prisma.category.findFirst({
        where: { OR: [{ name: categoryId }, { slug: categoryId }] },
      });
      if (byName) {
        categoryId = byName.id;
      } else {
        // Create the category on the fly
        const newCat = await prisma.category.create({
          data: {
            name: categoryId,
            slug: categoryId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          },
        });
        categoryId = newCat.id;
      }
    }

    // Handle subCategoryId — only include if valid
    let subCategoryId: string | undefined;
    if (body.subCategoryId) {
      const existingSub = await prisma.category.findUnique({ where: { id: body.subCategoryId } });
      if (existingSub) {
        subCategoryId = body.subCategoryId;
      }
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        title: body.title,
        slug,
        language: body.language || "fr",
        description:
          typeof body.description === "object" ? body.description : undefined,
        descriptionText: descriptionText || undefined,
        categoryId,
        ...(subCategoryId ? { subCategoryId } : {}),
        userId: session.user.id,
        ...(agencyId ? { agencyId } : {}),
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
          basic: { name: "Basique", price: basePrice, deliveryDays, revisions: 1, description: "" },
          standard: { name: "Standard", price: Math.round(basePrice * 1.8), deliveryDays, revisions: 3, description: "" },
          premium: { name: "Premium", price: Math.round(basePrice * 3), deliveryDays: Math.max(1, deliveryDays - 1), revisions: 5, description: "" },
        },
        faq: Array.isArray(body.faq) ? body.faq : undefined,
        extras: Array.isArray(body.extras) ? body.extras : undefined,
      },
      include: { category: true },
    });

    // Create media entries separately (avoid nested create type issues)
    if (mediaEntries.length > 0) {
      try {
        await prisma.serviceMedia.createMany({
          data: mediaEntries.map((m) => ({ ...m, serviceId: service.id })),
        });
      } catch (mediaErr) {
        console.error("[Service create] Media creation failed:", mediaErr);
      }
    }

    // Create option entries separately
    if (optionEntries.length > 0) {
      try {
        await prisma.serviceOption.createMany({
          data: optionEntries.map((o) => ({ ...o, serviceId: service.id })),
        });
      } catch (optErr) {
        console.error("[Service create] Options creation failed:", optErr);
      }
    }

    // Create notification (non-blocking)
    try {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: "Service soumis",
          message: `Votre service "${body.title}" est en attente de validation par l'equipe.`,
          type: "SYSTEM",
          link: `/dashboard/services`,
        },
      });
    } catch (notifErr) {
      console.error("[Service create] Notification failed:", notifErr);
    }

    // Notify admins about new service (non-blocking)
    emitEvent("admin.new_service", {
      serviceId: service.id,
      serviceTitle: body.title,
      userId: session.user.id,
      userName: session.user.name || "Freelance",
    }).catch(() => {});

    // Normalize response to match ApiService shape expected by frontend
    const cat = service.category as { id: string; name: string; slug: string } | null;
    const pkgs = (service.packages as Record<string, unknown>) || {};
    const defaultPkg = { name: "Basique", price: basePrice, deliveryDays, revisions: 1, description: "" };

    const normalizedService = {
      ...service,
      categoryName: cat?.name || body.categoryId,
      subCategoryName: body.subCategoryId || "",
      mainImage: images[0] || "",
      images,
      clicks: 0,
      orderCount: 0,
      revenue: 0,
      ratingCount: 0,
      seoScore: 0,
      boostTier: null,
      metaTitle: body.title,
      metaDescription: `${body.title} - Service professionnel sur Novakou`,
      vendorName: session.user.name || "Freelance",
      vendorAvatar: "",
      vendorUsername: session.user.id,
      vendorCountry: "",
      vendorBadges: [],
      vendorPlan: (session.user as Record<string, unknown>).plan || "gratuit",
      faq: service.faq || [],
      extras: service.extras || [],
      packages: {
        basic: (pkgs as Record<string, unknown>).basic || defaultPkg,
        standard: (pkgs as Record<string, unknown>).standard || { ...defaultPkg, name: "Standard", price: Math.round(basePrice * 1.8), revisions: 3 },
        premium: (pkgs as Record<string, unknown>).premium || { ...defaultPkg, name: "Premium", price: Math.round(basePrice * 3), revisions: 5 },
      },
    };

    return NextResponse.json(normalizedService);
  } catch (error) {
    console.error("[API /services POST]", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la création du service", details: message },
      { status: 500 }
    );
  }
}
