import { NextRequest, NextResponse } from "next/server";
import { fullServiceSchema, SERVICES_LIMITS } from "@/lib/validations/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userPlan = body.userPlan || "GRATUIT";

    // The frontend sends fields at root level
    const result = fullServiceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Check service limit by plan
    const activeServicesCount = body.activeServicesCount || 0;
    const limit = SERVICES_LIMITS[userPlan] || 3;
    if (activeServicesCount >= limit) {
      return NextResponse.json(
        {
          error: `Vous avez atteint la limite de ${limit} services pour le plan ${userPlan}. Passez à un plan supérieur pour publier plus de services.`,
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
