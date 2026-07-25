import { NextResponse } from "next/server";
import { redisEnabled, redisSetEx, redisGet, redisDel } from "@/lib/rate-limit/store";

// Diagnostic ÉPHÉMÈRE : confirme que le round-trip Upstash fonctionne en prod.
// Ne renvoie que des booléens (aucune donnée, aucune clé). À supprimer après test.
export const dynamic = "force-dynamic";

export async function GET() {
  const enabled = redisEnabled();
  const probe = `diag:${Math.floor(Date.now() / 1000)}`;
  let setOk = false;
  let getMatch = false;
  if (enabled) {
    setOk = await redisSetEx(probe, "ok", 30);
    const v = await redisGet(probe);
    getMatch = v === "ok";
    await redisDel(probe);
  }
  return NextResponse.json({ redisEnabled: enabled, setOk, getMatch });
}
