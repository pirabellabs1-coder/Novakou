## ADDED Requirements

### Requirement: Admin navigation includes a "Formations" section
Le menu de navigation de l'espace admin existant (`/admin`) DOIT inclure une nouvelle section "Formations" avec des sous-liens vers les pages : Dashboard formations, Liste des formations, Instructeurs, Apprenants, Finances, Certificats, Catégories. Cette section DOIT être positionnée après la section "Blog & Contenu" dans le menu admin existant.

#### Scenario: Section "Formations" visible dans le menu admin
- **WHEN** un administrateur accède à l'espace admin `/admin`
- **THEN** le menu de navigation latéral affiche une section "Formations" avec ses 7 sous-pages, sans chevauchement avec les sections existantes

#### Scenario: Lien actif mis en évidence dans la navigation formations admin
- **WHEN** un admin est sur la page `/admin/formations/liste`
- **THEN** le lien "Liste des formations" est mis en évidence (fond coloré) dans le menu admin

### Requirement: Admin global dashboard includes formations KPIs
Le dashboard global admin existant à `/admin/dashboard` DOIT afficher des KPIs dédiés à la section formations : nombre de formations actives, nombre d'apprenants inscrits, CA formations du mois (montant total perçu par la plateforme depuis les formations), nombre de certifications délivrées. Ces KPIs DOIVENT s'ajouter aux KPIs existants (commandes freelance, GMV, etc.) sans les remplacer.

#### Scenario: KPIs formations sur le dashboard admin global
- **WHEN** un admin accède à `/admin/dashboard`
- **THEN** il voit, en plus des métriques freelance existantes, 4 nouvelles cards de métriques formations : "Formations actives", "Apprenants inscrits", "CA Formations (mois)", "Certifications délivrées"

#### Scenario: KPIs formations mis à jour en temps quasi-réel
- **WHEN** un nouvel apprenant s'inscrit à une formation
- **THEN** le compteur "Apprenants inscrits" sur le dashboard admin est mis à jour dans les 60 secondes (via revalidation ISR ou refresh TanStack Query)
