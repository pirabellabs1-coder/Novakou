## 1. Cards de services — Données réelles Prisma

- [x] 1.1 Modifier `/api/public/services/route.ts` : supprimer le fallback IS_DEV vers dev stores, toujours requêter Prisma avec `include: { _count: { select: { orders: { where: { status: { in: ['LIVRE', 'TERMINE'] } } }, reviews: true } } }` pour obtenir les vrais compteurs
- [x] 1.2 Modifier `/api/public/top-services/route.ts` : même traitement — supprimer IS_DEV fallback, utiliser Prisma `_count` pour les vrais orderCount et ratingCount
- [x] 1.3 Modifier le composant ServiceCard dans `explorer/page.tsx` : afficher `orderCount` réel (ex: "10 ventes"), `rating` moyen réel avec étoiles, `ratingCount` réel (ex: "(5 avis)"), badge "Nouveau" si 0 avis
- [x] 1.4 Modifier `PopularServicesSection.tsx` (landing page) : utiliser les mêmes champs que l'explorer pour les cards de services populaires
- [x] 1.5 Modifier les cards vendeur : afficher le vrai avatar (Cloudinary URL), badge "Vérifié" basé sur `kycLevel >= 3`, badge plan (Pro/Business), vrai pays
- [x] 1.6 Ajouter le support agence sur les cards : si `agencyId` présent, afficher nom agence + logo + badge "Agence" au lieu du freelancer individuel
- [x] 1.7 Vérifier que les cards dans `/agence/services/page.tsx` utilisent la même logique de données réelles

## 2. SEO des services — Fonctionnel de bout en bout

- [x] 2.1 Créer le composant `SeoEditor` (modal/panel) avec champs : metaTitle (max 70 chars), metaDescription (max 160 chars), tags (max 10), score SEO en temps réel avec recommandations
- [x] 2.2 Intégrer le `SeoEditor` dans `/dashboard/services/page.tsx` : bouton "SEO" par service qui ouvre l'éditeur, appel GET `/api/services/[id]/seo` pour charger les données, PATCH pour sauvegarder
- [x] 2.3 Intégrer le `SeoEditor` dans `/agence/services/page.tsx` : même bouton et même comportement
- [x] 2.4 Modifier `/api/services/[id]/seo/route.ts` : supprimer le fallback IS_DEV, toujours utiliser Prisma pour GET et PATCH
- [x] 2.5 Implémenter `generateMetadata()` dans `/services/[slug]/page.tsx` : fetch Prisma pour metaTitle (fallback: title), metaDescription (fallback: description tronquée 160 chars), og:title, og:description, og:image (première image du service)
- [x] 2.6 Ajouter JSON-LD Schema.org `Service` dans la page service : @type, name, description, aggregateRating, offers avec price/priceCurrency

## 3. Boost de services — UI complète

- [x] 3.1 Créer la page `/dashboard/services/boost/page.tsx` : sélection du service (dropdown des services actifs), choix du tier (Standard 7j / Premium 14j / Ultime 30j), calcul automatique affiché (coût, impressions estimées, durée)
- [x] 3.2 Ajouter la vérification des limites du plan : Free=0 boosts (message upgrade), Pro=1/mois, Business=5/mois, Agence=10/mois — afficher message si limite atteinte
- [x] 3.3 Implémenter le bouton de confirmation : appel POST `/api/services/[id]/boost`, gestion des erreurs (déjà boosté, limite atteinte), redirection vers la page stats après succès
- [x] 3.4 Créer la page stats `/dashboard/services/boost/[boostId]/page.tsx` : appel GET `/api/services/[id]/boost`, afficher impressions totales vs estimées (progress bar), clics, contacts, commandes, taux de conversion, graphique journalier, jours restants
- [x] 3.5 Dupliquer les pages boost pour l'agence : `/agence/services/boost/page.tsx` et `/agence/services/boost/[boostId]/page.tsx` avec les mêmes fonctionnalités
- [x] 3.6 Modifier le tracking des vues (`track-view` route) : si le service a un boost actif, incrémenter `BoostDailyStat.impressions` du jour en plus du compteur global
- [x] 3.7 Modifier le tracking des clics (`track-click` route) : si le service a un boost actif, incrémenter `BoostDailyStat.clicks` du jour
- [x] 3.8 Ajouter les appels de tracking dans `explorer/page.tsx` : appeler track-view quand une card boostée est rendue, appeler track-click quand elle est cliquée

## 4. Propositions — Flux complet avec statuts

- [x] 4.1 Créer le endpoint `PATCH /api/propositions/[id]/route.ts` : actions `accept` (crée une commande via order-creation-flow, met status ACCEPTED, set acceptedAt) et `reject` (met status REJECTED, set rejectedAt), validation que le caller est le client, validation state transition (pas de double traitement)
- [x] 4.2 Modifier `/dashboard/candidatures/page.tsx` : afficher la liste des propositions du freelance avec statut coloré (PENDING=jaune, VIEWED=bleu, ACCEPTED=vert, REJECTED=rouge, EXPIRED=gris), filtres par statut, lien vers le projet/client
- [x] 4.3 Modifier la page projet client pour afficher les propositions reçues : nom freelancer, avatar, note, montant proposé, délai, extrait lettre de motivation, boutons Accepter/Rejeter
- [x] 4.4 Ajouter la création de notification dans le PATCH propositions : "Votre proposition pour [projet] a été acceptée/refusée"
- [x] 4.5 Connecter l'acceptation de proposition à la création de commande : réutiliser le flux order-creation-flow avec montant et délai de la proposition

## 5. Commissions et Admin Wallet

- [x] 5.1 Modifier le flux de création de commande (toutes sources : service achat, bid, offre, proposition) : calculer `platformFee` selon le plan du freelance (FREE=20%, PRO=15%, BUSINESS=10%, AGENCE=8%), stocker `platformFee` et `freelancerPayout` sur l'Order
- [x] 5.2 Créer un `AdminTransaction` de type `SERVICE_FEE` avec status `PENDING` à chaque création de commande, lié à l'AdminWallet
- [x] 5.3 Modifier le flux de libération d'escrow (validation livraison) : passer `AdminTransaction.status` de PENDING à CONFIRMED, incrémenter `AdminWallet.totalFeesReleased`
- [x] 5.4 Vérifier que le dashboard admin (`/admin/dashboard`) affiche les totaux du wallet : fees held, fees released, nombre de transactions, dernières transactions

## 6. Vérification et cohérence

- [x] 6.1 Tester end-to-end : créer un service → le voir dans explorer avec 0 ventes → commander → valider livraison → vérifier que la card affiche maintenant 1 vente et que l'admin wallet a reçu la commission
- [x] 6.2 Tester le SEO : éditer les champs SEO → vérifier que `generateMetadata` retourne les bonnes valeurs → vérifier le JSON-LD dans le HTML
- [x] 6.3 Tester le boost : activer un boost → vérifier le statut isBoosted sur la card → visiter la page stats → vérifier que les impressions s'incrémentent
- [x] 6.4 Tester les propositions : envoyer une proposition → la voir dans candidatures avec statut PENDING → l'accepter côté client → vérifier que la commande est créée et le statut passe à ACCEPTED
