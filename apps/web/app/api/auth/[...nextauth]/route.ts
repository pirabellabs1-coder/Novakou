import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";

const handler = NextAuth(authOptions);

type Contexte = { params: Promise<{ nextauth: string[] }> };

/** Origine canonique de l'authentification (NEXTAUTH_URL), null si absente ou invalide. */
function origineCanonique(): URL | null {
  try {
    return process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL) : null;
  } catch {
    return null;
  }
}

/** Ne garde d'un callbackUrl que son chemin : la destination reste sur le domaine principal. */
function cheminRelatif(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url, "http://origine-ignoree");
    return u.pathname === "/" && !u.search ? null : u.pathname + u.search;
  } catch {
    return null;
  }
}

/**
 * Sur Vercel, NextAuth 4 construit ses URL depuis l'hôte de la requête
 * (`x-forwarded-host`) et IGNORE NEXTAUTH_URL. Un parcours Google commencé sur
 * novakou-web.vercel.app, un sous-domaine boutique ou une preview envoie donc à
 * Google un redirect_uri qu'il ne connaît pas : « Erreur 400 :
 * redirect_uri_mismatch » (vu le 2026-09-26) — et le cookie « state » serait de
 * toute façon posé sur le mauvais hôte. On renvoie ces départs vers le domaine
 * principal, où /connexion relance le fournisseur d'elle-même (`?oauth=…`).
 * Les autres routes (credentials, session, callback) restent intactes.
 */
async function rebasculerDepartOAuth(req: NextRequest): Promise<NextResponse | null> {
  const canon = origineCanonique();
  if (!canon) return null;
  const hote = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (!hote || hote === canon.host.toLowerCase()) return null;
  const fournisseur = req.nextUrl.pathname.match(/^\/api\/auth\/signin\/(google|linkedin)$/)?.[1];
  if (!fournisseur) return null;

  // callbackUrl : dans le corps (POST de signIn()) ou dans la query (lien direct).
  let callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
  if (!callbackUrl && req.method === "POST") {
    callbackUrl = await req
      .formData()
      .then((f) => {
        const v = f.get("callbackUrl");
        return typeof v === "string" ? v : null;
      })
      .catch(() => null);
  }
  const cible = new URL("/connexion", canon);
  cible.searchParams.set("oauth", fournisseur);
  const chemin = cheminRelatif(callbackUrl);
  if (chemin) cible.searchParams.set("callbackUrl", chemin);
  return NextResponse.redirect(cible, 303);
}

export async function GET(req: NextRequest, ctx: Contexte) {
  return (await rebasculerDepartOAuth(req)) ?? handler(req, ctx);
}

export async function POST(req: NextRequest, ctx: Contexte) {
  return (await rebasculerDepartOAuth(req)) ?? handler(req, ctx);
}
