## 1. Null safety — toLocaleString (crashs)

- [x] 1.1 Grep exhaustif de TOUS les `.toLocaleString(` dans `apps/web/app/` et proteger avec `?? 0` chaque appel sur un champ potentiellement undefined (amount, price, budget, commission, revenue, views, etc.)
- [x] 1.2 Verifier les fichiers prioritaires : admin/page.tsx, admin/litiges, admin/utilisateurs/[id], admin/commandes, admin/finances, formations/[slug], dashboard/explorer, agence/candidatures
- [x] 1.3 Verifier qu'aucun `.toLocaleString()` n'est appele sur un objet (ex: `budget.min.toLocaleString`) sans optional chaining `budget?.min`

## 2. Images services — affichage dans le marketplace

- [x] 2.1 Corriger la ServiceCard dans `(public)/explorer/page.tsx` : afficher `<img src={service.image}>` avant le gradient/icon fallback
- [x] 2.2 Verifier que l'API `/api/public/services` retourne un champ `image` (mainImage ou images[0]) dans la reponse
- [x] 2.3 Appliquer `optimizedUrl()` de Cloudinary sur les images dans l'explorer et le feed
- [x] 2.4 Verifier les images sur la page detail service : galerie, thumbnails, avatar vendeur

## 3. Video service — lecteur integre

- [x] 3.1 Ajouter un composant video sur `(public)/services/[slug]/page.tsx` apres la galerie d'images : iframe YouTube/Vimeo ou `<video>` natif selon l'URL
- [x] 3.2 Supporter les 3 formats : youtube.com/watch?v=, youtu.be/, vimeo.com/, et video directe (mp4/webm)
- [x] 3.3 Aspect-ratio 16:9 responsive, bordure et arrondis coherents avec le design

## 4. Messagerie — envoi et reception de messages

- [x] 4.1 Verifier que POST `/api/conversations/[id]/messages` fonctionne en mode Prisma (cree un Message en base)
- [x] 4.2 Verifier que GET `/api/conversations/[id]/messages` retourne les messages en mode Prisma
- [x] 4.3 Verifier que le composant MessagingLayout envoie les messages via l'API et affiche les reponses
- [x] 4.4 Tester le flux complet : clic "Contacter" sur profil freelance → creation conversation → envoi message → redirect vers /messages → message visible

## 5. Admin — actions sur les services

- [x] 5.1 Verifier que le store admin (`store/admin.ts`) appelle PATCH `/api/admin/services/[id]` avec `{ action: "approve" }` (pas `{ status: "ACTIF" }`)
- [x] 5.2 Verifier que les boutons Approuver, Refuser, Pause, Vedette sur `admin/services/page.tsx` appellent les bonnes methodes du store
- [x] 5.3 Verifier que le endpoint PATCH `/api/admin/services/[id]` fonctionne en mode Prisma pour toutes les actions (approve, refuse, pause, feature, unfeature, delete)
- [x] 5.4 Verifier que les notifications sont envoyees au freelance apres chaque action admin

## 6. Commande service — flux d'achat

- [x] 6.1 Ajouter un modal de commande sur `(public)/services/[slug]/page.tsx` : resume du forfait selectionne, champ requirements, bouton confirmer
- [x] 6.2 Le modal appelle POST `/api/orders` avec `{ serviceId, packageType, requirements }`
- [x] 6.3 Verifier que POST `/api/orders` fonctionne en mode Prisma : cree Order + Payment + Conversation
- [x] 6.4 Apres creation, redirect vers `/client/commandes/[orderId]` ou afficher un message de succes

## 7. Candidatures client — visibilite et approbation

- [x] 7.1 Verifier que GET `/api/projects/[id]/bids` retourne les candidatures avec profils freelance en mode Prisma
- [x] 7.2 Verifier que `client/projets/[id]/page.tsx` affiche les candidatures avec nom, avatar, prix propose, motivation
- [x] 7.3 Verifier que les boutons Accepter/Refuser appellent les bons endpoints et mettent a jour l'UI
- [x] 7.4 Afficher le nombre de candidatures sur la liste des projets dans `client/projets/page.tsx`

## 8. Edition service — PATCH complet

- [x] 8.1 Completer le handler PATCH `/api/services/[id]` en mode Prisma pour supporter TOUS les champs du wizard (title, description, categoryId, tags, basePrice, deliveryDays, packages, etc.)
- [x] 8.2 Gerer la mise a jour des images dans PATCH : supprimer les anciennes ServiceMedia et creer les nouvelles
- [x] 8.3 Gerer la mise a jour des options dans PATCH : supprimer les anciennes ServiceOption et creer les nouvelles
- [x] 8.4 Verifier que le wizard en mode edit envoie bien un PATCH au lieu d'un POST

## 9. Verification finale

- [x] 9.1 Executer `npx tsc --noEmit` — 0 erreurs
- [x] 9.2 Executer `next build` — build reussi sans erreurs
- [ ] 9.3 Tester le flux service : creation → en attente admin → approbation → visible dans marketplace → commande par client
- [ ] 9.4 Tester le flux projet : publication → candidature freelance → client voit candidature → approbation → commande creee
- [ ] 9.5 Tester la messagerie : contacter vendeur → message envoye → visible dans /messages
