import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes publiques — toujours accessibles
const PUBLIC_ROUTES = [
  "/",
  "/explorer",
  "/services",
  "/freelances",
  "/agences",
  "/freelancers",
  "/agencies",
  "/feed/service",
  "/offres-projets",
  "/blog",
  "/tarifs",
  "/comment-ca-marche",
  "/confiance-securite",
  "/a-propos",
  "/contact",
  "/affiliation",
  "/faq",
  "/cgu",
  "/confidentialite",
  "/mentions-legales",
  "/cookies",
  "/aide",
  "/contrats",
  "/404",
  "/maintenance",
  "/status",
];

// Routes auth — accessibles uniquement si NON connecte
const AUTH_ROUTES = ["/connexion", "/inscription", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe", "/onboarding"];

// Routes protegees par role
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ["/admin"],
  freelance: ["/dashboard"],
  client: ["/client"],
  agence: ["/agence"],
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(route + "/");
  });
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

function getRequiredRole(pathname: string): string | null {
  for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
    if (routes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
      return role;
    }
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Laisser passer les assets statiques et les routes API
  if (isStaticAsset(pathname) || isApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Pas de profil public client (/clients/[id] → /feed)
  if (pathname.startsWith("/clients/")) {
    return NextResponse.redirect(new URL("/feed", req.url));
  }

  // Routes publiques — toujours accessibles
  if (isPublicRoute(pathname)) {
    // Si connecté et sur la page d'accueil → rediriger vers /feed
    if (pathname === "/") {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token) {
        return NextResponse.redirect(new URL("/feed", req.url));
      }
    }
    return NextResponse.next();
  }

  // Lire le token JWT directement (compatible Edge Runtime)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  const userRole = token?.role as string | undefined;

  // Routes auth — rediriger vers le bon espace si deja connecte
  if (isAuthRoute(pathname)) {
    if (isAuthenticated && userRole) {
      const redirectMap: Record<string, string> = {
        admin: "/admin",
        freelance: "/dashboard",
        client: "/client",
        agence: "/agence",
      };
      const redirectUrl = redirectMap[userRole] || "/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return NextResponse.next();
  }

  // Toutes les autres routes necessitent une authentification
  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/connexion?callbackUrl=${callbackUrl}`, req.url));
  }

  // Verification du role
  const requiredRole = getRequiredRole(pathname);
  if (requiredRole) {
    // L'admin a acces a tout
    if (userRole === "admin") {
      const response = NextResponse.next();
      if (requiredRole !== "admin") {
        response.headers.set("x-admin-viewing", "true");
      }
      return response;
    }

    // Verifier que le role correspond
    if (userRole !== requiredRole) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
