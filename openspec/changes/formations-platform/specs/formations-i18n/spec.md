## ADDED Requirements

### Requirement: All formations interface text is available in French and English
Toutes les chaînes de texte d'interface de la section `/` (labels, boutons, titres de pages, messages d'erreur, notifications) DOIVENT être disponibles en français et en anglais via le système next-intl existant. Quatre nouveaux namespaces de traduction DOIVENT être créés : `formations`, `apprenant`, `instructeur`, `formations-admin`. Les fichiers de traduction DOIVENT se trouver dans `apps/web/messages/fr/` et `apps/web/messages/en/`.

#### Scenario: Affichage de la landing page en français par défaut
- **WHEN** un visiteur accède à `/` sans avoir sélectionné de langue
- **THEN** toute l'interface est affichée en français (texte du hero, catégories, boutons, labels)

#### Scenario: Bascule vers l'anglais depuis la navbar
- **WHEN** un utilisateur clique sur le sélecteur de langue dans la navbar et sélectionne "EN"
- **THEN** toute l'interface de la section formations passe en anglais sans rechargement complet de la page, et la préférence est sauvegardée dans localStorage

#### Scenario: Messages d'erreur de formulaire traduits
- **WHEN** un instructeur soumet le formulaire de candidature avec un champ requis manquant en anglais
- **THEN** le message d'erreur Zod/React Hook Form est affiché en anglais ("This field is required") et non en français

#### Scenario: Namespace de traduction chargé uniquement sur les pages formations
- **WHEN** un utilisateur accède à une page hors-formations (ex: `/dashboard`)
- **THEN** les namespaces `formations`, `apprenant`, `instructeur` ne sont PAS inclus dans le bundle JavaScript de cette page (lazy loading)

### Requirement: Bilingual course content is stored and served per user language preference
Le contenu des cours (titres, descriptions, bio instructeur) DOIT être stocké bilingue en base de données (`titleFr`/`titleEn`, `descriptionFr`/`descriptionEn`). La langue active DOIT déterminer quel champ est affiché. Le sélecteur de langue de la section formations DOIT être indépendant du sélecteur de devise mais doit s'intégrer visuellement dans la navbar existante.

#### Scenario: Titre de formation affiché dans la langue active
- **WHEN** un utilisateur avec la langue EN active accède à la page détail d'une formation
- **THEN** `Formation.titleEn` est affiché comme titre principal, et `Formation.descriptionEn` comme description

#### Scenario: Fallback vers le français si contenu anglais manquant
- **WHEN** un utilisateur avec la langue EN active consulte une formation dont `titleEn` est null ou vide
- **THEN** `Formation.titleFr` est affiché comme fallback à la place de `titleEn`

#### Scenario: Contenu bilingue dans le lecteur de cours
- **WHEN** un apprenant avec la langue EN active est dans le lecteur de cours
- **THEN** les titres de sections (`Section.titleEn`) et les titres de leçons (`Lesson.titleEn`) sont affichés en anglais dans la sidebar curriculum

### Requirement: Language preference is persisted across sessions
La préférence de langue pour la section formations DOIT être sauvegardée dans localStorage et dans le profil utilisateur en DB (si connecté). La langue DOIT être détectée automatiquement depuis les en-têtes HTTP `Accept-Language` du navigateur lors de la première visite.

#### Scenario: Détection automatique de la langue navigateur
- **WHEN** un nouvel utilisateur accède à `/` pour la première fois depuis un navigateur configuré en anglais (`Accept-Language: en-US`)
- **THEN** l'interface est affichée en anglais automatiquement

#### Scenario: Persistance de la langue entre les visites
- **WHEN** un utilisateur non connecté bascule vers l'anglais et revient sur `/` le lendemain
- **THEN** la langue anglaise est toujours active grâce à la valeur sauvegardée dans localStorage

#### Scenario: Synchronisation de la préférence de langue avec le profil DB
- **WHEN** un utilisateur connecté change sa langue dans la section formations
- **THEN** sa préférence est sauvegardée dans le champ `User.preferredFormationLocale` (ou `User.locale` si déjà existant) via un appel tRPC

### Requirement: Formation-related transactional emails are bilingual
Tous les emails transactionnels liés à la section formations DOIVENT être envoyés dans la langue préférée de l'utilisateur (ou bilingue FR/EN sur le même email pour les certificats). Les templates React Email DOIVENT accepter une prop `locale: 'fr' | 'en'` et utiliser le contenu correspondant.

#### Scenario: Email de confirmation d'achat dans la langue de l'apprenant
- **WHEN** un apprenant avec `preferredFormationLocale = 'en'` achète une formation
- **THEN** l'email de confirmation est envoyé en anglais ("Your enrollment is confirmed")

#### Scenario: Email du certificat bilingue sur le même document
- **WHEN** un email de certificat est envoyé
- **THEN** le corps de l'email contient les informations principales en français ET en anglais sur le même email (pas deux emails séparés), conformément aux maquettes

#### Scenario: Email de notification instructeur dans sa langue préférée
- **WHEN** un instructeur avec `preferredFormationLocale = 'fr'` reçoit une notification de nouveau inscrit
- **THEN** l'email est envoyé en français ("Un nouvel apprenant vient de s'inscrire à votre formation")
