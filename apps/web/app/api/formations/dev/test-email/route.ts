import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

/**
 * GET /api/formations/dev/test-email?to=foo@example.com
 * Dev-only: tests that Resend is properly configured and can send mails.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development" && process.env.DEV_MODE !== "true") {
    // only allow if explicitly enabled via header for safety
    if (request.headers.get("x-test-email-key") !== process.env.NEXTAUTH_SECRET?.slice(0, 16)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const url = new URL(request.url);
  const to = url.searchParams.get("to") || "support@novakou.com";

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

  const diagnostic: Record<string, unknown> = {
    apiKeyPresent: !!apiKey,
    apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}…` : null,
    from,
    to,
  };

  if (!apiKey) {
    return NextResponse.json({ ok: false, diagnostic, error: "RESEND_API_KEY missing" });
  }

  const result = await sendEmail({
    to,
    subject: "🧪 Test Novakou — Resend OK",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:24px auto;padding:24px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#006e2f;margin-top:0;">✅ Email reçu !</h2>
        <p>La configuration Resend de Novakou fonctionne.</p>
        <p style="font-size:12px;color:#6b7280;">Test envoyé le ${new Date().toISOString()}</p>
      </div>
    `,
  });

  return NextResponse.json({
    ok: !result.error,
    diagnostic,
    result: result.error ? { error: result.error } : { id: result.data?.id },
  });
}
