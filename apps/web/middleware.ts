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
  "/formations",
  "/404",
  "/maintenance",
  "/status",
];

// Routes auth — accessibles uniquement si NON connecte
const AUTH_ROUTES = ["/connexion", "/inscription", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe", "/onboarding"];

// Routes auth formations — accessibles même si connecté (pas de conflit avec la session principale)
const FORMATIONS_AUTH_ROUTES = ["/formations/connexion", "/formations/inscription"];

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

  // ── Maintenance mode check ──
  // Check maintenance via internal API (edge-compatible)
  if (pathname !== "/maintenance" && !pathname.startsWith("/admin")) {
    try {
      const maintenanceRes = await fetch(new URL("/api/public/maintenance", req.url), {
        headers: { "Cache-Control": "no-cache" },
      });
      if (maintenanceRes.ok) {
        const data = await maintenanceRes.json();
        if (data.enabled) {
          // Allow admin users through even during maintenance
          const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
          const userRole = token?.role as string | undefined;
          if (userRole !== "admin") {
            return NextResponse.redirect(new URL("/maintenance", req.url));
          }
        }
      }
    } catch {
      // If maintenance check fails, allow access (fail open)
    }
  }

  // --- i18n : set locale cookie from Accept-Language if absent ---
  const localeCookie = req.cookies.get("locale")?.value;
  let needsLocaleCookie = false;
  let detectedLocale = "fr";
  if (!localeCookie) {
    const acceptLang = req.headers.get("accept-language") ?? "";
    const preferredLocale = acceptLang
      .split(",")
      .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
      .find((lang) => lang === "en" || lang === "fr");
    detectedLocale = preferredLocale ?? "fr";
    needsLocaleCookie = true;
  }

  function withLocaleCookie(res: NextResponse): NextResponse {
    if (needsLocaleCookie) {
      res.cookies.set("locale", detectedLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return res;
  }

  // Pas de profil public client (/clients/[id] → rediriger par rôle)
  if (pathname.startsWith("/clients/")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const role = token?.role as string | undefined;
    const roleRedirectMap: Record<string, string> = {
      admin: "/admin",
      freelance: "/dashboard",
      client: "/client",
      agence: "/agence",
    };
    const redirectUrl = role ? (roleRedirectMap[role] || "/dashboard") : "/";
    return withLocaleCookie(NextResponse.redirect(new URL(redirectUrl, req.url)));
  }

  // Routes instructeur formations — nécessitent authentification + rôle instructeur
  if (pathname.startsWith("/formations/instructeur")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return withLocaleCookie(NextResponse.redirect(new URL("/formations/connexion", req.url)));
    }
    const formationsRole = token.formationsRole as string | undefined;
    const userRole = token.role as string | undefined;
    if (userRole !== "admin" && formationsRole !== "instructeur") {
      return withLocaleCookie(NextResponse.redirect(new URL("/formations/mes-formations", req.url)));
    }
    return withLocaleCookie(NextResponse.next());
  }

  // Routes apprenant formations — nécessitent authentification
  if (pathname.startsWith("/formations/mes-formations") || pathname.startsWith("/formations/mes-produits") || pathname.startsWith("/formations/mes-cohorts") || pathname.startsWith("/formations/certificats") || pathname.startsWith("/formations/favoris") || pathname.startsWith("/formations/parametres") || pathname.startsWith("/formations/panier") || pathname.startsWith("/formations/paiement")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return withLocaleCookie(NextResponse.redirect(new URL("/formations/connexion", req.url)));
    }
    return withLocaleCookie(NextResponse.next());
  }

  // Routes admin formations — nécessitent rôle admin
  if (pathname.startsWith("/formations/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return withLocaleCookie(NextResponse.redirect(new URL("/formations/connexion", req.url)));
    }
    const userRole = token.role as string | undefined;
    if (userRole !== "admin") {
      return withLocaleCookie(NextResponse.redirect(new URL("/formations/connexion", req.url)));
    }
    return withLocaleCookie(NextResponse.next());
  }

  // Routes publiques — toujours accessibles
  if (isPublicRoute(pathname)) {
    // Si connecté et sur la page d'accueil → rediriger par rôle
    if (pathname === "/") {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token) {
        const role = token.role as string | undefined;
        const roleRedirectMap: Record<string, string> = {
          admin: "/admin",
          freelance: "/dashboard",
          client: "/client",
          agence: "/agence",
        };
        const redirectUrl = role ? (roleRedirectMap[role] || "/dashboard") : "/dashboard";
        return withLocaleCookie(NextResponse.redirect(new URL(redirectUrl, req.url)));
      }
    }
    return withLocaleCookie(NextResponse.next());
  }

  // Routes auth formations — toujours accessibles (même si connecté)
  if (FORMATIONS_AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return withLocaleCookie(NextResponse.next());
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
      return withLocaleCookie(NextResponse.redirect(new URL(redirectUrl, req.url)));
    }
    return withLocaleCookie(NextResponse.next());
  }

  // Toutes les autres routes necessitent une authentification
  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    return withLocaleCookie(NextResponse.redirect(new URL(`/connexion?callbackUrl=${callbackUrl}`, req.url)));
  }

  // Verification du role
  const requiredRole = getRequiredRole(pathname);
  if (requiredRole) {
    // L'admin a acces a tout
    if (userRole === "admin") {
      const res = NextResponse.next();
      if (requiredRole !== "admin") {
        res.headers.set("x-admin-viewing", "true");
      }
      return withLocaleCookie(res);
    }

    // Verifier que le role correspond — rediriger vers l'espace du rôle
    if (userRole !== requiredRole) {
      const roleRedirectMap: Record<string, string> = {
        admin: "/admin",
        freelance: "/dashboard",
        client: "/client",
        agence: "/agence",
      };
      const redirectUrl = userRole ? (roleRedirectMap[userRole] || "/dashboard") : "/dashboard";
      return withLocaleCookie(NextResponse.redirect(new URL(redirectUrl, req.url)));
    }
  }

  return withLocaleCookie(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
