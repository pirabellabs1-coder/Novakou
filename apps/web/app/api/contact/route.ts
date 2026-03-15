import { NextRequest, NextResponse } from "next/server";
import { contactStore } from "@/lib/dev/data-store";
import { Resend } from "resend";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "contact@freelancehigh.com";
const FROM = process.env.EMAIL_FROM || "FreelanceHigh <noreply@freelancehigh.com>";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      );
    }

    // Rate limit: 5 attempts per 15 min per email
    const rateLimitKey = `contact:${email}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez patienter avant de reessayer." },
        { status: 429 }
      );
    }
    recordFailedAttempt(rateLimitKey);

    // Save to dev-store (always, for backup/dev)
    const msg = contactStore.create({ name, email, subject, message });

    // Send email via Resend if configured
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM,
          to: CONTACT_EMAIL,
          replyTo: email,
          subject: `[Contact] ${subject}`,
          html: `
            <h2>Nouveau message de contact</h2>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Sujet :</strong> ${subject}</p>
            <hr/>
            <p>${message.replace(/\n/g, "<br/>")}</p>
          `,
        });
      } catch (emailError) {
        console.error("[API /contact] Erreur envoi email:", emailError);
      }
    }

    return NextResponse.json({ success: true, id: msg.id }, { status: 201 });
  } catch (error) {
    console.error("[API /contact POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
