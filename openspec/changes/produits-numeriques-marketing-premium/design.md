## Context

La plateforme FreelanceHigh Formations est fonctionnelle en MVP (cours vidéo, paiement Stripe, certificats PDF, admin). Le schéma Prisma contient déjà les modèles Formation, Enrollment, PromoCode, Certificate. Les descriptions de formations sont actuellement en texte brut. Il n'existe aucun modèle pour les produits numériques standalone, l'automatisation marketing, ou le tracking publicitaire. Le composant Tiptap RichTextEditor existe déjà dans `components/services/wizard/editor/` mais n'est pas intégré dans les formations. Supabase Storage est déjà utilisé pour les fichiers de leçons (PDFs, vidéos, audios). L'email transactionnel utilise Resend + React Email avec 9 templates existants.

## Goals / Non-Goals

**Goals:**
- Permettre aux instructeurs de vendre des produits numériques (ebooks, PDFs, templates, licences) en plus des cours
- Offrir un éditeur de description riche (Tiptap) pour formations et produits numériques
- Implémenter les promotions flash avec countdown timer et stock limité
- Automatiser la relance des paniers abandonnés et paiements échoués via BullMQ
- Intégrer les pixels publicitaires (Facebook, Google, TikTok) configurables par instructeur
- Fournir un dashboard marketing complet aux instructeurs

**Non-Goals:**
- Pas d'intégration WhatsApp Business API dans cette itération (prévu V3)
- Pas de système d'affiliation/parrainage (prévu V2+)
- Pas de A/B testing des emails (prévu V3)
- Pas de DRM avancé sur les PDFs (filigrane simple seulement)
- Pas de streaming vidéo HLS/DASH (les cours vidéo restent via URL externe)
- Pas de système de bundles multi-produits (prévu itération suivante)

## Decisions

### 1. Modèle DigitalProduct séparé de Formation

**Choix :** Créer un modèle `DigitalProduct` distinct plutôt que d'ajouter un type "produit" à Formation.

**Raison :** Une Formation a une structure curriculum (sections, leçons, quiz, progression). Un produit numérique est un fichier unique ou un ensemble de fichiers téléchargeables. Mélanger les deux dans le même modèle complexifierait la logique de progression, de certificats et d'UI. Les seuls points communs (prix, instructeur, catégorie, description) peuvent être gérés via des relations partagées.

**Alternative rejetée :** Ajouter `productType: COURS | EBOOK | LICENCE` sur Formation — cela aurait rendu le wizard de création incohérent (étapes curriculum inutiles pour un PDF).

### 2. Descriptions en Tiptap JSON (pas Markdown brut)

**Choix :** Stocker les descriptions au format Tiptap JSON dans les champs existants `descriptionFr`/`descriptionEn` avec un champ `descriptionFormat` pour la migration progressive.

**Raison :** Le composant RichTextEditor Tiptap existe déjà pour les services. Tiptap JSON est plus structuré que le Markdown brut, permet l'insertion d'images inline, de tableaux, de blocs callout. Le rendu côté public utilise `@tiptap/react` en mode readonly, garantissant un rendu identique à l'édition.

**Migration :** Les descriptions existantes en texte brut seront wrappées automatiquement dans un nœud `paragraph` Tiptap à la lecture (`descriptionFormat === 'text'` → conversion à la volée, `descriptionFormat === 'tiptap'` → rendu direct).

### 3. Filigrane PDF côté serveur via pdf-lib

**Choix :** Utiliser `pdf-lib` pour générer les aperçus filigranés à la volée lors de la requête GET `/api/produits/[id]/preview`.

**Raison :** `pdf-lib` est une librairie pure JavaScript sans dépendance native, compatible Vercel Edge et Railway. Elle permet d'ajouter un texte filigrane sur chaque page d'un PDF existant. Le résultat est mis en cache Redis (TTL 1h) pour éviter la régénération.

**Alternative rejetée :** Pré-générer les aperçus au moment de l'upload — cela nécessiterait de régénérer si le vendeur change les paramètres de filigrane.

### 4. Paniers abandonnés via cron BullMQ (pas Stripe Checkout expiration)

**Choix :** Détecter les paniers abandonnés côté application (CartItem > 1h sans checkout) plutôt que d'utiliser l'expiration des sessions Stripe Checkout.

