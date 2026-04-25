# Proposition : Correction des régressions plateforme

## Résumé
Corriger les régressions introduites lors des modifications récentes (dark mode, Turbopack, changement de port) qui ont cassé la navigation, l'authentification et la fluidité générale du site.

## Problème
Après plusieurs sessions de corrections (dark mode, accents, performance), la plateforme présente des régressions :
1. **NEXTAUTH_URL désynchronisé** — Le serveur tourne sur le port 3000 mais NEXTAUTH_URL pointait vers 3450, cassant l'auth (connexion, déconnexion, CSRF)
2. **Lenteur de navigation** — Turbopack en mode dev compile chaque page à la demande (30-90s), donnant l'impression que les liens ne fonctionnent pas
3. **Fonts Material Symbols** — Le @import CSS est ignoré par Turbopack, les icônes s'affichent comme du texte
4. **Tracking surcharge le serveur** — Les requêtes tracking toutes les 5-30s bloquent le serveur dev

## Corrections déjà appliquées
- NEXTAUTH_URL corrigé → `http://localhost:3000`
- Port dev unifié → 3000
- FontLoader client-side ajouté pour Material Symbols
- Tracking désactivé en dev
- Polling notifications ralenti en dev (30s → 5min)
- Sentry désactivé sans DSN
- Dark mode global via `<html className="dark">`
- ~120 accents français corrigés dans ~50 fichiers
- ~55 `bg-white` sans `dark:` variant corrigés dans formations + public

## Ce qui reste
- Valider que l'auth fonctionne après le fix NEXTAUTH_URL
- Vérifier la traduction FR/EN (le code est correct, la config aussi)
- Vérifier le sélecteur de devises
- Tester la déconnexion
- Préparer le build de production pour des performances optimales
