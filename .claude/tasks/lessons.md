# FreelanceHigh — Leçons Accumulées

## Patterns connus
- API `{ wrapper: data }` vs client attend `data` → unwrap dans api-client.ts
- `.map()` sur undefined (Prisma JSON null) → toujours `|| []`
- JWT KYC cache 5min → force refresh sur trigger=update
- CSP bloque iframes → ajouter dans frame-src next.config.ts
- Permissions-Policy camera=() bloque selfie → camera=(self)
