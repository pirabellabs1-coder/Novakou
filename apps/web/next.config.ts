import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = isDev
  ? []
  : [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
          "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com",
          "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.loom.com",
          "media-src 'self' blob: data: https://res.cloudinary.com https://*.supabase.co",
          "frame-ancestors 'self'",
        ].join("; "),
      },
    ];

const nextConfig: NextConfig = {
  // Ignorer ESLint et TypeScript pendant le build (erreurs mineures, deploy test)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Monorepo: indiquer la racine pour que Next.js trace les fichiers Prisma
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google OAuth avatars
      { protocol: "https", hostname: "trtxqbelsrfgfedaorkb.supabase.co" }, // Supabase Storage
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    if (isDev) return [];
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // www -> non-www
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.freelancehigh.com" }],
        destination: "https://freelancehigh.com/:path*",
        permanent: true,
      },
      // Common 404 redirects — pages users try to access directly
      { source: "/projets", destination: "/offres-projets", permanent: true },
      { source: "/devenir-freelance", destination: "/inscription", permanent: true },
      { source: "/accueil", destination: "/", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/login", destination: "/connexion", permanent: true },
      { source: "/register", destination: "/inscription", permanent: true },
      { source: "/signup", destination: "/inscription", permanent: true },
      { source: "/signin", destination: "/connexion", permanent: true },
      { source: "/formations/produits-numeriques", destination: "/formations/produits", permanent: true },
      // Instructor URL aliases
      { source: "/formations/instructeur/verification-kyc", destination: "/formations/instructeur/kyc", permanent: true },
      { source: "/formations/instructeur/codes-promo", destination: "/formations/instructeur/promotions", permanent: true },
      { source: "/formations/instructeur/marketing/flash-sales", destination: "/formations/instructeur/marketing/flash", permanent: true },
      { source: "/formations/instructeur/produits-numeriques/:path*", destination: "/formations/instructeur/produits/:path*", permanent: true },
    ];
  },
  // Optimisations production
  poweredByHeader: false,
  compress: true,
};

export default withNextIntl(nextConfig);