**Raison :** Beaucoup d'utilisateurs ajoutent au panier sans jamais initier le checkout (pas de session Stripe créée). La détection côté application capture ces cas. Le système utilise un cron BullMQ toutes les 30 minutes qui vérifie les CartItem avec `updatedAt < now() - 1h` et aucun Enrollment correspondant.

**Séquence d'emails :**
1. **1h** après ajout panier : "Vous avez oublié quelque chose !" (taux récupération ~10%)
2. **24h** : "Votre formation vous attend" + rappel bénéfices
3. **7j** : "Dernière chance" + petit incentive (-5% si PromoCode système)

### 5. Pixels publicitaires via script injection conditionnelle

**Choix :** Injecter les scripts pixels (fbq, gtag, ttq) dans le `<head>` via un composant `PixelTracker` au niveau du layout formations, en chargeant la config depuis l'API par formation consultée.

**Raison :** Chaque instructeur configure ses propres pixels (son compte Facebook Ads, son Google Ads). Le pixel doit se déclencher sur la page détail de SA formation uniquement. Le composant PixelTracker :
1. Récupère les pixels de l'instructeur de la formation courante
2. Injecte les scripts dans le `<head>` via `next/script`
3. Déclenche les événements standards : `PageView`, `AddToCart`, `Purchase`

**Sécurité :** Seuls les IDs de pixels sont stockés (pas de scripts custom). Les scripts sont chargés depuis les CDNs officiels (connect.facebook.net, googletagmanager.com, analytics.tiktok.com).

### 6. Webhook Stripe étendu pour paiements échoués

**Choix :** Ajouter les listeners `payment_intent.payment_failed` et `charge.disputed` au webhook existant `/api/webhooks/stripe/route.ts`.

**Raison :** Permet de déclencher immédiatement un email de relance et de mettre à jour le dashboard marketing de l'instructeur. La logique est ajoutée au switch existant dans le webhook handler.

### 7. Stock limité implémenté via compteur atomique Prisma

**Choix :** Utiliser `prisma.$transaction` avec un check-and-decrement atomique pour `maxBuyers` / `maxStudents`.

**Raison :** Évite les race conditions lors d'achats simultanés. Le pattern :
```
BEGIN TRANSACTION
  SELECT currentBuyers FROM DigitalProduct WHERE id = X FOR UPDATE
  IF currentBuyers >= maxBuyers THEN THROW "Stock épuisé"
  UPDATE DigitalProduct SET currentBuyers = currentBuyers + 1
COMMIT
```

## Risks / Trade-offs

**[Filigrane PDF lourd sur gros fichiers]** → Limiter la taille des aperçus à 20 pages max. Les PDFs > 50MB sont tronqués pour l'aperçu. Cache Redis 1h.

**[Pixels tiers ralentissent le chargement]** → Charger les scripts en `afterInteractive` via `next/script`. Mesurer l'impact via Sentry Performance. Désactiver si TTI > 3s.

**[Emails de relance considérés spam]** → Respecter les bonnes pratiques : max 3 emails par panier abandonné, lien de désabonnement, intervalle minimum 1h. Se conformer au RGPD (consentement lors de l'inscription).

**[Race condition stock limité]** → Résolu par la transaction atomique Prisma (décision #7). Risque résiduel : timeout de transaction sous charge extrême → retry automatique avec backoff.

**[Migration descriptions texte → Tiptap]** → Conversion à la volée sans migration de données. Les anciennes descriptions restent lisibles. Seules les nouvelles/modifiées passent en format Tiptap.

**[Coût Redis pour cache aperçus]** → Les aperçus filigranés sont stockés max 1h. Avec Upstash, le coût est proportionnel à l'usage (~$0.20/100K requêtes). Acceptable jusqu'à 10K produits.

## Open Questions

1. **Taux de commission produits numériques** — même 70/30 que les formations, ou taux différent (ex: 80/20 pour les ebooks) ?  → Pour l'instant : même 70/30, configurable admin plus tard.

2. **Limite de taille fichier produit numérique** — 50MB ? 200MB ? 1GB ? → Pour l'instant : 200MB max via Supabase Storage (upgrade possible).

3. **Remboursement produits numériques** — politique identique aux formations (30 jours) ou plus stricte (pas de remboursement car téléchargé) ? → Pour l'instant : remboursement dans les 24h si pas téléchargé, pas de remboursement après téléchargement.
