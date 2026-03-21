import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { serviceStore, notificationStore } from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";
import { sendServiceApprovedEmail, sendServiceRejectedEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/admin/audit";

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

    if (IS_DEV) {
      const service = serviceStore.getById(id);
      if (!service) {
        return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
      }

      switch (action) {
        case "approve": {
          serviceStore.update(id, { status: "actif", refuseReason: undefined });
          notificationStore.add({ userId: service.userId, title: "Service approuve", message: `Votre service "${service.title}" a ete approuve !`, type: "service", read: false, link: "/dashboard/services" });
          const approveUser = devStore.findById(service.userId);
          if (approveUser?.email) sendServiceApprovedEmail(approveUser.email, approveUser.name, service.title).catch(() => {});
          return NextResponse.json({ success: true, message: `Service "${service.title}" approuve` });
        }
        case "refuse": {
          const refuseReason = reason || "Non conforme aux directives de la plateforme";
          serviceStore.update(id, { status: "refuse", refuseReason });
          notificationStore.add({ userId: service.userId, title: "Service refuse", message: `Votre service "${service.title}" a ete refuse. Motif : ${refuseReason}`, type: "service", read: false, link: "/dashboard/services" });
          const refuseUser = devStore.findById(service.userId);
          if (refuseUser?.email) sendServiceRejectedEmail(refuseUser.email, refuseUser.name, service.title, refuseReason).catch(() => {});
          return NextResponse.json({ success: true, message: `Service "${service.title}" refuse` });
        }
        case "feature": {
          serviceStore.update(id, { status: "actif", isBoosted: true });
          notificationStore.add({ userId: service.userId, title: "Service mis en avant", message: `Votre service "${service.title}" a ete mis en avant !`, type: "service", read: false, link: "/dashboard/services" });
          return NextResponse.json({ success: true, message: `Service "${service.title}" mis en vedette` });
        }
        case "unfeature": {
          serviceStore.update(id, { isBoosted: false });
          return NextResponse.json({ success: true, message: `Service "${service.title}" retire de la vedette` });
        }
        case "pause": {
          serviceStore.update(id, { status: "pause" });
          notificationStore.add({ userId: service.userId, title: "Service mis en pause", message: `Votre service "${service.title}" a ete mis en pause par l'administration.`, type: "service", read: false, link: "/dashboard/services" });
          return NextResponse.json({ success: true, message: `Service "${service.title}" mis en pause` });
        }
        case "delete": {
          serviceStore.delete(id);
          notificationStore.add({ userId: service.userId, title: "Service supprime", message: `Votre service "${service.title}" a ete supprime par l'administration.`, type: "service", read: false, link: "/dashboard/services" });
          return NextResponse.json({ success: true, message: `Service "${service.title}" supprime` });
        }
        default:
          return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
      }
    }

    // ── Production: Prisma ──
    const service = await prisma.service.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!service) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      approve: "ACTIF",
      refuse: "REFUSE",
      feature: "VEDETTE",
      unfeature: "ACTIF",
      pause: "PAUSE",
    };

    if (!statusMap[action] && action !== "delete") {
      return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.service.delete({ where: { id } });
      await prisma.notification.create({
        data: { userId: service.userId, title: "Service supprime", message: `Votre service "${service.title}" a ete supprime par l'administration.`, type: "ADMIN_ACTION" },
      });
      await createAuditLog({ actorId: session.user.id, action: "service.deleted", targetType: "service", targetId: id, targetUserId: service.userId, details: { title: service.title } });
      return NextResponse.json({ success: true, message: `Service "${service.title}" supprime` });
    }

    const updateData: Record<string, unknown> = { status: statusMap[action] };
    if (action === "refuse") updateData.refuseReason = reason || "Non conforme aux directives de la plateforme";
    if (action === "approve") updateData.refuseReason = null;
    if (action === "feature") updateData.isBoosted = true;
    if (action === "unfeature") updateData.isBoosted = false;

    await prisma.service.update({ where: { id }, data: updateData });

    // Notification in-app
    const notifTitles: Record<string, string> = {
      approve: "Service approuve",
      refuse: "Service refuse",
      feature: "Service mis en avant",
      unfeature: "Service retire de la mise en avant",
      pause: "Service mis en pause",
    };
    const notifMessages: Record<string, string> = {
      approve: `Votre service "${service.title}" a ete approuve ! Il est maintenant visible sur la marketplace.`,
      refuse: `Votre service "${service.title}" a ete refuse. Motif : ${reason || "Non conforme"}`,
      feature: `Votre service "${service.title}" a ete mis en avant sur la marketplace !`,
      unfeature: `Votre service "${service.title}" n'est plus mis en avant.`,
      pause: `Votre service "${service.title}" a ete mis en pause par l'administration.`,
    };

    // Notification + email + audit (non-blocking — ne doit pas faire echouer l'action)
    try {
      await prisma.notification.create({
        data: { userId: service.userId, title: notifTitles[action], message: notifMessages[action], type: "ADMIN_ACTION", link: "/dashboard/services" },
      });
    } catch (notifErr) { console.error("[Service] Notification error:", notifErr); }

    if (action === "approve") {
      sendServiceApprovedEmail(service.user.email, service.user.name, service.title).catch((err) =>
        console.error("[Admin] Failed to send service approved email to", service.user.email, err)
      );
    }
    if (action === "refuse") {
      sendServiceRejectedEmail(service.user.email, service.user.name, service.title, reason || "Non conforme aux directives").catch((err) =>
        console.error("[Admin] Failed to send service rejected email to", service.user.email, err)
      );
    }

    await createAuditLog({
      actorId: session.user.id,
      action: `service.${action}`,
      targetType: "service",
      targetId: id,
      targetUserId: service.userId,
      details: { title: service.title, reason },
    }).catch((err) => console.error("[Service] Audit error:", err));

    return NextResponse.json({ success: true, message: `Service "${service.title}" ${action}` });
  } catch (error) {
    console.error("[API /admin/services/[id] PATCH]", error);
    return NextResponse.json({ error: "Erreur lors de l'action admin" }, { status: 500 });
  }
}
