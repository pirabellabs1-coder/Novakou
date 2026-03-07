import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { serviceStore, notificationStore } from "@/lib/dev/data-store";

// POST /api/services/[id]/toggle — Toggle service status between "actif" and "pause"
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const service = serviceStore.getById(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (service.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    // Only allow toggling between "actif" and "pause"
    if (service.status !== "actif" && service.status !== "pause") {
      return NextResponse.json(
        {
          error: `Impossible de basculer le statut. Le service est actuellement "${service.status}". Seuls les services actifs ou en pause peuvent etre bascules.`,
        },
        { status: 400 }
      );
    }

    const updatedService = serviceStore.toggleStatus(id);

    if (!updatedService) {
      return NextResponse.json(
        { error: "Impossible de basculer le statut du service" },
        { status: 400 }
      );
    }

    // Create a notification about the status change
    const isNowActive = updatedService.status === "actif";
    notificationStore.add({
      userId: session.user.id,
      title: isNowActive ? "Service reactive" : "Service mis en pause",
      message: isNowActive
        ? `Votre service "${updatedService.title}" est de nouveau visible sur le marketplace.`
        : `Votre service "${updatedService.title}" a ete mis en pause. Il n'est plus visible sur le marketplace.`,
      type: "service",
      read: false,
      link: "/dashboard/services",
    });

    return NextResponse.json({
      service: updatedService,
      message: isNowActive
        ? "Service reactive avec succes"
        : "Service mis en pause avec succes",
    });
  } catch (error) {
    console.error("[API /services/[id]/toggle POST]", error);
    return NextResponse.json(
      { error: "Erreur lors du basculement du statut du service" },
      { status: 500 }
    );
  }
}
