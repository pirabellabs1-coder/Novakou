"use server";

import { cookies } from "next/headers";

/**
 * Server Action pour changer la locale.
 * Le cookie est defini cote serveur, ce qui garantit que le prochain
 * router.refresh() lira la bonne valeur.
 */
export async function setLocaleCookie(locale: string) {
  const validLocales = ["fr", "en"];
  if (!validLocales.includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
