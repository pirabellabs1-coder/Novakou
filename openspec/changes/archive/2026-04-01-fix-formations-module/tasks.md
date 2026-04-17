## 1. Fix Checkout API base URL

- [x] 1.1 In `apps/web/app/api/formations/checkout/route.ts`, replace `const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3450"` with `const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"` (line 107)
- [x] 1.2 In `apps/web/app/api/produits/checkout/route.ts`, apply the same baseUrl fix (`"http://localhost:3450"` → `"http://localhost:3000"`) for consistency (line 72)

## 2. Fix Buy Now client-side redirect for mock payments

- [x] 2.1 In `apps/web/app/formations/[slug]/page.tsx`, update `buyNow()` function: when `data.mock === true`, use `router.push("/succes?session_id=" + data.sessionId)` instead of `window.location.href = data.url`. Keep `window.location.href = data.url` for real Stripe sessions.
- [x] 2.2 In `apps/web/app/formations/[slug]/page.tsx`, add error handling in `buyNow()`: if `res.ok` is false, show an error toast and reset loading state instead of silently failing.

## 3. Fix Cart Checkout client-side redirect for mock payments

- [x] 3.1 In `apps/web/app/formations/(apprenant)/panier/page.tsx`, update `checkout()` function: when `data.mock === true`, use `router.push("/succes?session_id=" + data.sessionId)` instead of `window.location.href = data.url`.
- [x] 3.2 In `apps/web/app/formations/(apprenant)/panier/page.tsx`, add error handling in `checkout()`: if response is not ok, display an error message to the user.

## 4. Add toast feedback for Add to Cart

- [x] 4.1 In `apps/web/app/formations/[slug]/page.tsx`, add a `toast` state variable (string or null) and a toast UI element (fixed position, auto-dismiss after 2s) styled with Tailwind.
- [x] 4.2 Update `addToCart()`: on success, show toast "Formation ajoutée au panier !" before `router.push("/panier")`. On API error (res.ok false), show error toast with the error message.
- [x] 4.3 Update `addToCart()`: check `res.ok` before redirecting — if the API returns 400 (already enrolled), display the error message from the response body.

## 5. Validate end-to-end flow

- [x] 5.1 Test the complete flow manually: open a formation → click "Ajouter au panier" → verify toast appears → verify formation appears in `/panier` → click "Passer la commande" → verify redirect to `/succes` → verify enrollment exists in `/mes-formations`.
- [x] 5.2 Test "Acheter" (Buy Now) flow: open a formation → click "Acheter" → verify redirect to success page → verify enrollment appears in dashboard with 0% progress.
- [x] 5.3 Verify dashboard stats: after creating enrollments, check that "En cours", "Complétées", "Certifications", "Heures d'apprentissage" display correct non-zero values.
