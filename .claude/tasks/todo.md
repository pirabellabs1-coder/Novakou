# État des travaux — réaudité contre le code le 2026-09-06

> Ce fichier décrivait un lot de treize demandes du fondateur daté du 2026-08-06.
> La quasi-totalité a été livrée depuis, sans que le fichier soit mis à jour : il
> annonçait comme « à faire » du travail déjà en production, et il est lu au
> démarrage de chaque session. Chaque ligne ci-dessous a été revérifiée dans le
> code, avec le fichier qui en fait foi.

---

## ✅ Livré et vérifié dans le code

| # | Demande | Preuve |
|---|---|---|
| (3) | Statistiques retirées de la vitrine publique | `components/formations/BoutiqueView.tsx:309` — compteurs Produits/Clients/Note retirés |
| (4) | Nombre de ventes masqué + réglage boutique | `schema.prisma:1056` — `showSalesCount Boolean @default(false)` |
| (8) | Date d'ajout retirée des produits | plus aucune date dans `BoutiqueView.tsx` |
| (6)+(9) | Profil boutique à la place du profil vendeur | `schema.prisma:1045-1047` — `contactEmail`, `whatsapp`, `websiteUrl` + réseaux sociaux sur la boutique |
| (7) | Bloc « Contactez-nous » sur la fiche produit | alimenté par les champs boutique, cf. `vendeur/boutiques/[id]/page.tsx:433` |
| (2) | Filtres Aujourd'hui / Hier sur les statistiques | `vendeur/statistiques/page.tsx:77` — **calculés sur le fuseau du vendeur**, pas en UTC (le piège signalé à l'époque a bien été traité) |
| (1) | Visiteurs par pays en nombre réel | `vendeur/statistiques/page.tsx:176` — « Top pays : CHIFFRES RÉELS (pas de %) » |
| (12) | Couleur de texte dans l'éditeur | `components/formations/RichTextEditor.tsx:158,458` — sélecteur de couleur implémenté |

## ⬜ Reste ouvert

