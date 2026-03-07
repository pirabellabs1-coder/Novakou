import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { serviceStore, notificationStore } from "@/lib/dev/data-store";

// PATCH /api/admin/services/[id] — Admin actions: approve, refuse, feature, unfeature, pause, delete
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    const service = serviceStore.getById(id);
    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable" },
        { status: 404 }
      );
    }

    switch (action) {
      case "approve": {
        serviceStore.update(id, { status: "actif", refuseReason: undefined });

        notificationStore.add({
          userId: service.userId,
          title: "Service approuve",
          message: `Votre service "${service.title}" a ete approuve ! Il est maintenant visible sur la marketplace.`,
          type: "service",
          read: false,
          link: "/dashboard/services",
        });

        return NextResponse.json({
          success: true,
          message: `Service "${service.title}" approuve`,
        });
      }

      case "refuse": {
        serviceStore.update(id, {
          status: "refuse",
          refuseReason: reason || "Non conforme aux directives de la plateforme",
        });

        notificationStore.add({
          userId: service.userId,
          title: "Service refuse",
          message: `Votre service "${service.title}" a ete refuse. Motif : ${reason || "Non conforme"}`,
          type: "service",
          read: false,
          link: "/dashboard/services",
        });

        return NextResponse.json({
          success: true,
          message: `Service "${service.title}" refuse`,
        });
      }

      case "feature": {
        serviceStore.update(id, { status: "actif", isBoosted: true });
        return NextResponse.json({
          success: true,
          message: `Service "${service.title}" mis en vedette`,
        });
      }

      case "unfeature": {
        serviceStore.update(id, { isBoosted: false });
        return NextResponse.json({
          success: true,
          message: `Service "${service.title}" retire de la vedette`,
        });
      }

      case "pause": {
        serviceStore.update(id, { status: "pause" });

        notificationStore.add({
          userId: service.userId,
          title: "Service mis en pause",
          message: `Votre service "${service.title}" a ete mis en pause par l'administration.`,
          type: "service",
          read: false,
          link: "/dashboard/services",
        });

        return NextResponse.json({
          success: true,
          message: `Service "${service.title}" mis en pause`,
        });
      }

      case "delete": {
        serviceStore.delete(id);

        notificationStore.add({
          userId: service.userId,
          title: "Service supprime",
          message: `Votre service "${service.title}" a ete supprime par l'administration.`,
          type: "service",
          read: false,
          link: "/dashboard/services",
        });

        return NextResponse.json({
          success: true,
          message: `Service "${service.title}" supprime`,
        });
      }

      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API /admin/services/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'action admin" },
      { status: 500 }
    );
  }
}
