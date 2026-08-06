import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { lireTaux, enregistrerTaux } from "@/lib/currency/taux-store";

/** GET/PUT des taux de change. Admin uniquement. */
export const dynamic = "force-dynamic";

async function garde() {
  const session = await getServerSession(authOptions);
  // toUpperCase() n'est pas cosmetique : le role est stocke sans casse
  // garantie. Comparer la valeur brute a « ADMIN » refusait l'acces a de vrais
  // administrateurs, avec un message qui accusait leurs droits plutot que le
  // code.
  const role = session?.user?.role?.toString().toUpperCase();
  return Boolean(session?.user) && (role === "ADMIN" || IS_DEV);
}

export async function GET() {
  if (!(await garde())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  return NextResponse.json({ data: { taux: await lireTaux() } });
}

export async function PUT(req: Request) {
  if (!(await garde())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.taux !== "object") {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  return NextResponse.json({ data: { taux: await enregistrerTaux(body.taux) } });
}
