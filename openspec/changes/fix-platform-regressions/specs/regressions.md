# Spécification : Corrections des régressions

## REQ-001: L'authentification DOIT fonctionner sur le port actif
- NEXTAUTH_URL doit correspondre au port du serveur
- La connexion avec les comptes test doit fonctionner (admin@test.com / Test1234!)
- La déconnexion doit rediriger vers /connexion
- Les tokens CSRF doivent être valides

## REQ-002: Les icônes Material Symbols DOIVENT s'afficher correctement
- La police Material Symbols Outlined doit être chargée
- Les noms d'icônes (star, schedule, expand_more, etc.) ne doivent JAMAIS être visibles comme texte
- Le FontLoader doit injecter les liens de police côté client

## REQ-003: Le mode dark DOIT être actif sur toutes les pages
- `<html>` doit avoir la classe `dark`
- Aucun fond blanc ne doit apparaître sur les cartes, sidebars, ou conteneurs
- Tous les `bg-white` doivent avoir une variante `dark:bg-neutral-dark` ou `dark:bg-slate-800`

## REQ-004: La traduction FR/EN DOIT fonctionner
- Le sélecteur de langue doit basculer entre français et anglais
- Les fichiers messages/fr.json et messages/en.json doivent être chargés
- Le cookie `locale` doit persister la préférence

## REQ-005: Le sélecteur de devises DOIT fonctionner
- Les 5 devises (EUR, FCFA, USD, GBP, MAD) doivent être sélectionnables
- La conversion doit s'appliquer aux montants affichés
- La préférence doit persister via Zustand + localStorage
