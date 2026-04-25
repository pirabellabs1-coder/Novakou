## 1. Structure de routes et layout racine

- [x] 1.1 Créer le dossier `app/formations/` avec `layout.tsx` racine qui définit le shell formations (html, body, providers, i18n) — aucune navbar FreelanceHigh
- [x] 1.2 Créer le composant `FormationsHeader.tsx` — header public avec : logo "FreelanceHigh Formations" (icône GraduationCap), menus (Accueil, Explorer, Catégories, Devenir Instructeur), sélecteur langue FR/EN, sélecteur devise, boutons Connexion/Inscription
- [x] 1.3 Créer le composant `FormationsFooter.tsx` — footer dédié avec liens formations (Aide, FAQ, Devenir Instructeur, CGU, Contact) et charte graphique FreelanceHigh
- [x] 1.4 Ajouter le lien "← Retour à FreelanceHigh" dans le header formations (lien discret vers `/`)
- [x] 1.5 Rendre le header formations responsive : menu hamburger mobile avec les menus formations uniquement

## 2. Pages d'authentification formations

- [x] 2.1 Créer `/connexion/page.tsx` — formulaire de connexion (email + mot de passe, OAuth Google/LinkedIn) dans le layout formations, avec redirection post-auth vers l'espace approprié (apprenant ou instructeur)
- [x] 2.2 Créer `/inscription/page.tsx` — formulaire d'inscription avec choix du rôle (Apprenant / Instructeur), vérification email OTP, redirection vers l'espace approprié
- [x] 2.3 Gérer le cas utilisateur FreelanceHigh existant : détecter la session Supabase active et proposer de choisir un rôle formations sans recréer de compte
- [x] 2.4 Mettre à jour le middleware Next.js pour gérer les routes formations : `/connexion` et `/inscription` comme routes publiques, redirection des routes protégées vers `/connexion`

## 3. Layout et sidebar apprenant

- [x] 3.1 Créer le route group `app/formations/(apprenant)/layout.tsx` avec sidebar latérale gauche contenant : avatar/nom, liens (Mes Formations, Certificats, Favoris, Panier, Paramètres)
- [x] 3.2 Implémenter l'indicateur de page active dans la sidebar apprenant (fond coloré / bordure latérale sur le lien courant)
- [x] 3.3 Rendre la sidebar apprenant responsive : menu hamburger ou drawer sur mobile (< 1024px)
- [x] 3.4 Ajouter un breadcrumb dans les pages apprenant (ex: "Formations > Mes Formations > [Nom]")

## 4. Layout et sidebar instructeur

- [x] 4.1 Créer le route group `app/formations/(instructeur)/layout.tsx` avec sidebar latérale gauche contenant : avatar/nom, liens (Dashboard, Mes Formations, Créer, Apprenants, Revenus, Avis, Statistiques, Paramètres)
- [x] 4.2 Implémenter l'indicateur de page active dans la sidebar instructeur
- [x] 4.3 Rendre la sidebar instructeur responsive : menu hamburger ou drawer sur mobile (< 1024px)
- [x] 4.4 Ajouter un breadcrumb dans les pages instructeur (ex: "Formations > Instructeur > Revenus")

## 5. Migration des pages publiques formations

- [x] 5.1 Déplacer `(public)/formations/page.tsx` → `formations/page.tsx` (landing formations)
- [x] 5.2 Déplacer `(public)/formations/explorer/` → `formations/explorer/`
- [x] 5.3 Déplacer `(public)/formations/[slug]/` → `formations/[slug]/`
- [x] 5.4 Déplacer `(public)/formations/categories/` → `formations/categories/`
- [x] 5.5 Déplacer `(public)/formations/instructeurs/` → `formations/instructeurs/`
- [x] 5.6 Déplacer `(public)/formations/devenir-instructeur/` → `formations/devenir-instructeur/`
- [x] 5.7 Déplacer `(public)/formations/verification/` → `formations/verification/`

## 6. Migration des pages apprenant

