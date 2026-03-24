import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { uploadFile, getSignedUrl } from "@/lib/supabase-storage";

// Debug endpoint — checks all infrastructure for voice/calls
export async function GET(req: NextRequest) {
  const results: Record<string, unknown> = {};

  // 1. Auth check
  try {
    const session = await getServerSession(authOptions);
    results.auth = session?.user?.id ? { ok: true, userId: session.user.id } : { ok: false, error: "No session" };
  } catch (e) {
    results.auth = { ok: false, error: String(e) };
  }

  // 2. Signaling table check
  try {
    const count = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "signaling_signals"
    `;
    results.signaling_table = { ok: true, rows: Number(count[0]?.count ?? 0) };
  } catch (e) {
    results.signaling_table = { ok: false, error: String(e).slice(0, 200) };
  }

  // 3. Signaling write + read test
  try {
    const testId = `test-${Date.now()}`;
    await prisma.$executeRaw`
      INSERT INTO "signaling_signals" ("type", "from_user", "to_user", "payload")
      VALUES ('test', ${testId}, ${testId}, '{"test":true}'::jsonb)
    `;
    const rows = await prisma.$queryRaw<{ id: number }[]>`
      DELETE FROM "signaling_signals" WHERE "from_user" = ${testId} RETURNING "id"
    `;
    results.signaling_roundtrip = { ok: rows.length > 0, deleted: rows.length };
  } catch (e) {
    results.signaling_roundtrip = { ok: false, error: String(e).slice(0, 200) };
  }

  // 4. Supabase Storage check
  try {
    const testBuffer = Buffer.from("test audio data");
    const testPath = `debug/test-${Date.now()}.txt`;
    const uploaded = await uploadFile("message-attachments", testPath, testBuffer, "text/plain");
    if (uploaded) {
      const signedUrl = await getSignedUrl("message-attachments", uploaded.path, 60);
      results.supabase_storage = {
        ok: true,
        uploaded_path: uploaded.path,
        signed_url: signedUrl ? signedUrl.slice(0, 80) + "..." : null,
        signed_url_ok: !!signedUrl,
      };
    } else {
      results.supabase_storage = { ok: false, error: "uploadFile returned null — check SUPABASE_SERVICE_ROLE_KEY" };
    }
  } catch (e) {
    results.supabase_storage = { ok: false, error: String(e).slice(0, 200) };
  }

  // 5. Env vars check (existence only, not values)
  results.env_vars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  };

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
