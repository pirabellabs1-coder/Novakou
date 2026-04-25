## ADDED Requirements

### Requirement: L'instructeur DOIT pouvoir creer un produit numerique via API
Le systeme SHALL exposer un endpoint `POST /api/instructeur/produits` qui cree un produit numerique associe a l'instructeur authentifie. Le body MUST contenir : titleFr, titleEn, descriptionFr, descriptionEn, price, type (ebook/template/resource/other), fileUrl. Le systeme MUST valider que l'instructeur est authentifie via session et retourner le produit cree avec son ID.

#### Scenario: Creation reussie d'un produit
- **WHEN** un instructeur authentifie envoie un POST avec toutes les donnees requises
- **THEN** le systeme cree le produit en base, l'associe a l'instructeur, et retourne un JSON `{ product: { id, titleFr, ... } }` avec statut 201

#### Scenario: Creation sans authentification
- **WHEN** un utilisateur non authentifie envoie un POST
- **THEN** le systeme retourne un 401 avec `{ error: "Non autorise" }`

#### Scenario: Donnees manquantes
- **WHEN** un instructeur envoie un POST sans le champ `titleFr`
- **THEN** le systeme retourne un 400 avec `{ error: "Titre francais requis" }`

### Requirement: L'instructeur DOIT pouvoir modifier un produit via API
Le systeme SHALL exposer un endpoint `PUT /api/instructeur/produits` qui modifie un produit existant appartenant a l'instructeur. Le body MUST contenir l'`id` du produit et les champs a mettre a jour.

#### Scenario: Modification reussie
- **WHEN** un instructeur modifie le prix d'un de ses produits
- **THEN** le systeme met a jour le produit et retourne le produit modifie avec statut 200

#### Scenario: Modification d'un produit d'un autre instructeur
- **WHEN** un instructeur tente de modifier un produit qui ne lui appartient pas
- **THEN** le systeme retourne un 403 avec `{ error: "Acces interdit" }`

### Requirement: L'instructeur DOIT pouvoir supprimer un produit via API
Le systeme SHALL exposer un endpoint `DELETE /api/instructeur/produits?id=xxx` qui supprime (ou archive) un produit appartenant a l'instructeur.

#### Scenario: Suppression reussie
- **WHEN** un instructeur supprime un de ses produits
- **THEN** le systeme marque le produit comme archive et retourne statut 200

#### Scenario: Suppression d'un produit ayant des acheteurs
- **WHEN** un instructeur supprime un produit qui a des acheteurs existants
- **THEN** le systeme archive le produit (soft delete) au lieu de le supprimer definitivement, les acheteurs gardent acces

### Requirement: Les pages frontend DOIVENT utiliser les bons endpoints produits
Le formulaire de creation (`produits/creer/page.tsx`) SHALL envoyer le POST vers `/api/instructeur/produits`. La liste produits (`produits/page.tsx`) SHALL envoyer le DELETE vers `/api/instructeur/produits?id=xxx`.

#### Scenario: Soumission du formulaire de creation
- **WHEN** l'instructeur soumet le formulaire de creation de produit
- **THEN** le frontend envoie un POST vers `/api/instructeur/produits` (pas `/api/produits`)

#### Scenario: Archivage depuis la liste
- **WHEN** l'instructeur clique "Archiver" sur un produit dans la liste
- **THEN** le frontend envoie un DELETE vers `/api/instructeur/produits?id=xxx` (pas `/api/produits/${id}`)
