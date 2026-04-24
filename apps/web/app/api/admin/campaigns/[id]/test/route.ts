import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { sendAdminCampaignEmail } from "@/lib/email/admin-campaign";

/**
 * POST /api/admin/campaigns/[id]/test
 * Body : { to?: string }  — par défaut envoie à l'email de l'admin connecté
 *
 * Envoie un email TEST (1 seul destinataire) pour vérifier le rendu
 * avant l'envoi en masse. Marque le destinataire avec [TEST] dans l'objet.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const campaign = await prisma.adminCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });

  let body: { to?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const to = (body.to || session.user.email || "").toLowerCase().trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Email destinataire invalide" }, { status: 400 });
  }

  const firstName = session.user.name?.split(" ")[0] || null;

  const result = await sendAdminCampaignEmail({
    to,
    firstName,
    subject: `[TEST] ${campaign.subject}`,
    htmlBody: campaign.htmlBody,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Envoi test échoué : " + (result.error || "inconnu") },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { sent: true, to, resendId: result.id },
  });
}
