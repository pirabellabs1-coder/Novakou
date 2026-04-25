import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/api-rate-limit";

/**
 * POST /api/formations/newsletter
 * Subscribe an email to the newsletter via Resend audiences.
 * Falls back to console log if RESEND_AUDIENCE_ID is not configured.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
    }

    // Rate limit: 5 subscriptions per hour per email
    const rl = rateLimit(`newsletter:${email}`, 5, 3600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Vous êtes déjà inscrit." }, { status: 429 });
    }

    const audienceId = process.env.RESEND_AUDIENCE_ID;
    const apiKey = process.env.RESEND_API_KEY;

    if (audienceId && apiKey) {
      // Production: add to Resend audience
      const res = await fetch("https://api.resend.com/audiences/" + audienceId + "/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`[newsletter] Resend audience error: ${err}`);
        // Don't fail — still return success to user (email is noted)
      } else {
        console.log(`[newsletter] Added to Resend audience: ${email}`);
      }
    } else {
      console.log(`[newsletter] Subscription recorded (no RESEND_AUDIENCE_ID): ${email}`);
    }

    return NextResponse.json({ data: { ok: true, email } });
  } catch (err) {
    console.error("[newsletter POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
