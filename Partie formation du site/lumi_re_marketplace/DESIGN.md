# Système de Design : L'Écran Éditorial

## 1. Vision Créative & Étoile Polaire : "Le Curateur Digital"
Ce système de design ne se contente pas d'organiser l'information ; il la met en scène. Notre étoile polaire, **Le Curateur Digital**, transforme une place de marché SaaS complexe en une expérience éditoriale fluide, respirante et haut de gamme. 

Pour rompre avec l'aspect "générique" des SaaS actuels, nous privilégions une **asymétrie intentionnelle** au sein de nos grilles Bento. Au lieu d'une grille rigide, nous utilisons des superpositions d'éléments et des échelles typographiques contrastées pour guider l'œil. L'espace vide (le "white space") n'est pas une absence de contenu, mais un outil de hiérarchisation premium.

---

## 2. Palette Chromatique & Profondeur Tonale
L'identité visuelle repose sur une base de pureté (`#FFFFFF`) et de sophistication technologique (`#22C55E`). 

### La Règle du "Sans-Ligne" (No-Line Rule)
**Interdiction formelle d'utiliser des bordures solides de 1px pour délimiter les sections.** La structure doit émerger naturellement par :
- **Changements de fonds :** Une section en `surface-container-low` posée sur un arrière-plan `surface`.
- **Transitions de tons :** Utiliser les nuances pour créer des zones de focus sans "enfermer" le contenu.

### Hiérarchie des Surfaces & Emboîtement
Considérez l'interface comme une série de feuilles de papier fin ou de verre dépoli empilées.
- **Base :** `surface` (#F7F9FB) pour le fond de page.
- **Conteneurs :** Utilisez `surface-container-lowest` (#FFFFFF) pour les cartes principales afin de créer un "soulèvement" naturel.
- **Nesting :** Un élément interactif à l'intérieur d'une carte doit utiliser `surface-container-high` pour signaler sa profondeur relative.

### Signature Visuelle : Verre & Gradients
- **Glassmorphism :** Les éléments flottants (modales, menus contextuels) doivent utiliser des couleurs de surface semi-transparentes avec un `backdrop-blur` (20px-40px).
- **Gradients Signature :** Pour les CTA majeurs, ne restez pas sur un aplat. Utilisez un dégradé subtil allant de `primary` (#006E2F) vers `primary-container` (#22C55E) pour apporter une "âme" vibrante et un fini professionnel.

---

## 3. Typographie : L'Autorité par le Texte
Nous utilisons **Plus Jakarta Sans**, une police moderne qui allie géométrie et lisibilité.

*   **Display (lg/md) :** Utilisé pour les accroches marketing. Doit être audacieux (Bold/ExtraBold) avec un interlettrage légèrement serré (-0.02em) pour un look "Stripe-esque".
*   **Headline (lg/md/sm) :** Définit la structure éditoriale. Toujours en `on-surface` (#191C1E).
*   **Body (lg/md) :** La clarté avant tout. Utilisez `on-secondary-container` (#5C647A) pour le corps de texte afin de réduire la fatigue visuelle par rapport au noir pur.
*   **Label (md/sm) :** Pour les métadonnées et micro-copies, souvent en majuscules avec un espacement de lettres augmenté (+0.05em).

---

## 4. Élévation & Profondeur : Le Layering Tonal
L'ombre ne doit jamais être une solution de facilité, mais un murmure.

*   **Principe de Stacking :** Priorisez le contraste de couleur sur l'ombre. Une carte `surface-container-lowest` sur un fond `surface-container-low` crée une séparation élégante et organique.
*   **Ombres Ambiantes :** Si une ombre est nécessaire (ex: éléments flottants), elle doit être extra-diffuse : `box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06)`. Notez l'utilisation d'un bleu-ardoise très dilué plutôt que du noir.
*   **Le "Ghost Border" :** Si l'accessibilité exige une bordure, utilisez le token `outline-variant` à 15% d'opacité maximum.
*   **Squircle :** Toutes les cartes et boutons utilisent la courbure "Squircle" (via un `border-radius` généreux de `xl` ou `lg`) pour un aspect plus doux et organique que le arrondi standard.

---

## 5. Composants Primitifs & Expérience Marketplace

### Boutons
- **Primary :** Dégradé `primary` vers `primary-container`, texte `on-primary`. Rayon de courbure `full` ou `lg`.
- **Tertiary :** Pas de fond, pas de bordure. Utilise `primary` pour le texte. Se fond dans la page jusqu'au survol.

### Le Bento Grid (Conteneurs)
- Rayons de courbure fixés à `24px` (`lg`).
- **Interdiction des séparateurs (diviseurs) :** Utilisez l'espace blanc vertical de notre échelle de spacing pour séparer les listes.

### Champs de Saisie (Inputs)
- Fond `surface-container-low`, pas de bordure visible au repos. 
- Au focus : Une bordure "Ghost" `primary` et un léger halo (glow) de la couleur `primary-fixed-dim`.

### Composants Spécifiques Marketplace
- **Badge de Talent :** Utilise un effet Glassmorphism avec un texte en `on-primary-container`.
- **Cartes de Service :** Pas de bordure. Transition d'élévation au survol (passage de `surface-container-lowest` à une ombre ambiante légère).

---

## 6. Do's & Don'ts

### À Faire (Do)
- **Utiliser le Français de manière élégante :** Privilégiez des termes comme "Découvrir" plutôt que "Voir plus", "Soumettre" au lieu de "Envoyer".
- **Aérer au maximum :** Si vous hésitez sur l'espacement, doublez-le.
- **Alignement Optique :** Les icônes doivent être centrées optiquement, surtout dans les boutons Squircle.

### À Ne Pas Faire (Don't)
- **Éviter le "Boxy Look" :** Ne remplissez pas chaque espace. L'asymétrie est votre alliée pour le côté haut de gamme.
- **Pas de Gris Neutre :** N'utilisez jamais de `#888888`. Utilisez nos tons Slate (`on-surface-variant`) pour garder une chaleur chromatique.
- **Pas de lignes de division :** Si vous ressentez le besoin de mettre une ligne, essayez d'augmenter le `gap` ou de changer légèrement la couleur de fond de l'élément suivant.