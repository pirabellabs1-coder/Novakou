# Tâches : Correction des régressions

## Corrections déjà appliquées ✅

- [x] Corriger NEXTAUTH_URL dans .env.local (3450 → 3000)
- [x] Unifier le port dev dans package.json (3000)
- [x] Ajouter FontLoader.tsx pour Material Symbols
- [x] Ajouter overflow:hidden sur .material-symbols-outlined dans globals.css
- [x] Désactiver le tracking en dev (TrackingProvider.tsx)
- [x] Ralentir le polling notifications en dev (30s → 5min) dans les 4 layouts
- [x] Désactiver Sentry sans DSN (instrumentation.ts + next.config.ts)
- [x] Activer dark mode global (<html className="dark">)
- [x] Corriger ~120 accents français dans ~50 fichiers
- [x] Ajouter dark: variants sur ~55 bg-white dans formations + public
- [x] Corriger les erreurs TypeScript (PixelTracker, blog API)

## Vérifications à faire

- [ ] Tester la connexion avec admin@test.com / Test1234!
- [ ] Tester la déconnexion (bouton dans la sidebar)
- [ ] Tester le switch de langue FR ↔ EN
- [ ] Tester le sélecteur de devises EUR ↔ FCFA
- [ ] Vérifier que les icônes Material s'affichent (pas de texte brut)
- [ ] Vérifier les fonds sombres sur toutes les pages
- [ ] Tester la navigation entre pages (landing → explorer → connexion)

## Préparation déploiement

- [ ] Corriger les erreurs de build production (blog API TypeScript)
- [ ] Lancer `next build` avec succès
- [ ] Tester avec `next start` pour valider les performances
- [ ] Configurer les variables d'environnement de production
- [ ] Connecter les liens de paiement Stripe/CinetPay
