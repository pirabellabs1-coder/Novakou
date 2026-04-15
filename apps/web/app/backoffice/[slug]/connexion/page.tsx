import { notFound } from "next/navigation";
import AdminLoginClient from "./AdminLoginClient";

/**
 * Secret admin login page.
 *
 * The URL slug is validated server-side against ADMIN_LOGIN_SLUG env var.
 * If the slug doesn't match, Next.js renders a 404 (indistinguishable from
 * any random URL — no hint that an admin login exists there).
 *
 * Deploy: set ADMIN_LOGIN_SLUG on Vercel, then share the URL only with admins.
 */
export default async function SecretAdminLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const expectedSlug = process.env.ADMIN_LOGIN_SLUG?.trim();

  // Server-side slug validation — trim both sides to ignore newline / space artifacts
  if (!expectedSlug || slug.trim() !== expectedSlug) {
    notFound();
  }

  return <AdminLoginClient />;
}

export const metadata = {
  // Don't leak anything about this page in meta
  title: "—",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};
