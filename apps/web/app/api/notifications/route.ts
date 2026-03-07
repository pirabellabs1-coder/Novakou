import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { notificationStore } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const notifications = notificationStore.getByUser(session.user.id);
    const unreadCount = notificationStore.getUnreadCount(session.user.id);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[API /notifications GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des notifications" },
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
    const { id, all } = body;

    if (all) {
      notificationStore.markAllRead(session.user.id);
    } else if (id) {
      notificationStore.markRead(id);
    } else {
      return NextResponse.json(
        { error: "Parametres invalides : fournir 'id' ou 'all: true'" },
        { status: 400 }
      );
    }

    const notifications = notificationStore.getByUser(session.user.id);
    const unreadCount = notificationStore.getUnreadCount(session.user.id);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[API /notifications POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour des notifications" },
      { status: 500 }
    );
  }
}
