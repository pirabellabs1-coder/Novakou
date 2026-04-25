## 1. Layout et fondations (client-layout)

- [x] 1.1 Refondre `apps/web/app/client/layout.tsx` : layout flex h-screen avec sidebar fixe (w-64), header sticky (h-16 backdrop-blur), zone contenu scrollable. Fond dark `#112114`, police Manrope via `next/font/google`
- [x] 1.2 Refondre `apps/web/components/client/ClientSidebar.tsx` : fond dark, logo bolt vert `#19e642`, titre "Espace Client", 5 items navigation avec icônes Material Symbols (dashboard, assignment, chat, favorite, receipt_long), état actif bg-primary/10 + bordure droite verte, bouton CTA "+ Nouveau Projet" en bas avec shadow
- [x] 1.3 Créer `apps/web/components/client/ClientHeader.tsx` : header sticky avec champ recherche ("Rechercher un projet..."), icône notification bell, icône settings, nom "Jean Dupont" + avatar. Effet backdrop-blur au scroll
- [x] 1.4 Implémenter le responsive mobile : sidebar masqué par défaut sous lg, bouton hamburger dans le header, overlay sidebar avec animation slide

## 2. Tableau de bord (client-dashboard)

- [x] 2.1 Refondre `apps/web/app/client/page.tsx` : titre "Tableau de Bord" avec sous-titre bienvenue, grille 3 stats cards (Projets Actifs: 12 +2%, Messages: 4 non lus, Dépenses Mensuelles: 2 450,00€ -5%) avec icônes colorées (vert, bleu, orange)
- [x] 2.2 Implémenter la table "Projets Actifs" avec barres de progression colorées (75% vert, 32% bleu, 90% orange), badges statut (En cours, Phase de test, Finalisation), dates d'échéance. Lien "Voir tout" vers /client/projets
- [x] 2.3 Implémenter le panneau droit "Dernières Commandes" (2 commandes: Pack Maintenance 890€ Payé, Audit SEO 450€ En attente) + widget "Utilisation Stockage" (78.4 GB / 100 GB avec barre de progression et icône nuage)

## 3. Projets — Liste et création (client-projects)

- [x] 3.1 Refondre `apps/web/app/client/projets/page.tsx` : liste des projets avec filtres par statut (Tous/Actif/Terminé/Brouillon), barre de recherche, bouton "Nouveau Projet". Cards de projets avec titre, client, progression, statut, date, budget
- [x] 3.2 Refondre `apps/web/app/client/projets/nouveau/page.tsx` : layout 3 colonnes (stepper gauche col-span-3, formulaire centre col-span-6, aperçu droit col-span-3). Wizard 4 étapes avec state management
- [x] 3.3 Implémenter l'étape 1 (Détails) : titre input, catégorie dropdown, deadline date picker, description textarea, type budget toggle (Prix Fixe/Taux Horaire), montant estimé, tags compétences (ajout/suppression)
- [x] 3.4 Implémenter les étapes 2-4 (Catégorie, Budget, Révision) : navigation entre étapes, barre progression (25% par étape), boutons "Sauvegarder en brouillon" + "Étape Suivante"
- [x] 3.5 Implémenter le panneau gauche stepper (4 étapes avec icônes, étape active surlignée en vert, barre progression, encart "Conseil d'expert" avec ampoule)
- [x] 3.6 Implémenter le panneau droit aperçu (portée estimée barre segmentée "Haute", résumé projet dynamique, encart "Promouvoir mon projet")

## 4. Commandes (client-orders)

- [x] 4.1 Refondre `apps/web/app/client/commandes/page.tsx` : vue liste filtrable par statut (Toutes/En cours/Livrées/Terminées/Litige) + vue détail d'une commande sélectionnée
- [x] 4.2 Implémenter la timeline 3 étapes horizontale : "Commande passée" (check vert), "En cours de réalisation" (active 80%, cercle animé), "Livraison effectuée" (grisé). Cercles verts avec ring-4
- [x] 4.3 Implémenter le countdown timer : 4 blocs (02 Jours, 14 Heures, 35 Min, 00 Sec) en cards séparées avec chiffres grands
- [x] 4.4 Implémenter la section livraison fichiers : zone drag & drop (bordure dashed verte), texte "Glissez-déposez vos fichiers ici", formats acceptés, bouton "Parcourir les fichiers", liste brouillons (nom, taille, bouton supprimer)
- [x] 4.5 Implémenter le panneau chat contextuel droit : avatar + nom + "En ligne" (dot vert animé), bulles messages (entrantes slate, sortantes vertes), indicateur typing "est en train d'écrire...", input avec boutons attach/emoji/send (scale animation)

## 5. Explorateur de freelances (client-explorer)

