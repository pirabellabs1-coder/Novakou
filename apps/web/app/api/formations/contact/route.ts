import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { emailLayout, button } from "@/lib/email";

/**
 * Public contact form endpoint.
 *
 * Flow on submission:
 *  1. Validate + persist a SupportTicket (with NK-XXXXXXXX reference).
 *  2. Send a confirmation email to the visitor (immediate receipt).
 *  3. Call the AI (Claude via Anthropic if ANTHROPIC_API_KEY is set, else
 *     OpenAI gpt-4o-mini fallback) to generate a personalized auto-reply.
 *  4. Email the auto-reply to the visitor and persist it on the ticket.
 *  5. Notify support@novakou.com so a human can follow up if needed.
 *
 * Visible on /admin/tickets afterwards.
 */

const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const ADMIN_EMAIL = "support@novakou.com";

function generateRef(): string {
  // 8 chars base32 = 40 bits of entropy (~ 1.1 trillion combinations)
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let r = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (let i = 0; i < 8; i++) r += alphabet[bytes[i] % alphabet.length];
  return `NK-${r}`;
}

async function generateAiReply(params: {
  name: string;
  subject: string;
  message: string;
}): Promise<{ reply: string; model: string } | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `Tu es l'assistant support officiel de Novakou — la plateforme africaine francophone de formations, produits digitaux, mentorat et affiliation.

Ta mission: répondre AVEC EMPATHIE et UTILITÉ au message d'un visiteur.

Règles strictes:
- Tutoie pas, vouvoie l'utilisateur (registre professionnel chaleureux)
- Réponds DIRECTEMENT à la question / demande, sans formules creuses
- Si tu ne sais pas, dis-le clairement et indique qu'un humain reviendra sous 24h
- Mentionne les ressources Novakou pertinentes (centre d'aide /aide, /apprenant, /vendeur, /mentors, /affiliation, /tarifs)
- Si la personne a un problème de paiement / commande / KYC : dis qu'un humain reprend la main et donnera suite par email
- Ton réponse fait MAX 200 mots, claire et structurée
- Termine TOUJOURS par "— L'équipe Novakou" sur une nouvelle ligne
- Pas de markdown lourd (pas de **, pas de tableaux), texte fluide
- En français uniquement`;

  const userPrompt = `Message reçu (sujet: ${params.subject || "général"}) de ${params.name}:\n\n${params.message}`;

  // Prefer Anthropic if available
  if (anthropicKey) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-7",
          max_tokens: 800,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const reply =
          (j.content?.[0]?.text as string | undefined) ?? "";
        if (reply) return { reply, model: "claude-opus-4-7" };
      } else {
        console.warn("[contact AI] anthropic failed", r.status, await r.text().catch(() => ""));
      }
    } catch (e) {
      console.warn("[contact AI] anthropic exception", e);
    }
  }

  if (openaiKey) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 800,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const reply =
          (j.choices?.[0]?.message?.content as string | undefined) ?? "";
        if (reply) return { reply, model: "gpt-4o-mini" };
      } else {
        console.warn("[contact AI] openai failed", r.status, await r.text().catch(() => ""));
      }
    } catch (e) {
      console.warn("[contact AI] openai exception", e);
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const reference = generateRef();
    const cleanSubject = (subject ?? "general").slice(0, 200);
    const cleanMessage = message.slice(0, 5000);
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") ?? null;

    // 1. Persist ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        reference,
        name: name.trim().slice(0, 200),
        email: email.trim().toLowerCase(),
        subject: cleanSubject,
        message: cleanMessage,
        status: "NEW",
        ipAddress,
        userAgent: userAgent?.slice(0, 500) ?? null,
      },
    });

    const resendKey = process.env.RESEND_API_KEY;
    const resend = resendKey ? new Resend(resendKey) : null;

    // 2. Confirmation email to visitor
    if (resend) {
      const confirmationHtml = emailLayout(`
        <h2 style="color:#111827;font-size:22px;margin:0 0 12px;">Bonjour ${escapeHtml(name)},</h2>
        <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Nous avons bien reçu votre message — merci de nous avoir contactés.
        </p>
        <div style="background:#f9fafb;border-left:3px solid #006e2f;padding:14px 18px;border-radius:8px;margin:0 0 20px;">
          <p style="font-size:11px;font-weight:700;color:#5c647a;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Référence ticket</p>
          <p style="font-size:18px;font-weight:800;color:#006e2f;font-family:monospace;margin:0;">${reference}</p>
        </div>
        <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 8px;"><strong>Sujet :</strong> ${escapeHtml(cleanSubject)}</p>
        <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px;"><strong>Votre message :</strong></p>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin:0 0 20px;color:#111827;font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(cleanMessage)}</div>
        <p style="color:#4b5563;font-size:13px;line-height:1.6;margin:0 0 16px;">
          Notre équipe IA va analyser votre message et vous envoyer une première réponse dans quelques instants.
          Si nécessaire, un humain prendra le relais sous 24 heures ouvrées.
        </p>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:24px 0 0;">
          Rappel : ne partagez jamais votre mot de passe avec qui que ce soit, même un membre de l'équipe Novakou.
        </p>
      `);
      await resend.emails.send({
        from: FROM,
        to: ticket.email,
        subject: `Confirmation de votre message — ${reference}`,
        html: confirmationHtml,
      }).catch((e) => console.warn("[contact] confirmation email", e));
    }

    // 3. AI auto-reply (background — don't block the response)
    if (resend) {
      generateAiReply({ name, subject: cleanSubject, message: cleanMessage })
        .then(async (ai) => {
          if (!ai) return;
          // Persist the AI reply on the ticket
          await prisma.supportTicket.update({
            where: { id: ticket.id },
            data: {
              aiReply: ai.reply,
              aiReplyModel: ai.model,
              aiReplySentAt: new Date(),
              status: "AUTO_REPLIED",
            },
          }).catch((e) => console.warn("[contact] save aiReply", e));

          // Email the AI reply to the visitor
          const aiEmailHtml = emailLayout(`
            <h2 style="color:#111827;font-size:22px;margin:0 0 12px;">Notre première réponse</h2>
            <p style="color:#6b7280;font-size:13px;margin:0 0 18px;">Référence : <span style="font-family:monospace;font-weight:700;color:#006e2f;">${reference}</span></p>
            <div style="color:#111827;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(ai.reply)}</div>
            <div style="margin-top:24px;padding:14px 18px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;">
              <p style="color:#78350f;font-size:13px;margin:0;line-height:1.6;">
                <strong>Cette réponse est-elle complète ?</strong> Si vous avez besoin d'un humain, répondez simplement à cet email. Notre équipe revient vers vous sous 24h ouvrées.
              </p>
            </div>
            <div style="margin-top:24px;text-align:center;">
              ${button("Voir le centre d'aide", `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/aide`)}
            </div>
          `);
          await resend.emails.send({
            from: FROM,
            to: ticket.email,
            subject: `Re: ${cleanSubject} — ${reference}`,
            replyTo: ADMIN_EMAIL,
            html: aiEmailHtml,
          }).catch((e) => console.warn("[contact] AI email", e));
        })
        .catch((e) => console.warn("[contact] AI generation", e));
    }

    // 4. Admin notification
    if (resend) {
      const adminHtml = `
        <div style="font-family:-apple-system,sans-serif;max-width:680px;margin:0 auto;padding:24px;">
          <h2 style="color:#111827;font-size:18px;margin:0 0 12px;">Nouveau ticket support — ${reference}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;color:#111827;margin:0 0 16px;">
            <tr><td style="padding:6px 0;color:#6b7280;width:120px;">De</td><td><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Sujet</td><td>${escapeHtml(cleanSubject)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">IP</td><td>${escapeHtml(ipAddress ?? "—")}</td></tr>
          </table>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;color:#111827;white-space:pre-wrap;">${escapeHtml(cleanMessage)}</div>
          <p style="margin:20px 0 0;text-align:center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/admin/tickets/${ticket.id}" style="display:inline-block;padding:10px 18px;background:#006e2f;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Voir dans le tableau de bord</a>
          </p>
        </div>`;
      resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        replyTo: email,
        subject: `[Support ${reference}] ${cleanSubject} — ${name}`,
        html: adminHtml,
      }).catch((e) => console.warn("[contact] admin notif", e));
    }

    return NextResponse.json({ data: { reference, sent: true } });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
