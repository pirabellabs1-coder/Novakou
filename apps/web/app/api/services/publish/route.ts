import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { fullServiceSchema } from "@/lib/validations/service";
import { canCreateService, normalizePlanName, getPlanLimits, formatLimit } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    // Authentification obligatoire
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    // Seuls les freelances et agences peuvent publier
    if (!["freelance", "agence"].includes(session.user.role)) {
      return NextResponse.json({ error: "Seuls les freelances et agences peuvent publier des services" }, { status: 403 });
    }

    // Verification KYC obligatoire (niveau 3 minimum pour publier)
    if ((session.user.kyc ?? 1) < 3) {
      return NextResponse.json(
        {
          error: "Verification d'identite requise pour publier un service. Completez votre KYC (niveau 3 minimum).",
          code: "KYC_REQUIRED",
          requiredLevel: 3,
          currentLevel: session.user.kyc ?? 1,
          redirectTo: "/dashboard/kyc",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const userPlan = normalizePlanName(session.user.plan);

    // The frontend sends fields at root level
    const result = fullServiceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Check service limit by plan (using authoritative plan rules)
    const activeServicesCount = body.activeServicesCount || 0;
    const planLimits = getPlanLimits(userPlan);
    if (!canCreateService(userPlan, activeServicesCount)) {
      return NextResponse.json(
        {
          error: `Vous avez atteint la limite de ${formatLimit(planLimits.serviceLimit)} services pour le plan ${planLimits.name}. Passez a un plan superieur pour publier plus de services.`,
          code: "SERVICE_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    // TODO: Production — create service in DB via Prisma
    // const service = await prisma.service.create({
    //   data: {
    //     title: result.data.title,
    //     slug: generateSlug(result.data.title),
    //     language: result.data.language,
    //     description: result.data.description,
    //     categoryId: result.data.categoryId,
    //     subCategoryId: result.data.subCategoryId,
    //     userId: session.user.id,
    //     status: 'EN_ATTENTE',
    //     basePrice: result.data.basePrice,
    //     price: result.data.basePrice,
    //     deliveryDays: result.data.baseDeliveryDays,
    //     instructionsRequired: result.data.instructionsRequired,
    //     instructionsContent: result.data.instructionsContent,
    //     options: { create: result.data.options },
    //     media: { create: mediaEntries },
    //     serviceTags: { create: tagEntries },
    //   },
    // });

    const serviceId = `svc_${Date.now()}`;

    return NextResponse.json({
      serviceId,
      status: "EN_ATTENTE",
      message:
        "Votre service a été soumis ! Il sera visible après validation par notre équipe (sous 24h). Vous recevrez une notification par email.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur de publication" }, { status: 500 });
  }
}
