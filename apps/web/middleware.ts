import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Route admin login secrete — pas de redirection, le token est verifie cote client+API
const ADMIN_LOGIN_PREFIX = "/admin-login/";

// ── Maintenance mode cache (60s TTL in Edge Runtime) ──
let maintenanceModeCache: { enabled: boolean; message: string; cachedAt: number } | null = null;
const MAINTENANCE_CACHE_TTL_MS = 60_000; // 60 seconds

// Routes publiques — toujours accessibles
const PUBLIC_ROUTES = [
  "/",
  "/explorer",
  "/services",
  "/mentors",
  "/instructeurs",
  "/freelances",
  "/formation",
  "/produit",
  "/tarifs",
  "/a-propos",
  "/contact",
  "/affiliation",
  "/partenaires",
  "/faq",
  "/cgu",
  "/confidentialite",
  "/cookies",
  "/aide",
  "/certificat",
  "/panier",
  "/checkout",
  "/payment",
  "/boutique", // Pages publiques de boutique
  "/404",
  "/maintenance",
  "/status",
  "/debug-media",
  "/backoffice", // Admin secret login (slug validé côté page server)
  "/f", // Public funnel landing pages
  "/invitation", // Pages d'acceptation d'invitations équipe boutique
  "/acheteur",   // Espace acheteur — connexion OTP dédiée (pas de password)
];

// Routes auth — accessibles uniquement si NON connecte
const AUTH_ROUTES = ["/connexion", "/inscription", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe", "/onboarding", "/verifier-email", "/2fa", "/acheteur/connexion"];



// Routes protegees par role (RoleGuard côté client gère le reste)
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ["/admin"],
};

// Map role → dashboard URL — admin a son dashboard Novakou.
// Les rôles instructeur/apprenant sont routés côté client via RoleGuard.
const ROLE_DASHBOARD: Record<string, string> = {
  admin: "/admin/dashboard",
  instructeur: "/vendeur/dashboard",
  apprenant: "/apprenant/dashboard",
};

function getDashboardForRole(role: string | undefined): string {
  if (!role) return "/connexion";
  return ROLE_DASHBOARD[role.toLowerCase()] || "/connexion";
}

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
    pathname.includes(".") ||
    // Next.js metadata file-based routes (icon.tsx, apple-icon.tsx,
    // opengraph-image.tsx, manifest.ts) generate these paths dynamically.
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    pathname === "/manifest.webmanifest"
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

// Hosts that are the Novakou app itself — NOT custom vendor domains
const APP_HOSTS = new Set<string>([
  "novakou.com",
  "www.novakou.com",
  "novakou.vercel.app",
  "localhost",
  "127.0.0.1",
]);

