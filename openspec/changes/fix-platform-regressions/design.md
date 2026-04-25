# Design : Correction des régressions

## Approche technique

### 1. Auth — NEXTAUTH_URL
- **Fichier** : `.env.local`
- **Correction** : `NEXTAUTH_URL="http://localhost:3000"` (aligné avec le port du serveur)
- **Impact** : Corrige connexion, déconnexion, CSRF, redirections post-login

### 2. Performance — Mode dev
- **Fichier** : `package.json` → `"dev": "next dev --turbopack -p 3000"`
- **Fichier** : `components/tracking/TrackingProvider.tsx` → Tracking désactivé en dev
- **Fichier** : Layouts (dashboard, client, agence, admin) → Polling 5min en dev au lieu de 30s
- **Alternative production** : `next build && next start` pour des pages instantanées

### 3. Fonts — Material Symbols
- **Fichier** : `components/FontLoader.tsx` → Injection dynamique des `<link>` côté client
- **Fichier** : `globals.css` → `overflow: hidden` + `max-width: 1em` sur `.material-symbols-outlined`

### 4. Dark mode — Global
- **Fichier** : `app/layout.tsx` → `<html className="dark">` + `<body className="bg-background-dark text-slate-100">`
- **Tous les composants** avec `bg-white dark:bg-X` activent maintenant la variante `dark:`

## Risques
- Les pages qui n'avaient PAS de variante `dark:` pourraient avoir des éléments invisibles (texte sombre sur fond sombre)
- Le mode dev reste lent sur WSL2 avec 3.6 GB RAM — c'est une limitation matérielle
