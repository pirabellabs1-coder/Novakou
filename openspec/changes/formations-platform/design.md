## Context

FreelanceHigh est aujourd'hui une marketplace de services freelance (achat/vente de prestations ponctuelles). La section formations est une nouvelle verticale de product, indépendante du flux de commandes freelance, mais intégrée à la même base utilisateurs, au même système d'auth Supabase et à la même infrastructure de paiement Stripe.

La section formations doit coexister avec l'existant sans casser les flux actuels. Les utilisateurs existants (freelances, clients, agences) peuvent devenir instructeurs ou apprenants sans créer de nouveau compte. L'admin gère les formations dans un sous-panneau dédié à l'intérieur de l'espace admin existant.

**Contraintes :**
- Un seul schéma Prisma, une seule base Supabase — pas de micro-service DB dédié
- Les flux de paiement formations sont distincts des commandes freelance (pas d'escrow, paiement direct + délai de remboursement 30 jours)
- Les vidéos de cours peuvent atteindre plusieurs Go — stratégie d'upload et de streaming à définir
- Les certificats PDF doivent être générés côté serveur (pas de navigateur) avec `@react-pdf/renderer`
- Budget infrastructure MVP : ~$15–45/mois au total — pas de CDN vidéo dédié (MUX, Cloudflare Stream) avant V2

## Goals / Non-Goals

**Goals :**
- Permettre à tout utilisateur FreelanceHigh authentifié (KYC niveau 1 minimum) d'acheter des formations
- Permettre aux instructeurs approuvés de créer et de vendre des formations bilingues FR/EN
- Générer automatiquement des certificats PDF à la complétion d'une formation
- Intégrer les formations dans la navbar existante sans modifier l'architecture de routing Next.js
- Réutiliser Stripe Connect existant pour les paiements formations (pas de nouveau provider)
- Réutiliser Resend + React Email pour les emails de formations
- Stocker les vidéos dans Supabase Storage (buckets privés) pour le MVP

**Non-Goals :**
- Messagerie temps réel instructeur-apprenant (renvoi vers la messagerie existante en V2)
- Streaming adaptatif HLS/DASH avec CDN vidéo dédié (MUX/Cloudflare Stream) — prévu V2
- Sous-titres automatiques générés par IA — prévu V3
- Traduction automatique du contenu des cours en temps réel — prévu V3
- Application mobile native pour le lecteur de cours — couvert par la PWA en V4
- Certifications formelles reconnues par des organismes de certification tiers
- Synchronisation Meilisearch pour la recherche formations — Postgres FTS suffit pour V1

## Decisions

### 1. Route groups Next.js distincts pour chaque espace formations

**Décision :** Utiliser 4 route groups distincts : `(public)/formations/`, `(apprenant)/formations/`, `(instructeur)/formations/instructeur/`, `(paiement)/formations/`.

**Rationale :** Les layouts, middlewares et protections d'accès sont radicalement différents entre les espaces. Le lecteur de cours (`(apprenant)/formations/apprendre/[id]`) est plein écran sans footer ni sidebar, ce qui est incompatible avec le layout public. Les route groups permettent de partager des layouts par espace sans créer de conflits.

**Alternative rejetée :** Un seul route group avec des layouts conditionnels. Rejeté car cela complique la logique de protection des routes et rend difficile la maintenance.

### 2. Stockage vidéo dans Supabase Storage pour le MVP

**Décision :** Les vidéos de cours sont uploadées dans des buckets Supabase Storage privés avec RLS. Le lecteur vidéo consomme des URLs signées à durée limitée (1h).

**Rationale :** Coût $0 au MVP, intégré à l'infrastructure existante. Supabase Storage supporte des fichiers jusqu'à 50GB par défaut. Convient pour < 100 cours.

**Alternative rejetée :** MUX ou Cloudflare Stream. Rejeté pour le MVP car coût minimum $20–50/mois même sans utilisation, et nécessite un workflow d'intégration supplémentaire.

**Chemin d'upgrade V2 :** Ajouter un champ `videoMuxId` dans le modèle `Lesson` et un worker BullMQ pour uploader vers MUX après création. Les URL signées sont remplacées par des URL MUX. Aucune migration de données côté apprenant nécessaire.

### 3. Génération de certificats PDF via job BullMQ côté serveur

**Décision :** La génération du certificat PDF est effectuée dans un worker BullMQ `certificate-generator.worker.ts` dans `apps/api`, en utilisant `@react-pdf/renderer` en Node.js (server-side). Le PDF généré est stocké dans un bucket Supabase Storage privé `certificates/`. Un lien signé est envoyé par email.

**Rationale :** `@react-pdf/renderer` ne fonctionne pas dans les React Server Components Next.js (dépendances Node.js incompatibles avec Edge Runtime). Le job BullMQ garantit la robustesse (retry en cas d'échec), asynchronisme (ne bloque pas la requête utilisateur), et isolation de la logique PDF dans le backend.

**Alternative rejetée :** Génération côté client dans le navigateur avec `react-pdf`. Rejeté car le PDF final doit être sauvegardé sur le serveur pour la vérification d'authenticité et le partage LinkedIn.

### 4. Paiement formations via Stripe Checkout séparé du flux commandes freelance

**Décision :** Les formations utilisent Stripe Checkout (session one-time ou multi-items pour le panier), sans escrow. Un webhook Stripe `checkout.session.completed` déclenche la création de l'enrollment. Le remboursement est géré manuellement par l'admin via l'API Stripe.

**Rationale :** Les formations ne nécessitent pas d'escrow (il n'y a pas de livraison asynchrone à valider). La politique de remboursement 30 jours est plus simple que l'escrow freelance et correspond au standard Udemy. Stripe Checkout gère nativement l'interface de paiement, les méthodes (carte, PayPal, Apple Pay, Google Pay).

**Alternative rejetée :** Réutiliser le flux escrow existant. Rejeté car conceptuellement différent — une formation est livrée instantanément à l'achat (accès immédiat), pas à terme.

### 5. Modèle de données formations dans le schéma Prisma existant

**Décision :** Les 12 nouveaux modèles formations sont ajoutés directement dans `packages/db/schema.prisma`, dans une section clairement délimitée par des commentaires. Pas de schéma séparé, pas de base de données distincte.

**Rationale :** Prisma 5 ne supporte pas les multi-schema natifs de manière stable. La cohérence transactionnelle entre User et ses enrollments/formations est essentielle. Un seul schéma Prisma = source unique de vérité.

**Alternative rejetée :** Base de données Supabase distincte. Rejeté car complexité opérationnelle accrue, impossibilité de faire des JOIN cross-DB, et duplication du modèle User.

### 6. Progression des leçons sauvegardée via appel API optimiste

**Décision :** La progression (`LessonProgress`) est sauvegardée via un appel tRPC `formations.updateLessonProgress` déclenché à 90% de visionnage (pour les vidéos) ou au clic sur "Marquer comme complétée". TanStack Query gère l'optimistic update côté client.

**Rationale :** La sauvegarde doit être robuste (retry en cas de perte de connexion) mais pas en temps réel (pas besoin de WebSocket pour ça). Un appel REST/tRPC simple avec retry est suffisant. L'optimistic update assure une UX fluide.

**Alternative rejetée :** Supabase Realtime pour la progression. Rejeté car overkill — la progression n'a pas besoin d'être synchronisée en temps réel entre plusieurs onglets.

### 7. Système bilingue FR/EN — namespaces next-intl distincts

**Décision :** 4 nouveaux namespaces next-intl : `formations`, `apprenant`, `instructeur`, `formations-admin`. Chargés à la demande (lazy loading) uniquement sur les pages `/`. Les contenus des cours eux-mêmes (titres, descriptions) sont stockés bilingues en DB (`titleFr`, `titleEn`, `descriptionFr`, `descriptionEn`).

**Rationale :** Séparation claire entre les traductions d'interface (gérées par next-intl) et le contenu bilingue des cours (géré en DB). Le lazy loading des namespaces évite d'alourdir le bundle des pages non-formations.

**Alternative rejetée :** Stocker uniquement en FR et utiliser l'IA pour traduire en EN. Rejeté car les traductions automatiques sont insuffisantes pour du contenu pédagogique, et cela crée une dépendance à OpenAI pour chaque cours.

### 8. Commission instructeur : 70/30 sans Stripe Connect pour les instructeurs

**Décision :** Les instructeurs ne sont pas des "connected accounts" Stripe. La plateforme reçoit 100% du paiement Stripe. La commission 70% instructeur est calculée en DB et le reversement est effectué via virement manuel (SEPA) ou Mobile Money (CinetPay) à la demande de retrait de l'instructeur.

**Rationale :** Stripe Connect Onboarding pour chaque instructeur est complexe (KYC Stripe supplémentaire, frais, délais). Pour le MVP, le modèle "plateforme comme intermédiaire" avec reversement sur demande est standard dans l'e-learning (Udemy fonctionnait ainsi à ses débuts). La table `InstructorEarning` garde une traçabilité comptable complète.

**Alternative rejetée :** Stripe Connect Express pour chaque instructeur. Prévu pour V2 si le volume de retraits devient trop important à gérer manuellement.

## Risks / Trade-offs

**[Risque] Taille des fichiers vidéo dans Supabase Storage (limite 50GB free tier)**
→ Mitigation : Limiter les uploads à 2GB par vidéo. Monitorer l'usage Supabase. Prévoir l'upgrade Supabase Pro ($25/mois) à partir de 50+ cours vidéo.

**[Risque] Performance de la génération PDF avec @react-pdf/renderer (CPU-bound)**
→ Mitigation : Job BullMQ asynchrone, l'utilisateur reçoit une notification quand c'est prêt. Timeout job à 30 secondes, retry x3. Mettre en cache le PDF généré dans Supabase Storage (pas de régénération si le fichier existe déjà).

**[Risque] Abus du remboursement 30 jours (regarder tout le cours puis demander remboursement)**
→ Mitigation : Politique interne : remboursement refusé si > 30% du cours visionné. L'admin voit la progression avant de valider le remboursement. À documenter dans les CGU.

**[Risque] Upload de vidéos volumineux depuis le wizard instructeur (UX degradée)**
→ Mitigation : Utiliser le système d'upload multipart de Supabase. Afficher une barre de progression. Permettre l'ajout d'une URL YouTube/Vimeo comme alternative aux uploads directs.

**[Risque] Concurrence entre les deux Stripe Checkout (formations + abonnements)**
→ Mitigation : Les webhooks Stripe sont distingués par les metadata `type: "formation"` vs `type: "subscription"`. Les handlers BullMQ sont séparés.

**[Risque] Les instructeurs avec peu de formations ne génèrent pas assez de revenus pour justifier la section**
→ Mitigation : Pas de risque technique. Risque business atténué par la landing page "Devenir instructeur" qui filtre les candidatures.

## Migration Plan

**Ordre de déploiement :**

1. `packages/db` : Nouvelle migration Prisma (`prisma migrate deploy`). Les nouvelles tables sont créées sans impact sur les tables existantes. Les RLS policies sont ajoutées dans la même migration.
2. `apps/api` : Déploiement des nouvelles routes tRPC et workers BullMQ sur Railway. Les routes existantes ne sont pas modifiées.
3. `packages/ui` : Nouveaux templates React Email déployés avec les autres packages.
4. `apps/web` : Déploiement sur Vercel. Le lien navbar "Formations" est masqué par défaut via un feature flag `NEXT_PUBLIC_FORMATIONS_ENABLED=true` en variable d'environnement Vercel — cela permet de déployer sans exposer la section tant que le contenu initial n'est pas prêt.

**Rollback :**
- Si un bug critique est détecté sur les nouvelles tables : `prisma migrate rollback` (nouvelle migration `down`). Les tables formations sont supprimées, les tables existantes ne sont pas affectées.
- Si un bug frontend : revenir à la PR précédente sur Vercel (one-click rollback).
- Le feature flag `NEXT_PUBLIC_FORMATIONS_ENABLED` permet de désactiver la section sans rollback.

## Open Questions

1. **Hébergement vidéo à partir de V2** : Confirmer le choix entre MUX ($20/mois base) et Cloudflare Stream ($5/1000 min). À décider avant d'atteindre 50 formations vidéo.

2. **Stripe Connect pour les instructeurs en V2** : Définir le seuil de volume de retraits à partir duquel automatiser via Stripe Connect Express (vs. virements manuels).

3. **Modération des cours** : La modération manuelle est acceptable pour le MVP (< 50 cours). À quelle volumétrie passer à une modération assistée par IA (V3) ?

4. **Certifications formation vs. certifications de compétences IA** (feature existante dans `dashboard/certifications`) : Ce sont deux systèmes distincts. À terme (V3), devraient-ils être unifiés dans un seul profil de compétences ? Ne pas les fusionner pour le MVP.

5. **Devise des formations** : Les prix des formations sont affichés en EUR et convertis selon la devise choisie par l'utilisateur (même système que les services freelance). À confirmer si on veut aussi supporter le paiement en FCFA via CinetPay pour les formations (V1).
