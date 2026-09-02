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
- Une decision admin (refus, retrait, validation) n'est pas terminee quand
  l'API l'enregistre : elle l'est quand le vendeur peut LIRE le motif a
  l'ecran. Piege rencontre : le motif etait bien stocke dans `refuseReason` et
  envoye en notification, mais le bandeau cote vendeur etait conditionne au
  seul statut BROUILLON — donc invisible pour un produit REFUSE ou une
  formation ARCHIVE. Verifier le chemin complet admin -> base -> ecran vendeur,
  pas seulement l'aller.
- Se mefier des commentaires de code decrivant un comportement : celui de la
  route admin affirmait que le vendeur lisait le motif « a l'edition ». C'etait
  faux, et je l'ai repete avant de verifier. Le code fait foi, meme contre un
  commentaire ecrit juste a cote.
- Prisma : dans un `update` qui contient une ecriture de relation imbriquee
  (ici `files: { deleteMany, create }`), la cle etrangere brute (`categoryId`)
  n'est PAS acceptee — il faut passer par la relation
  (`category: { connect: { id } }`). Et un champ qui n'existe pas sur le
  modele (`customCategory`, present sur Formation mais pas sur DigitalProduct)
  fait echouer toute la requete.
- TypeScript ne voit RIEN de tout cela si l'objet `data` est assemble par
  spreads : la verification des proprietes excedentaires ne s'applique pas aux
  spreads. La parade est de typer le fragment lui-meme par l'entree Prisma
  (`Pick<Prisma.XUpdateInput, "champ">`), ce qui ramene l'erreur au
  `pnpm typecheck`. Verifie : le bug d'origine devient alors une erreur de
  compilation.
- Ne jamais renvoyer `err.message` a un utilisateur final. Une trace Prisma
  affichait au vendeur le schema complet de la base sur sa page produit. Le
  detail va dans les logs, l'ecran recoit une phrase actionnable.
