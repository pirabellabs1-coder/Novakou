// GET /api/debug/email — Diagnostic email (temporary, remove in production)
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  const envCheck = {
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 8) ?? "missing",
    devMode: process.env.DEV_MODE,
    domainVerified: process.env.RESEND_DOMAIN_VERIFIED,
    emailFrom: process.env.EMAIL_FROM,
  };

  if (!to) {
    return NextResponse.json({ envCheck, usage: "GET /api/debug/email?to=your@email.com" });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "FreelanceHigh <onboarding@resend.dev>",
      to,
      subject: "Debug Email Test — FreelanceHigh",
      html: "<h1>Email fonctionne!</h1><p>Si vous voyez ceci, les emails fonctionnent en production.</p>",
    });

    return NextResponse.json({
      envCheck,
      emailResult: result,
      success: !result.error,
    });
  } catch (err) {
    return NextResponse.json({
      envCheck,
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 });
  }
}
