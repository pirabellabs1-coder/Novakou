## ADDED Requirements

### Requirement: Section Paiements sur fond primary dark
La section paiements SHALL utiliser le fond `#006e2f` au lieu de `bg-amber-50`. Le titre SHALL être "Encaissez partout en Afrique" au lieu de "Vendez localement sans friction". Le sous-titre et tous les textes MUST être en blanc ou `#a7f3d0`.

#### Scenario: Apparence de la section paiements
- **WHEN** un utilisateur défile jusqu'à la section paiements
- **THEN** il voit un fond vert foncé `#006e2f` avec des textes blancs, et non un fond jaune/amber

### Requirement: Cards checkout et retrait sur fond sombre
Les 2 mockups (checkout et retrait) MUST avoir un fond blanc pour le contraste avec le fond `#006e2f`. Les cards MUST conserver un border-radius de 2xl et un shadow visible.

#### Scenario: Lisibilité des cards sur fond sombre
- **WHEN** un utilisateur regarde les mockups checkout et retrait
- **THEN** les cards sont clairement visibles avec fond blanc sur le fond vert, avec une ombre douce

### Requirement: Suppression du style amber/jaune
Tout élément utilisant `bg-amber-50`, `border-amber-100`, ou `#fef3c7` dans la section paiements SHALL être remplacé par des couleurs cohérentes avec la palette verte Novakou.

#### Scenario: Absence de jaune dans la section paiements
- **WHEN** un développeur inspecte le code de la section paiements
- **THEN** aucune classe ou style inline ne contient de référence à amber, yellow, ou `#fef3c7`
