/**
 * Admin endpoint — test email templates.
 *
 * GET  → lists all registered templates ({ id, label, description, category })
 * POST → body: { templateId: string; to?: string }
 *        Sends a sample email (pre-filled with demo data) to the admin
 *        or to `to` if provided. Requires admin role.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// Transactional core templates
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendNewMessageEmail,
  sendPaymentReceivedEmail,
  sendServiceApprovedEmail,
  sendDeliveryNotificationEmail,
} from "@/lib/email";

// Mentor domain
import {
  sendMentorBookingRequestEmail,
  sendMentorBookingConfirmedEmail,
  sendMentorReminder24hEmail,
} from "@/lib/email/mentor";

// Formations / products / automations
import {
  sendEnrollmentConfirmedEmail,
  sendCertificateIssuedEmail,
  sendWithdrawalRequestEmail,
  sendAbandonedCartEmail1,
  sendDigitalProductDeliveryEmail,
} from "@/lib/email/formations";

import { sendInvoiceEmail } from "@/lib/email/invoice-email";

// ─── Template registry ──────────────────────────────────────────────────────
type TemplateDef = {
  id: string;
  label: string;
  description: string;
  category: "auth" | "order" | "mentor" | "kyc" | "payment" | "automation" | "formation";
  send: (to: string) => Promise<unknown>;
};

function buildRegistry(): TemplateDef[] {
  const demoName = "Alex Demo";
  const demoFreelancer = "Marie Freelancer";
  const demoClient = "Studio Client SARL";
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const deadline = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toLocaleDateString("fr-FR");

  return [
    // ── Auth ──
    {
      id: "welcome",
      label: "Email de bienvenue",
      description: "Envoyé après l'inscription",
      category: "auth",
      send: (to) => sendWelcomeEmail(to, demoName),
    },
    {
      id: "verify_email",
      label: "Code OTP de vérification",
      description: "Code à 6 chiffres envoyé pour vérifier l'email",
      category: "auth",
      send: (to) => sendVerificationEmail(to, demoName, "123456"),
    },
    {
      id: "reset_password",
      label: "Réinitialisation mot de passe",
      description: "Lien pour choisir un nouveau mot de passe",
      category: "auth",
      send: (to) =>
        sendPasswordResetEmail(to, demoName, "demo-reset-token-abc123"),
    },

    // ── Order / commerce ──
    {
      id: "order_confirmation",
      label: "Confirmation de commande",
      description: "Envoyée au client après paiement",
      category: "order",
      send: (to) =>
        sendOrderConfirmationEmail(to, demoName, {
          id: "ORD-2026-0042",
          serviceTitle: "Logo moderne pour startup tech",
          amount: 149.0,
          deadline,
        }),
    },
    {
      id: "payment_received",
      label: "Paiement reçu (freelance)",
      description: "Envoyé au freelance quand des fonds sont libérés",
      category: "payment",
      send: (to) =>
        sendPaymentReceivedEmail(to, demoName, {
          amount: 119.2,
          serviceTitle: "Logo moderne pour startup tech",
          orderId: "ORD-2026-0042",
        }),
    },
    {
      id: "new_message",
      label: "Nouveau message",
      description: "Notification lors d'un nouveau message reçu",
      category: "order",
      send: (to) =>
        sendNewMessageEmail(
          to,
          demoName,
          demoClient,
          "Bonjour, pouvez-vous me confirmer le délai pour la prochaine révision ? Merci !",
          "https://freelancehigh.com/dashboard/messages/demo"
        ),
    },
    {
      id: "service_approved",
      label: "Service publié / approuvé",
      description: "Envoyé quand la modération approuve un service",
      category: "order",
      send: (to) =>
        sendServiceApprovedEmail(to, demoName, "Logo moderne pour startup tech"),
    },
    {
      id: "delivery_notification",
      label: "Livraison effectuée",
      description: "Envoyé au client quand le freelance livre",
      category: "order",
      send: (to) =>
        sendDeliveryNotificationEmail(to, demoName, {
          id: "ORD-2026-0042",
          serviceTitle: "Logo moderne pour startup tech",
          freelanceName: demoFreelancer,
        }),
    },

    // ── KYC ──
    {
      id: "kyc_approved",
      label: "KYC approuvé",
      description: "Vérification d'identité validée",
      category: "kyc",
      send: (to) => sendKycApprovedEmail(to, demoName, 3),
    },
    {
      id: "kyc_rejected",
      label: "KYC refusé",
      description: "Vérification d'identité rejetée avec motif",
      category: "kyc",
      send: (to) =>
        sendKycRejectedEmail(
          to,
          demoName,
          3,
          "Le document d'identité fourni est illisible. Merci de soumettre une photo claire."
        ),
    },

    // ── Mentor ──
    {
      id: "mentor_booking_request",
      label: "Nouvelle demande de séance (mentor)",
      description: "Envoyé au mentor pour nouvelle réservation",
      category: "mentor",
      send: (to) =>
        sendMentorBookingRequestEmail({
          to,
          mentorName: demoFreelancer,
          menteeName: demoName,
          packageTitle: "Séance de mentorat — 60 min",
          sessionDate: tomorrow.toLocaleDateString("fr-FR"),
          sessionTime: "14:00",
          dashboardUrl: "https://freelancehigh.com/formations/mentor/rendez-vous",
        }),
    },
    {
      id: "mentor_booking_confirmed",
      label: "Séance confirmée (apprenant)",
      description: "Envoyé à l'apprenant quand le mentor confirme",
      category: "mentor",
      send: (to) =>
        sendMentorBookingConfirmedEmail({
          to,
          menteeName: demoName,
          mentorName: demoFreelancer,
          packageTitle: "Séance de mentorat — 60 min",
          sessionDate: tomorrow.toLocaleDateString("fr-FR"),
          sessionTime: "14:00",
          meetingUrl: "https://meet.google.com/demo-link",
          dashboardUrl: "https://freelancehigh.com/formations/apprenant/sessions",
        }),
    },
    {
      id: "mentor_reminder_24h",
      label: "Rappel séance J-1",
      description: "Rappel 24h avant la séance mentor",
      category: "mentor",
      send: (to) =>
        sendMentorReminder24hEmail({
          to,
          recipientName: demoName,
          otherPartyName: demoFreelancer,
          packageTitle: "Séance de mentorat — 60 min",
          sessionDate: tomorrow.toLocaleDateString("fr-FR"),
          sessionTime: "14:00",
          meetingUrl: "https://meet.google.com/demo-link",
        }),
    },

    // ── Formations / Products / Automation ──
    {
      id: "enrollment_confirmed",
      label: "Inscription formation confirmée",
      description: "Apprenant inscrit à une formation",
      category: "formation",
      send: (to) =>
        sendEnrollmentConfirmedEmail({
          to,
          studentName: demoName,
          formationTitle: "Maîtriser le copywriting en 30 jours",
          instructorName: demoFreelancer,
          formationUrl: "https://freelancehigh.com/formations/apprenant/mes-cours",
        }),
    },
    {
      id: "certificate_issued",
      label: "Certificat délivré",
      description: "Envoyé à l'apprenant lors de la fin d'une formation",
      category: "formation",
      send: (to) =>
        sendCertificateIssuedEmail({
          to,
          studentName: demoName,
          formationTitle: "Maîtriser le copywriting en 30 jours",
          certificateUrl: "https://freelancehigh.com/certificats/demo",
        }),
    },
    {
      id: "withdrawal_request",
      label: "Demande de retrait soumise",
      description: "Envoyé au vendeur après demande de retrait",
      category: "payment",
      send: (to) =>
        sendWithdrawalRequestEmail({
          to,
          userName: demoName,
          amount: 450,
          method: "Virement SEPA",
        }),
    },
    {
      id: "abandoned_cart",
      label: "Panier abandonné (automation)",
      description: "Relance automatique 1h après abandon",
      category: "automation",
      send: (to) =>
        sendAbandonedCartEmail1({
          to,
          customerName: demoName,
          productName: "Formation — Copywriting avancé",
          productPrice: 97,
          checkoutUrl: "https://freelancehigh.com/checkout/demo",
        }),
    },
    {
      id: "digital_delivery",
      label: "Livraison produit digital",
      description: "Envoyé après achat d'un produit téléchargeable",
      category: "formation",
      send: (to) =>
        sendDigitalProductDeliveryEmail({
          to,
          customerName: demoName,
          productName: "Pack de templates Notion",
          downloadUrl: "https://freelancehigh.com/downloads/demo",
          expiresAt: tomorrow.toLocaleDateString("fr-FR"),
        }),
    },

    // ── Invoice ──
    {
      id: "invoice",
      label: "Facture PDF",
      description: "Facture envoyée au client",
      category: "payment",
      send: (to) =>
        sendInvoiceEmail({
          to,
          userName: demoName,
          invoice: {
            id: "INV-2026-0042",
            number: "FH-2026-042",
            amount: 149.0,
            currency: "EUR",
            date: now.toLocaleDateString("fr-FR"),
            pdfUrl: "https://freelancehigh.com/factures/demo.pdf",
          },
        }),
    },
  ];
}

// ─── Auth helper ────────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !["admin", "ADMIN"].includes(role ?? "")) {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

// ─── GET — list templates ───────────────────────────────────────────────────
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const registry = buildRegistry();
  const list = registry.map(({ id, label, description, category }) => ({
    id,
    label,
    description,
    category,
  }));
  return NextResponse.json({ data: list, count: list.length });
}

// ─── POST — send one test ───────────────────────────────────────────────────
export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  let body: { templateId?: string; to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const templateId = body.templateId;
  if (!templateId) {
    return NextResponse.json({ error: "templateId requis" }, { status: 400 });
  }

  const recipient = body.to?.trim() || session?.user?.email;
  if (!recipient) {
    return NextResponse.json(
      { error: "Aucun destinataire (to absent et admin sans email)" },
      { status: 400 }
    );
  }

  const registry = buildRegistry();
  const template = registry.find((t) => t.id === templateId);
  if (!template) {
    return NextResponse.json(
      { error: `Template inconnu: ${templateId}` },
      { status: 404 }
    );
  }

  try {
    await template.send(recipient);
    return NextResponse.json({
      data: { sent: true, to: recipient, templateId, label: template.label },
    });
  } catch (err) {
    console.error(`[admin/emails/test] failed for ${templateId}:`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erreur lors de l'envoi du test",
      },
      { status: 500 }
    );
  }
}
