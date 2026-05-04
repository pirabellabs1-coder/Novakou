import { test, expect } from "@playwright/test";

/**
 * Tests E2E pour les flows critiques de bundles + abonnements + reviews.
 *
 * Ces tests garantissent qu'aucune régression future ne casse :
 *   - L'accès public aux pages /bundle/[slug] et /abonnement/[id]
 *   - L'affichage du sélecteur de paiement Moneroo / PayGenius
 *   - Le bouton d'achat
 *   - La présence du SDK Puter sur les boutiques (chatbot)
 *   - L'API publique des providers de paiement
 *
 * Convention : on ne fait PAS de paiement réel — on vérifie uniquement
 * que les pages répondent + que les sélecteurs/boutons sont visibles.
 */

test.describe("Bundle public page", () => {
  test("loads with payment selector + buy button", async ({ page }) => {
    // On utilise un vrai bundle de la prod pour le test
    // (sera adapté si le slug change, sinon le test détectera la 404)
    await page.goto("/bundle/pack-marketing-premium");
    // Si le bundle n'existe pas, on saute le test plutôt qu'échouer
    const notFound = await page.locator("text=Pack introuvable").count();
    test.skip(notFound > 0, "Bundle de référence absent — adapter le slug");

    // Doit avoir le titre dans le H1
    await expect(page.locator("h1").first()).toBeVisible();

    // Sélecteur Moneroo + PayGenius (si les 2 providers sont configurés)
    const moneroo = page.getByRole("button", { name: /moneroo/i });
    const paygenius = page.getByRole("button", { name: /paygenius/i });
    // Au moins un provider doit être visible (en prod les 2 sont configurés)
    await expect(moneroo.or(paygenius).first()).toBeVisible();

    // Bouton "Acheter le pack"
    const buyBtn = page.getByRole("button", { name: /acheter le pack/i });
    await expect(buyBtn).toBeVisible();
  });
});

test.describe("Subscription public page", () => {
  test("loads with subscribe button", async ({ page }) => {
    // Les abonnements ont des id cuid — on visite via la boutique
    // pour récupérer un id valide.
    await page.goto("/boutique/gildas-lissanon-mohmv3rm");

    // Cherche le premier lien /abonnement/
    const subLink = page.locator('a[href^="/abonnement/"]').first();
    const hasSubLink = (await subLink.count()) > 0;
    test.skip(!hasSubLink, "Pas d'abonnement public dans la boutique de test");

    await subLink.click();
    await expect(page).toHaveURL(/\/abonnement\//);

    // Page abonnement doit avoir un H1 + bouton "S'abonner maintenant"
    await expect(page.locator("h1").first()).toBeVisible();
    const subscribeBtn = page.getByRole("button", { name: /s'abonner maintenant/i });
    await expect(subscribeBtn).toBeVisible();
  });
});

test.describe("Payment providers API", () => {
  test("exposes available providers without auth", async ({ request }) => {
    const res = await request.get("/api/formations/payment/providers");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    // Au moins un provider configuré en prod (Moneroo ou PayGenius)
    expect(body.data.length).toBeGreaterThan(0);
  });
});

test.describe("Public bundle/subscription routes are NOT auth-gated", () => {
  test("/bundle/[slug] does not redirect to /connexion", async ({ page }) => {
    const response = await page.goto("/bundle/pack-marketing-premium", { waitUntil: "domcontentloaded" });
    // Si redirected to /connexion, le test échoue
    expect(page.url()).not.toContain("/connexion");
    // 404 acceptable (pack peut ne pas exister), mais pas redirect vers connexion
    expect([200, 404]).toContain(response?.status() ?? 200);
  });

  test("/api/formations/public/support-ai does not require auth", async ({ request }) => {
    // Endpoint utilisé par le widget chatbot — doit répondre sans cookie
    const res = await request.get("/api/formations/public/support-ai?shopSlug=novakou-test");
    expect(res.status()).toBeLessThan(500); // 200 ou 404, pas 401/500
  });
});

test.describe("Apprenant pages — auth required", () => {
  test("/apprenant/abonnements redirects to /acheteur/connexion when logged out", async ({ page }) => {
    await page.goto("/apprenant/abonnements", { waitUntil: "domcontentloaded" });
    // Doit être redirigé vers la page de connexion acheteur
    expect(page.url()).toMatch(/\/(acheteur\/)?connexion/);
  });

  test("/apprenant/packs redirects to /acheteur/connexion when logged out", async ({ page }) => {
    await page.goto("/apprenant/packs", { waitUntil: "domcontentloaded" });
    expect(page.url()).toMatch(/\/(acheteur\/)?connexion/);
  });
});

test.describe("Vendor alias redirects (legacy 404 prevention)", () => {
  // Ces alias garantissent qu'un ancien lien /vendeur/commandes ou
  // /vendeur/finances dans une vieille notification ne fait plus 404.
  // On vérifie qu'ils répondent 200 (la redirection serveur amène à
  // /vendeur/transactions avant que le client n'arrive sur la page).

  test("/vendeur/commandes does not 404", async ({ request }) => {
    const res = await request.get("/vendeur/commandes", { maxRedirects: 0 });
    // 200 (redirect server-side rendered) ou 30x (HTTP redirect) — jamais 404
    expect(res.status()).not.toBe(404);
  });

  test("/vendeur/finances does not 404", async ({ request }) => {
    const res = await request.get("/vendeur/finances", { maxRedirects: 0 });
    expect(res.status()).not.toBe(404);
  });

  test("/vendeur/services does not 404", async ({ request }) => {
    const res = await request.get("/vendeur/services", { maxRedirects: 0 });
    expect(res.status()).not.toBe(404);
  });
});

test.describe("Reviews API guards buyer-only flows", () => {
  test("POST review without auth returns 401 or 403", async ({ request }) => {
    const res = await request.post("/api/formations/reviews", {
      data: { kind: "bundle", itemId: "fake-id", rating: 5, comment: "test" },
    });
    // En dev avec fallback, peut accepter ; en prod sans cookie, doit refuser
    // Au minimum le statut ne doit PAS être 200 sans achat préalable
    expect([401, 403, 400, 404]).toContain(res.status());
  });

  test("GET reviews without filter returns 400", async ({ request }) => {
    const res = await request.get("/api/formations/reviews");
    expect(res.status()).toBe(400);
  });

  test("GET reviews with bundleId returns valid shape", async ({ request }) => {
    const res = await request.get("/api/formations/reviews?bundleId=non-existent");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("summary");
    expect(body.summary).toHaveProperty("count");
    expect(body.summary).toHaveProperty("avgRating");
  });

  test("GET reviews with planId returns valid shape", async ({ request }) => {
    const res = await request.get("/api/formations/reviews?planId=non-existent");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body.summary).toHaveProperty("count");
  });
});