- [ ] **(13) Taux de rebond** dans les statistiques vendeur. Introuvable dans le
      code (les seules occurrences sont un article de guide et un nom
      d'animation de tunnel). ⚠️ Exige toujours de POSER la définition d'un
      rebond avant de coder : sans elle, l'indicateur sera joli, faux, et des
      budgets publicitaires seront décidés dessus.
- [ ] **(10) Cadence des relances de panier abandonné : 5 min / 10 min / 24 h.**
      Les relances existent (`cron/send-abandon-reminders`, `abandoned-cart-email`,
      `abandon-stale-checkouts`) et la garde essentielle est en place —
      `recoveredAt:null`, donc on ne relance jamais quelqu'un qui a fini par
      payer. Mais les tâches tournent **une fois par jour** (`0 11 * * *`,
      `0 12 * * *`), pas aux intervalles demandés.

## ❓ À confirmer avec le fondateur

- **(11)** Le widget « Revenu du mois » devait devenir « Revenus » (total depuis
  la création). Le libellé d'origine n'existe plus ; reste à vérifier que le
  chiffre affiché est bien cumulé et non mensuel.
- **(5)** Bouton « Voir la boutique » demandé **dans la barre supérieure du
  dashboard**. Un bouton du même nom existe sur la page d'une boutique
  (`vendeur/boutiques/[id]/page.tsx:209`) — ce n'est peut-être pas l'endroit visé.

---

## Anciens points « restés ouverts » — tous fermés le 2026-09-06

- ~~Appel de statut iPay refusé (« Missing params »), le Niger encaisse sans
  livrer~~ → **corrigé dans le code.** `lib/ipaymoney.ts` envoie désormais
  l'en-tête `Ipay-Payment-Type` sur TOUS les appels, y compris la consultation
  de statut (c'était son absence qui provoquait le refus), et `currency` au
  moment de l'initialisation. La réconciliation distingue une erreur
  PERMANENTE d'une indisponibilité passagère, au lieu de laisser la vente en
  « attente » indéfiniment. Reste à confirmer par un appel réel (admin →
  test-gateway, ou un passage de `cron/collect-reconcile`).
- ~~Taux de change codés en dur, non éditables en admin~~ → **faux depuis
  `lib/currency/taux-store.ts`** : les taux vivent dans `FormationsConfig`
  (clé `currency.rates`), sont modifiables en admin, validés à l'écriture, et
  retombent sur les valeurs du code si la base est injoignable.
  Contrôle du 2026-09-06 contre le marché : les 13 devises sont dans une marge
  de ±3 % (plus gros écart GNF +2,9 %, GHS +2,3 %). Rien à corriger.
- ~~Cron d'alerte des ventes bloquées : déclenchement manuel « Unauthorized »~~
  → **ce n'est pas une panne.** `lib/cron/auth.ts` exige
  `Authorization: Bearer $CRON_SECRET` ; l'en-tête `x-vercel-cron` seul est
  refusé **volontairement** (n'importe qui pouvait l'ajouter et déclencher les
  versements). Déclenchement manuel :
  `curl -H "Authorization: Bearer $CRON_SECRET" https://novakou.com/api/cron/alerte-ventes-bloquees`

---

## Ouvert depuis la session du 2026-09-06

- [ ] **Sous-domaine gratuit `<slug>.novakou.com` — deux gestes d'infra.**
      Le code est en place et vérifié ; rien ne fonctionne avant :
      1. Vercel → équipe → Domains → réclamer `novakou.com` (sinon chaque
         boutique exige son propre enregistrement TXT : impraticable à 641).
      2. Cloudflare → CNAME `*` → `cname.vercel-dns.com`, **DNS only**.
      Ensuite `cron/sous-domaines-boutiques` rattrape seul (~10 h pour 641,
      plafond Vercel de 100 ajouts/heure).
- [ ] **Sessions et sous-domaines.** Les cookies NextAuth sont *host-only* :
      un acheteur connecté sur `novakou.com` sera vu déconnecté sur
      `<slug>.novakou.com`. À trancher AVANT d'annoncer l'adresse aux vendeurs.
- [ ] **Sentry est muet en production.** Les quatre fichiers de configuration
      existent et lisent `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` ; aucune clé
      `SENTRY_*` n'existe côté Vercel. Aucune erreur de production n'est donc
      remontée. Il manque le DSN du projet Sentry.
- [ ] **Sauvegarder `PAYMENT_CREDENTIALS_KEY` hors de Vercel.** Elle y est
      déclarée « sensitive », donc illisible ensuite — y compris par son
      propriétaire. Elle chiffre les identifiants des SIX passerelles de
      paiement en base, et désormais les secrets TOTP. Si elle est perdue,
      rien de tout cela n'est récupérable. Une copie dans un gestionnaire de
      mots de passe.

- [ ] **Wave CI — demander à FeexPay d'activer le marchand agrégé Wave.**
      Constaté le 2026-09-06 sur un versement réel : `MISSING_WAVE_AGGREGATED_MERCHANT`,
      la même erreur qui avait fermé l'encaissement en août. Le compte n'est
      ouvert à Wave CI dans AUCUN sens. Les deux routes sont donc fermées dans
      le registre ; les vendeurs ivoiriens gardent Orange CI, MTN CI et Moov CI.
      Rouvrir `wave_ci.payout` (et `collect`) dès que FeexPay confirme.
- [ ] **Wave SN : à tester.** Le versement `wave_sn` passe toujours par FeexPay,
      et le seul refus enregistré datait de l'ancienne passerelle — donc aucune
      preuve pour ou contre sur la pile actuelle. Si le marchand agrégé Wave
      manque pour le Sénégal aussi, le prochain retrait le dira désormais
      clairement au lieu de rester bloqué en « incertain ».

- [x] ~~FeexPay : whitelister les deux IP du proxy Fixie~~ → **déjà fait**
      depuis le 02/08/2026 09:54 et 09:55 : `54.195.3.54` et `54.217.142.99`
      sont actives dans le tableau de bord FeexPay. Ce n'était donc PAS la
      cause des refus d'IP.
- [ ] **Surveiller la consommation du forfait Fixie (2 500 requêtes/mois).**
      C'était la vraie cause : les sondes de statut FeexPay sortent par le
      proxy, et `cron/payout-reconcile` tournait toutes les 10 min pendant 14
      jours → 2 016 requêtes pour UN SEUL versement bloqué, soit 81 % du
      forfait. Quota vidé le 18/08, Fixie refuse, repli en direct, IP Vercel,
      refus FeexPay. Corrigé le 2026-09-07 par un palier dégressif (81 sondes
      au lieu de 2 016, soit 3 % du forfait), verrouillé par
      `tests/payout-cadence.spec.ts`. Vérifier la page History de Fixie pour
      confirmer que la consommation est redescendue.

---

## Signalé par un vendeur le 2026-09-07 (Jean Yves Ouguin, campagne TikTok)

- [x] ~~« Visiteurs » affichait 4 263 pour une boutique neuve~~ → **corrigé.**
      Le compteur additionnait les `page_view` de TOUTE la plateforme
      (`getEvents` sans filtre vendeur). Il compte désormais les sessions
      distinctes sur les pages du vendeur : 447 au lieu de 4 030 sur 30 jours.
- [x] ~~Les périodes 7/30/90 jours ne remontaient que ~4 jours~~ → **corrigé.**
      `take: 5000` sur un tri antichronologique plateforme : le plafond était
      atteint avant le début de la période. La requête est maintenant
      restreinte au vendeur en base (`productScope`).
- [x] ~~Étage « Checkout » de l'entonnoir vide (« — »)~~ → **corrigé.** Il lit
      les tentatives de paiement en base (`CheckoutAttempt.productId`), et
      s'appelle « Paiement lancé » — ce qu'il mesure vraiment.
- [x] ~~Soupçon de trafic robot~~ → **écarté, preuve à l'appui.** La détection
      existe et rejette les robots dès l'ingestion (204, jamais stockés). 887
      des 923 événements de sa fiche viennent du navigateur interne TikTok :
      du trafic humain. NE PAS ajouter TikTok au filtre.
- [ ] **11 demandes KYC en attente, aucune revue.** La sienne date du
      2026-09-07 19h27 (passeport complet). Le KYC ne bloque ni le paiement ni
      le tracking (`placeOrder` exige le niveau 1) — mais il bloquera son
      RETRAIT le jour où il vendra.
- [ ] **Wave CI coûte des ventes maintenant.** 396 de ses 446 visiteurs sont en
      Côte d'Ivoire, et Wave y est fermé à l'encaissement depuis le 08/08.
      Ils ne voient qu'Orange, MTN et Moov.

---

## Audit des moyens de retrait et d'encaissement — 2026-09-08

Demande du fondateur : ne laisser sur le site QUE ce qui est réellement
fonctionnel, passerelle par passerelle, partout.

- [x] ~~FedaPay : quatre routes de versement promises sans que le moteur sache
      les appeler~~ → **corrigé.** L'adaptateur consulte désormais le registre
      (même règle que PawaPay et FeexPay). `mtn_ci` ajouté à la table (mode
      confirmé par leur doc de versement) ; `freemoney_sn`, `airtel_ne`,
      `moov_tg` retirés du registre au versement (confirmés à l'encaissement
      seulement). **Airtel Niger n'est plus proposé au retrait** : c'était sa
      seule route et elle n'a jamais été exécutable. Trois invariantes le
      verrouillent, dont « tout moyen proposé a une route exécutable ».
- [x] ~~Panneau « Paiements » du vendeur : Wave et PayPal proposés à tous~~ →
      **corrigé.** Comptes de retrait dérivés du registre pour le pays du
      vendeur (+ virement, traité à la main) ; familles d'encaissement
      affichées seulement si le registre en encaisse au moins un opérateur.
      Les anciens codes génériques enregistrés restent lisibles et
      re-sauvegardables, résolus par pays au retrait.
- [x] ~~API affilié : repli sur le catalogue COMPLET quand un pays n'a aucune
      route~~ → **corrigé.** Liste vide, et l'écran dit « pas encore
      disponible ».
- [x] ~~`lib/paygenius-payout-methods.ts`~~ → **supprimé** (aucun import,
      passerelle retirée).
- [ ] **Sonde de couverture déployée** (`cron/diagnostic-couverture`, manuelle,
      CRON_SECRET) : PawaPay `/v2/active-conf` confronté au registre dans les
      deux sens, et demande d'encaissement Wave CI / Wave SN chez FeexPay vers
      un numéro de test. À appeler après déploiement ; ses résultats décident
      des dernières fermetures/réouvertures.