- [x] 5.1 Refondre `apps/web/app/client/explorer/page.tsx` : header "Explorateur d'Offres" + bouton "Actualiser", barre filtres horizontale (Budget, Catégorie, Pays, Type de contrat) + "Effacer les filtres"
- [x] 5.2 Implémenter les cards horizontales de projets : image gauche (w-64), contenu droit (titre, budget en vert EUR, description 2 lignes, tags pills, métadonnées durée/lieu/propositions), bouton "Postuler" vert. Badge "URGENT" sur les projets urgents
- [x] 5.3 Implémenter les 3 projets de démo en EUR : "Développement App Mobile E-commerce" (305€, 30j, Sénégal, 12 prop), "Design Logo & Charte Graphique" (76€, 7j, Côte d'Ivoire, 5 prop), "Rédaction Contenus SEO" (130€, 15j, France, 8 prop)
- [x] 5.4 Implémenter la pagination : boutons numérotés (1-12 + ellipsis), flèches prev/next, bouton actif en fond vert

## 6. Favoris (client-favorites)

- [x] 6.1 Refondre `apps/web/app/client/favoris/page.tsx` : header "Services et Freelances Favoris" + bouton "Créer une nouvelle liste", onglets de catégories (Tous/Projet Logo/Développement Web/Rédaction Content)
- [x] 6.2 Implémenter la grille "Freelances Favoris" (4 colonnes) : cards avec avatar circulaire 96px, badge vérifié, nom, spécialité uppercase verte, étoile jaune + note, bouton "Profil", coeur vert top-right
- [x] 6.3 Implémenter la grille "Services Sauvegardés" (3 colonnes) : cards avec image header h-40, gradient overlay, avatar freelance, titre, note, prix "À partir de X €"
- [x] 6.4 Implémenter la section "Vos Listes de Projets" (fond teinté vert) : cards existantes (Projet Logo 12 éléments, Développement Web 5, Montage Vidéo 3) + card dashed "+ Ajouter", bouton "Nouvelle liste"

## 7. Messagerie (client-messaging)

- [x] 7.1 Refondre `apps/web/app/client/messages/page.tsx` : layout 3 panneaux h-screen (contacts w-80, chat flex-1, détails mission w-80 hidden sous xl)
- [x] 7.2 Implémenter le panneau contacts : "Discussions" header + compose button, toggle "Direct Messages" / "Équipes & Canaux", liste contacts avec avatars, status indicators (vert/orange/gris), aperçu dernier message, timestamp. Contact actif en fond vert plein. Bouton "+ Nouveau Message" en bas
- [x] 7.3 Implémenter la fenêtre de chat : header (avatar, nom, "En ligne maintenant" + dot animé, boutons call/video/info), bulles (entrantes slate, sortantes vertes), séparateurs jour ("AUJOURD'HUI"), pièces jointes PDF (card rouge avec download), input (boutons +/image, textarea, emoji, send avec scale animation), hint "Shift + Enter"
- [x] 7.4 Implémenter le panneau détails mission : ID contrat, badge "PROJET ACTIF" vert, nom projet, statut, budget 1 500€, échéance, tracker jalons (60%, 4 jalons), fichiers partagés (thumbnails + "+"), boutons "Créer une facture" + "Signaler un litige" rouge

## 8. Paiements (client-payments)

- [x] 8.1 Créer `apps/web/app/client/paiements/page.tsx` : 3 cards en haut (Total dépensé, En attente, Crédits FreelanceHigh), toggle devise FCFA/EUR/USD, tabs Vue d'ensemble / Méthodes / Factures
- [x] 8.2 Implémenter la section méthodes de paiement : méthodes enregistrées (Orange Money, Visa), ajout nouvelle méthode (Mobile Money, Carte Bancaire, Virement) avec formulaire et badge sécurité SSL
- [x] 8.3 Implémenter les actions rapides (Ajouter une méthode, Exporter le rapport) + encart taux de change (EUR/FCFA/USD/GBP/MAD)
- [x] 8.4 Implémenter la table historique des transactions : colonnes Référence, Date, Freelance (avatar+nom), Service, Montant, Statut, Facture (download). Export CSV
- [x] 8.5 Supprimer ou rediriger l'ancienne page `/client/factures` vers `/client/paiements`

## 9. Profil et Paramètres (client-profile-settings)

- [x] 9.1 Refondre `apps/web/app/client/profil/page.tsx` : formulaire profil entreprise (avatar, nom, bio, entreprise, site web, secteur, taille équipe, contact). Barre de complétion du profil (75%)
- [x] 9.2 Refondre `apps/web/app/client/parametres/page.tsx` : layout 2 colonnes (sidebar tabs w-64 + contenu). 5 onglets : Profil Public (actif vert plein), Sécurité, Paiements & Facturation, Langues & Devises, Notifications. Lien "Voir mon profil public"
- [x] 9.3 Implémenter l'onglet Profil Public : avatar 96px avec overlay caméra, nom + sous-titre, formulaire (Nom Complet, Email, Bio textarea), bouton "Enregistrer"
- [x] 9.4 Implémenter l'onglet Sécurité : formulaire mot de passe (actuel + nouveau + bouton "Mettre à jour"), 2FA toggle, sessions actives avec révocation
- [x] 9.5 Implémenter l'onglet Langues & Devises : toggle Français/English avec check_circle, dropdown devise (FCFA, EUR, USD, GBP, MAD), note conversion
- [x] 9.6 Implémenter la zone danger : section rouge "Désactiver le compte" avec avertissement et bouton "Désactiver" rouge

## 10. Finalisation et vérification

- [x] 10.1 Vérifier la navigation complète entre toutes les pages (sidebar avec tous les items, liens "Voir tout", boutons CTA, breadcrumbs)
- [ ] 10.2 Vérifier le responsive sur mobile (375px), tablette (768px) et desktop (1280px) pour chaque page
- [x] 10.3 Vérifier que tous les montants sont en EUR (€) par défaut et que le texte est en français
- [ ] 10.4 Vérifier la conformité visuelle de chaque page avec sa maquette de référence
- [x] 10.5 Corriger les éventuels problèmes de build TypeScript et les erreurs de lint (build réussi, 0 erreur dans les pages client)