- [x] 6.1 Déplacer `(apprenant)/formations/mes-formations/` → `formations/(apprenant)/mes-formations/`
- [x] 6.2 Déplacer `(apprenant)/formations/apprendre/` → `formations/(apprenant)/apprendre/`
- [x] 6.3 Déplacer `(apprenant)/formations/certificats/` → `formations/(apprenant)/certificats/`
- [x] 6.4 Déplacer `(apprenant)/formations/favoris/` → `formations/(apprenant)/favoris/`
- [x] 6.5 Déplacer `(apprenant)/formations/panier/` → `formations/(apprenant)/panier/`
- [x] 6.6 Déplacer `(apprenant)/formations/parametres/` → `formations/(apprenant)/parametres/`

## 7. Migration des pages instructeur

- [x] 7.1 Déplacer `(instructeur)/formations/instructeur/dashboard/` → `formations/(instructeur)/dashboard/`
- [x] 7.2 Déplacer `(instructeur)/formations/instructeur/mes-formations/` → `formations/(instructeur)/mes-formations/`
- [x] 7.3 Déplacer `(instructeur)/formations/instructeur/creer/` → `formations/(instructeur)/creer/`
- [x] 7.4 Déplacer `(instructeur)/formations/instructeur/[id]/` → `formations/(instructeur)/[id]/`
- [x] 7.5 Déplacer `(instructeur)/formations/instructeur/apprenants/` → `formations/(instructeur)/apprenants/`
- [x] 7.6 Déplacer `(instructeur)/formations/instructeur/revenus/` → `formations/(instructeur)/revenus/`
- [x] 7.7 Déplacer `(instructeur)/formations/instructeur/avis/` → `formations/(instructeur)/avis/`
- [x] 7.8 Déplacer `(instructeur)/formations/instructeur/statistiques/` → `formations/(instructeur)/statistiques/`
- [x] 7.9 Déplacer `(instructeur)/formations/instructeur/parametres/` → `formations/(instructeur)/parametres/`

## 8. Migration des pages paiement

- [x] 8.1 Déplacer `(paiement)/formations/paiement/` → `formations/(paiement)/paiement/`
- [x] 8.2 Déplacer `(paiement)/formations/succes/` → `formations/(paiement)/succes/`
- [x] 8.3 Déplacer `(paiement)/formations/echec/` → `formations/(paiement)/echec/`
- [x] 8.4 Créer `formations/(paiement)/layout.tsx` — layout minimal sans sidebar (header formations + contenu centré)

## 9. Header formations contextuel

- [x] 9.1 Implémenter la variante header connecté apprenant : menus publics + raccourcis (Mes Formations, Panier) + avatar dropdown (Profil, Certificats, Paramètres, Déconnexion)
- [x] 9.2 Implémenter la variante header connecté instructeur : menus publics + raccourci Dashboard Instructeur + avatar dropdown (Dashboard, Mes Formations, Revenus, Paramètres, Déconnexion)
- [x] 9.3 Indicateur visuel du lien actif dans le header (page courante mise en évidence)

## 10. Nettoyage et vérification

- [x] 10.1 Supprimer les anciens dossiers/route groups formations vides (`(public)/formations/`, `(apprenant)/formations/`, `(instructeur)/formations/`, `(paiement)/formations/`) après migration
- [x] 10.2 Vérifier que le lien "Formations" dans la navbar FreelanceHigh pointe bien vers `/`
- [x] 10.3 Mettre à jour les imports et chemins relatifs dans les pages migrées si nécessaire
- [x] 10.4 Vérifier que toutes les API routes (`/api/formations/*`, `/api/instructeur/*`, `/api/apprenant/*`) fonctionnent toujours (pas de changement côté API)
- [x] 10.5 Tester la navigation complète : FreelanceHigh → Formations → pages publiques → connexion → espace apprenant/instructeur → retour FreelanceHigh
- [x] 10.6 Vérifier le responsive sur mobile (375px), tablette (768px) et desktop (1280px)
- [x] 10.7 Mettre à jour les traductions i18n si de nouvelles clés sont nécessaires pour le header/sidebar/breadcrumb formations
