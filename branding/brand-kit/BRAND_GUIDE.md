# Novakou — Brand Guide

## 🎨 Palette

| Token | Hex | Usage |
|---|---|---|
| **Emerald deep** | `#006e2f` | Boutons, accents, gradient début |
| **Emerald bright** | `#22c55e` | Highlights, success, gradient fin |
| **Gradient principal** | `#006e2f → #22c55e` | Boutons CTA, logo, hero |
| **White** | `#ffffff` | Fond principal |
| **Pale mint** | `#f0fdf4` | Fond alternatif doux |
| **Slate dark** | `#191c1e` | Texte principal |
| **Slate medium** | `#5c647a` | Sous-titres |
| **Slate light** | `#9ca3af` | Métadonnées discrètes |

## ✍️ Typographie

| Usage | Police | Poids |
|---|---|---|
| Headlines hero | **Manrope** ExtraBold (800) | -2 letter-spacing |
| Body | **Manrope** Medium (500) | -0.5 letter-spacing |
| Citations / serifs | **Playfair Display** Bold (700) | Italique disponible |
| Code / chiffres | **JetBrains Mono** Bold | Pour timers, codes |

→ Liens Google Fonts : [Manrope](https://fonts.google.com/specimen/Manrope) · [Playfair](https://fonts.google.com/specimen/Playfair+Display) · [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

## 🔘 Composants

### Bouton principal (CTA)
- Background : `linear-gradient(135deg, #006e2f, #22c55e)`
- Text : `#ffffff` Manrope 700, 32-34px
- Padding : 28px vertical, 56px horizontal
- Radius : 20-22px
- Format texte : `Action → ` (toujours flèche unicode →)

### Bouton secondaire
- Background : `#ffffff`
- Border : 2px `#e5e7eb`
- Text : `#191c1e` Manrope 600

### Tag / badge
- Background : `#f0fdf4`
- Border : 2px `#22c55e`
- Text : `#006e2f` Manrope 700, uppercase, letter-spacing 0.5
- Radius : pill (50%)

## 🖼️ Logo

3 variantes dans `brand-kit/` :
- `logo-mark.svg` — juste le carré NK (favicon, app icon)
- `logo-full.svg` — NK + wordmark "Novakou" en slate dark
- `logo-white.svg` — version blanche pour fonds sombres ou colorés

**Espace de respiration** : minimum 0.5× la hauteur du logo en marge.
**Taille minimale** : 32px pour le mark seul, 120px pour le logo complet.

## ⚠️ À éviter

- ❌ Vert très saturé style "néon" (#00ff00) — on reste sur emerald `#006e2f`
- ❌ Or champagne / luxe / forêt sombre dominant — Novakou est moderne SaaS, pas Tiffany
- ❌ Drop-shadows lourds — préférer `0 4px 12px rgba(0,0,0,0.06)` subtil
- ❌ Border-radius < 12px sur des boutons — on reste sur du arrondi généreux (20-24px)
- ❌ Sans-serif fins comme Roboto Light — Manrope 500+ uniquement
- ❌ Texte anglais dans les visuels FR

## 📦 Fichiers fournis

```
branding/
├── brand-kit/
│   ├── colors.json          ← codes couleur structurés (importable Canva Brand Hub)
│   ├── colors.css           ← CSS variables pour Webflow / Figma / dev
│   ├── BRAND_GUIDE.md       ← ce fichier
│   ├── logo-mark.svg
│   ├── logo-full.svg
│   └── logo-white.svg
└── posters/
    ├── 01-hero-vendez-1080x1080.svg          ← Instagram post / lancement
    ├── 02-stories-countdown-1080x1920.svg    ← Stories J-3
    ├── 03-vendeur-encaissez-1080x1350.svg    ← Recrutement vendeur
    ├── 04-temoignage-1080x1080.svg           ← Témoignage 1.8M FCFA
    ├── 05-affilie-30pct-1080x1350.svg        ← Programme affilié
    ├── 06-mentor-recruit-1080x1350.svg       ← Mentor (fond sombre)
    ├── 07-vente-flash-1080x1080.svg          ← Promo flash -50%
    └── 08-communaute-whatsapp-1080x1920.svg  ← Stories communauté WA
```

## 🚀 Comment utiliser ces SVG

### Méthode 1 — Convertir en PNG via navigateur (rapide)
1. Ouvre le fichier SVG dans Chrome / Edge / Firefox
2. Clic droit → "Enregistrer l'image sous…" → choisir `.png`
3. Le PNG est prêt à poster sur Instagram / Facebook / LinkedIn

### Méthode 2 — Importer dans Canva Pro (recommandé pour customiser)
1. Canva Pro → "Importer un design" → glisse le SVG
2. Le SVG arrive avec tous les éléments éditables (texte, couleurs, formes)
3. Tu peux remplacer le texte, ajouter une photo, changer le CTA
4. Export en PNG ou JPG depuis Canva

### Méthode 3 — Convertir en lot via outil en ligne
- https://cloudconvert.com/svg-to-png (gratuit, pas d'inscription)
- Glisse les 8 SVG, choisis 1080×1080 (ou autre dimension), télécharge

### Méthode 4 — Brand Hub Canva Pro (pour réutiliser les couleurs)
1. Canva Pro → Brand Hub → Brand Kit
2. Couleurs → ajoute manuellement les 3 hex principaux : `#006e2f`, `#22c55e`, `#191c1e`
3. Polices → ajoute Manrope, Playfair Display, JetBrains Mono (gratuites Google Fonts)
4. Logo → upload `logo-full.svg`
5. Maintenant tous tes nouveaux designs ont les couleurs et polices Novakou en 1 clic

## 📐 Dimensions standards des réseaux sociaux

| Réseau | Format | Dimensions |
|---|---|---|
| Instagram post | 1:1 | 1080×1080 |
| Instagram portrait | 4:5 | 1080×1350 |
| Instagram Stories / Reels | 9:16 | 1080×1920 |
| Facebook post | 1.91:1 | 1200×630 |
| LinkedIn post | 1.91:1 | 1200×627 |
| LinkedIn cover | 4:1 | 1584×396 |
| Twitter post | 16:9 | 1600×900 |
| YouTube thumbnail | 16:9 | 1280×720 |
| WhatsApp Status | 9:16 | 1080×1920 |
