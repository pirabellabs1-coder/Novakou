## ADDED Requirements

### Requirement: Bannière de statistiques immersive sur fond primary
La page d'accueil SHALL inclure une section pleine largeur sur fond `#006e2f` affichant 4 métriques clés de la plateforme, positionnée entre le Dashboard Preview et la section "Comment ça marche".

#### Scenario: Affichage des 4 métriques sur desktop
- **WHEN** un utilisateur consulte la page d'accueil sur un écran >= 768px
- **THEN** il voit 4 métriques alignées horizontalement : nombre de créateurs (ex: "1 000+"), pays couverts (ex: "6"), ventes réalisées (ex: "15 000+"), commission unique (ex: "10%")

#### Scenario: Affichage des métriques sur mobile
- **WHEN** un utilisateur consulte la page d'accueil sur un écran < 768px
- **THEN** les 4 métriques s'affichent en grille 2×2

### Requirement: Style des chiffres dans la bannière stats
Les valeurs numériques MUST être affichées en typographie Satoshi bold, couleur blanche, taille >= 48px. Les labels descriptifs MUST être en `#a7f3d0` (vert clair), taille 14px, uppercase avec tracking élargi.

#### Scenario: Lisibilité des chiffres
- **WHEN** un utilisateur regarde la bannière stats
- **THEN** les chiffres sont nettement plus grands et plus gras que les labels, créant une hiérarchie visuelle claire
