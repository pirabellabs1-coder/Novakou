# FreelanceHigh — Leçons Accumulées

## Patterns connus
- API `{ wrapper: data }` vs client attend `data` → unwrap dans api-client.ts
- `.map()` sur undefined (Prisma JSON null) → toujours `|| []`
- JWT KYC cache 5min → force refresh sur trigger=update
- CSP bloque iframes → ajouter dans frame-src next.config.ts
- Permissions-Policy camera=() bloque selfie → camera=(self)
- PDF dans une `<iframe>` = pari sur le lecteur PDF du navigateur. Opera bloque le
  cadre, Safari iOS n'affiche qu'une page, un Chromium sans plugin rend du blanc —
  alors que la requête répond bien 200. Un aperçu qui « ne s'affiche pas » n'est
  donc pas forcément un problème de headers : vérifier d'abord si l'affichage
  dépend d'un plugin. Rendu fiable = pdf.js sur `<canvas>` (composant
  `components/formations/ApercuPdf.tsx`).
- Réécrire un fichier avec Python écrase les CRLF du dépôt et gonfle le diff de
  centaines de lignes fantômes. Relire `git diff --numstat` après toute
  réécriture programmatique, et restaurer les fins de ligne d'origine.
