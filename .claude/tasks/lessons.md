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
- Perimetre a retenir quand on chasse une fuite d'erreur : toutes les routes
  ne sont pas equivalentes. `cron/` et `webhooks/` repondent a des machines, et
  les outils de diagnostic admin (test-gateway, apply-migration, diagnostic-
  versement) ont BESOIN du message brut. Les couper y detruirait de
  l'observabilite sans rien proteger. Ne traiter que ce qui atterrit sur un
  ecran d'utilisateur final.
- Un « out of memory » de Node peut n avoir aucun rapport avec le code : sur
  cette machine, c etait le DISQUE plein (0,3 Go libres) qui faisait echouer
  Playwright et les builds. Verifier l espace disque avant de suspecter une
  fuite memoire ou un test.
- Un test qui FIGE une decision (ordre des passerelles, couverture d'un pays,
  liste d'operateurs) ou qui assert sur le TEXTE d'un fichier source devient
  rouge a chaque arbitrage legitime. Personne ne le met a jour, le job reste
  rouge, et on cesse de le lire : la suite Playwright de Novakou est restee
  rouge du 24 aout au 2 septembre pour cette seule raison. Preferer une
  invariante DERIVEE de la source de verite (« tout pays sans route est
  ferme ») a une liste recopiee (« CM, BF, KE »). Quand le figeage est
  volontaire, ecrire dans le message d'echec qu'il faut mettre le test a jour
  dans le meme commit.
- Un test E2E qui expire en masse n'est presque jamais un probleme de test :
  c'est l'environnement. Ici, le job E2E n'avait AUCUNE base, alors que
  DATABASE_URL pointait deja vers postgres://test:test@localhost:5432/test —
  le service manquait, tout simplement. Chaque page interrogeant Prisma
  attendait le delai de connexion A CHAQUE requete, et 28 tests depassaient les
  30 s. Comparer avec un workflow VERT du meme depot (ici seo.yml) est le
  raccourci le plus rapide pour trouver ce qui manque.

- En local, Next.js ne lit QUE le `.env.local` du dossier de l'app
  (`apps/web/.env.local`). Celui de la racine du monorepo est ignoré : une clé
  posée là est invisible pour `pnpm dev`, alors qu'elle semble « configurée ».
  Le symptôme est trompeur — la fonctionnalité répond « non configurée » sans
  erreur. Vérifier dans quel fichier la clé atterrit avant de conclure.
- Un domaine WILDCARD chez Vercel (`*.domaine.com`) exige les serveurs de noms
  de Vercel : le certificat wildcard passe par un défi DNS-01 que Vercel doit
  poser lui-même. Le contournement documenté (déléguer `_acme-challenge` en NS)
  est explicitement déconseillé pour un wildcard d'apex, et il confisque
  l'émission de certificats du reste de la zone. Quand le DNS porte l'e-mail
  (MX, SPF, DKIM, DMARC), la bascule de NS met en jeu bien plus que la
  fonctionnalité visée : inscrire chaque sous-domaine individuellement coûte
  une API et un cron, mais ne touche pas à l'e-mail.
- L'API Vercel plafonne les ajouts de domaine à 100 par heure et par équipe.
  Un rattrapage de masse doit donc être un cron à budget, pas un script
  qui boucle — et il doit laisser de la marge aux ajouts des vendeurs.

- Une variable d'environnement marquée « sensitive » sur Vercel n'est plus
  jamais relisible — ni par l'API, ni dans le tableau de bord. Conséquence
  pratique : un rattrapage de données qui a besoin de cette clé ne peut PAS
  tourner depuis un poste local ; il doit tourner dans l'app, là où la clé est
  injectée. Vérifier `type: sensitive` AVANT d'écrire un script de migration.
- Corollaire : une clé « sensitive » qui chiffre des données en base n'existe
  qu'à un seul endroit. Ici `PAYMENT_CREDENTIALS_KEY` chiffre les identifiants
  de six passerelles de paiement. Perdue, elle rend le tout irrécupérable.
  Une copie hors de Vercel relève de la sauvegarde, pas du confort.
- Un fichier de suivi (`todo.md`) qui ment coûte plus cher que pas de fichier :
  il est lu au démarrage de chaque session et oriente le travail. Celui-ci
  annonçait treize chantiers « à faire » dont dix étaient en production depuis
  un mois, et trois « points ouverts » tous déjà résolus dans le code. Réauditer
  contre les sources, avec le fichier et la ligne en preuve, avant de croire
  un état écrit.
- Vérifier un chiffrement en évitant de toucher la base : la route de test ne
  fait QUE du chiffrement/déchiffrement en mémoire, et la vraie preuve est que
  le code TOTP se vérifie ENCORE après un aller-retour. Ici la base locale
  pointe vers la PRODUCTION — écrire un chiffré avec une clé de test y aurait
  cassé la 2FA de vraies personnes. Le garde-fou fail-closed a été testé après
  retrait de la clé, en confirmant que zéro ligne avait bougé.

- Fermer un opérateur à l'ENCAISSEMENT ne dit rien du VERSEMENT, et l'inverse
  non plus — mais quand le refus vient du COMPTE et non du sens de circulation
  de l'argent, il vaut dans les deux. Wave CI : compte FeexPay sans marchand
  agrégé Wave. La collecte avait été fermée en août ; le versement laissé
  ouvert « puisque ce n'était que la collecte » a produit, un mois plus tard,
  exactement la même erreur sur un vrai retrait. Lire le message du
  fournisseur : « not configured for this account » vise le compte.
- Une erreur non reconnue par le classifieur ne tombe pas dans « on verra » :
  l'orchestrateur de versement la traite en AMBIGU, donc arrêt de sûreté, plus
  aucun fournisseur tenté, retrait gelé, et un message qui envoie l'admin
  fouiller un tableau de bord où il ne trouvera rien. Un refus de
  CONFIGURATION rendu en HTTP 400 avant création de transfert est certain,
  pas ambigu — le reconnaître explicitement vaut mieux que le laisser filer
  dans « unknown ».

- Un forfait qui se compte en REQUÊTES transforme une cadence de cron en
  budget. `payout-reconcile` toutes les 10 min sur 14 jours = 2 016 sondes
  pour UN versement bloqué, sur un forfait proxy de 2 500/mois. Le symptôme
  n'a rien à voir avec la cause : quota vidé → le proxy refuse → repli en
  direct → IP dynamique → « FeexPay refuse notre adresse de sortie ». On
  accuse la passerelle, on vérifie la whitelist (correcte depuis un mois), et
  on ne trouve rien. Chercher le COÛT des boucles avant de chercher la panne.
- Corollaire sur la vérification : la whitelist FeexPay était bonne depuis le
  02/08 et les refus datent du 13 et du 20/08 — la donnée qui invalide une
  hypothèse est souvent une DATE. Comparer l'horodatage d'un correctif avec
  celui de l'incident avant de conclure qu'il l'a réglé (ici le second refus
  tombe six heures APRÈS le dernier correctif : ce n'était pas le code).
- Avant de construire une fonctionnalite demandee, VERIFIER si elle existe
  deja. Le « top pays » vendeur existait ; il paraissait absent parce que la
  boutique du fondateur n'avait aucun trafic, et parce qu'il vivait sur la page
  Statistiques et non sur le Tableau de bord. Un tableau vide ressemble a une
  fonctionnalite manquante.
- Un agregat de statistiques doit etre restreint AU VENDEUR en base, pas apres
  coup. `getEvents()` plafonne a 5 000 evenements recents toute plateforme
  confondue : filtrer en memoire faisait disparaitre le trafic des petits
  vendeurs sous celui des gros, et la ligne « Visiteurs » du tunnel affichait a
  chacun le trafic de TOUTE la plateforme.
- Un code pays de deux lettres n'est pas un pays : Cloudflare envoie « XX »
  (inconnu) et « T1 » (Tor), qui traversaient la collecte et la normalisation.
  Ils s'affichaient comme des pays, drapeau casse.
