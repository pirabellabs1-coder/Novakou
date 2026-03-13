import { NextRequest, NextResponse } from "next/server";
import { orderStore, notificationStore } from "@/lib/dev/data-store";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel cron or manual trigger)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    const orders = orderStore.getAll();
    const activeOrders = orders.filter((o) => o.status === "en_cours");

    let reminders24h = 0;
    let remindersOverdue = 0;

    for (const order of activeOrders) {
      const deadlineTime = new Date(order.deadline).getTime();
      const timeLeft = deadlineTime - now;

      // Deadline in less than 24h (but not overdue) — within 2h detection window
      if (timeLeft > 0 && timeLeft <= TWENTY_FOUR_HOURS && timeLeft > TWENTY_FOUR_HOURS - TWO_HOURS) {
        // Notify freelance
        notificationStore.add({
          userId: order.freelanceId,
          title: "Rappel : livraison dans moins de 24h",
          message: `La commande "${order.serviceTitle}" doit etre livree avant le ${new Date(order.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
          type: "order",
          read: false,
          link: `/dashboard/commandes/${order.id}/suivi`,
        });
        reminders24h++;
      }

      // Deadline overdue — within 2h detection window
      if (timeLeft <= 0 && timeLeft > -TWO_HOURS) {
        // Notify freelance
        notificationStore.add({
          userId: order.freelanceId,
          title: "Delai depasse",
          message: `La commande "${order.serviceTitle}" a depasse son delai de livraison. Veuillez livrer au plus vite.`,
          type: "order",
          read: false,
          link: `/dashboard/commandes/${order.id}/suivi`,
        });

        // Notify client
        notificationStore.add({
          userId: order.clientId,
          title: "Delai de livraison depasse",
          message: `La commande "${order.serviceTitle}" a depasse son delai de livraison. Le freelance a ete notifie.`,
          type: "order",
          read: false,
          link: `/client/commandes/${order.id}`,
        });
        remindersOverdue++;
      }
    }

    return NextResponse.json({
      success: true,
      checked: activeOrders.length,
      reminders24h,
      remindersOverdue,
    });
  } catch (error) {
    console.error("[CRON deadline-reminder]", error);
    return NextResponse.json(
      { error: "Erreur lors de la verification des deadlines" },
      { status: 500 }
    );
  }
}