function isAppHost(host: string | null) {
  if (!host) return true;
  const h = host.split(":")[0].toLowerCase();
  if (APP_HOSTS.has(h)) return true;
  // Vercel preview deploys: *-<team>.vercel.app
  if (h.endsWith(".vercel.app")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host");

  // Laisser passer les assets statiques et les routes API
  if (isStaticAsset(pathname) || isApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Route admin-login secrete — laisser passer (la verification du token se fait cote client+API)
  if (pathname.startsWith(ADMIN_LOGIN_PREFIX)) {
    return NextResponse.next();
  }

  // ── Custom domain: rewrite to /boutique/by-domain/<host><path> ──
  // The target page looks up the vendor by host and renders the public shop.
  if (!isAppHost(host)) {
    const h = (host ?? "").split(":")[0].toLowerCase().replace(/^www\./, "");
    // Avoid double-rewrite loops
    if (!pathname.startsWith("/boutique/by-domain/")) {
      const url = req.nextUrl.clone();
      url.pathname = `/boutique/by-domain/${h}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Redirect permanent des anciennes URLs `/formations/xxx` → `/xxx`
  if (pathname === "/formations" || pathname.startsWith("/formations/")) {
    const newPath = pathname === "/formations" ? "/" : pathname.slice("/formations".length);
    const url = req.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 308);
  }

  // ── Maintenance mode check (cached ~60s in-memory) ──
  // Skip maintenance check for: /maintenance itself, /admin/*, /admin-login/*, /api/*
  const skipMaintenance = pathname === "/maintenance" || pathname.startsWith("/admin") || pathname.startsWith(ADMIN_LOGIN_PREFIX);
  if (!skipMaintenance) {
    try {
      let maintenanceState = maintenanceModeCache;

      // Refresh cache if expired or missing
      if (!maintenanceState || Date.now() - maintenanceState.cachedAt >= MAINTENANCE_CACHE_TTL_MS) {
        const maintenanceRes = await fetch(new URL("/api/public/maintenance", req.url));
        if (maintenanceRes.ok) {
          const data = await maintenanceRes.json();
          maintenanceState = {
            enabled: !!data.enabled,
            message: data.message || "",
            cachedAt: Date.now(),
          };
          maintenanceModeCache = maintenanceState;
        }
      }

      if (maintenanceState?.enabled) {
        // Allow admin users through even during maintenance
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        const userRole = token?.role as string | undefined;
        if (userRole !== "admin") {
          const maintenanceUrl = new URL("/maintenance", req.url);
          return NextResponse.redirect(maintenanceUrl);
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

  // Routes publiques — toujours accessibles
  if (isPublicRoute(pathname)) {
    // Utilisateur connecté sur la home : envoyer sur son dashboard.
    if (pathname === "/") {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token) {
        const role = token.role as string | undefined;
        const redirectUrl = getDashboardForRole(role);
        return withLocaleCookie(NextResponse.redirect(new URL(redirectUrl, req.url)));
      }
    }
    return withLocaleCookie(NextResponse.next());
  }

  // Lire le token JWT directement (compatible Edge Runtime)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  const userRole = token?.role as string | undefined;
  const tfaPending = !!(token as { tfaPending?: boolean } | null)?.tfaPending;

  // Routes auth — rediriger vers le bon espace si deja connecte
  // Exception : /2fa reste accessible tant que la 2FA n'est pas validée.
  if (isAuthRoute(pathname)) {
    // Laisser passer /2fa si l'utilisateur attend justement la validation TOTP
    if (pathname === "/2fa" && isAuthenticated && tfaPending) {
      return withLocaleCookie(NextResponse.next());
    }
    if (isAuthenticated && userRole) {
      const redirectUrl = getDashboardForRole(userRole);
      return withLocaleCookie(NextResponse.redirect(new URL(redirectUrl, req.url)));
    }
    return withLocaleCookie(NextResponse.next());
  }

  // Toutes les autres routes necessitent une authentification
  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    // Route les acheteurs (espace apprenant) vers leur page de connexion dédiée
    // avec OTP par email, pas vers la page vendeur /connexion (email + password).
    const loginPath = pathname.startsWith("/apprenant") ? "/acheteur/connexion" : "/connexion";
    return withLocaleCookie(NextResponse.redirect(new URL(`${loginPath}?callbackUrl=${callbackUrl}`, req.url)));
  }

  // 2FA en attente : on force la page /2fa tant que le code TOTP n'a pas
  // été validé. Marche pour tous les providers (credentials + OAuth).
  if (tfaPending && pathname !== "/2fa") {
    const url = new URL("/2fa", req.url);
    // Préserver la destination initiale pour la redirection après validation
    if (pathname && pathname !== "/") url.searchParams.set("callbackUrl", pathname);
    return withLocaleCookie(NextResponse.redirect(url));
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
    // avec parametre ?access_denied=1 pour afficher une notification
    if (userRole !== requiredRole) {
      const redirectUrl = getDashboardForRole(userRole);
      const url = new URL(redirectUrl, req.url);
      url.searchParams.set("access_denied", "1");
      return withLocaleCookie(NextResponse.redirect(url));
    }
  }

  return withLocaleCookie(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
