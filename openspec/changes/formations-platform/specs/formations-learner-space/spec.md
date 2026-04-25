## ADDED Requirements

### Requirement: Shopping cart allows adding multiple formations before purchase
Le panier `/panier` DOIT permettre à un utilisateur connecté d'ajouter plusieurs formations, d'appliquer un code promo, de voir le total avant et après réduction, et de procéder au paiement via Stripe Checkout. Un utilisateur ne peut pas ajouter au panier une formation à laquelle il est déjà inscrit.

#### Scenario: Ajout d'une formation au panier
- **WHEN** un utilisateur connecté clique sur "Ajouter au panier" sur une page de formation
- **THEN** la formation est ajoutée à son panier (table `CartItem`) et un indicateur dans la navbar affiche le nombre d'articles

#### Scenario: Tentative d'ajout d'une formation déjà achetée
- **WHEN** un utilisateur tente d'ajouter au panier une formation pour laquelle il a déjà un `Enrollment`
- **THEN** le bouton "Ajouter au panier" est remplacé par "Déjà inscrit – Accéder à la formation" et aucune action d'ajout n'est effectuée

#### Scenario: Application d'un code promo valide
- **WHEN** un utilisateur saisit un code promo valide et non expiré dans le champ prévu
- **THEN** la réduction correspondante est appliquée au total et le prix final mis à jour est affiché

#### Scenario: Application d'un code promo invalide ou expiré
- **WHEN** un utilisateur saisit un code promo inexistant ou dont la date d'expiration est dépassée
- **THEN** un message d'erreur "Code promo invalide ou expiré" est affiché et le total reste inchangé

#### Scenario: Suppression d'une formation du panier
- **WHEN** un utilisateur clique sur l'icône de suppression d'une formation dans le panier
- **THEN** la formation est retirée du panier et le total est recalculé

### Requirement: Stripe Checkout completes the formation purchase and grants immediate access
Après un paiement Stripe Checkout réussi, le système DOIT créer un `Enrollment` en base de données, envoyer un email de confirmation à l'apprenant et à l'instructeur, vider le panier, et rediriger l'apprenant vers `/mes-formations`. L'accès à la formation DOIT être immédiat après le paiement.

#### Scenario: Paiement réussi via Stripe Checkout
- **WHEN** un utilisateur complète le paiement sur Stripe Checkout
- **THEN** un webhook `checkout.session.completed` est reçu, un `Enrollment` est créé avec `progress = 0`, les emails de confirmation sont envoyés via Resend, le panier est vidé, et l'utilisateur est redirigé vers `/mes-formations`

#### Scenario: Accès immédiat à la formation après paiement
- **WHEN** l'apprenant accède à `/apprendre/[id]` juste après le paiement
- **THEN** le lecteur de cours se charge normalement sans message "Vous n'êtes pas inscrit"

#### Scenario: Paiement échoué ou annulé
- **WHEN** un utilisateur annule le paiement sur Stripe Checkout ou que la transaction échoue
- **THEN** il est redirigé vers `/echec` avec un message d'explication, le panier est préservé, et aucun `Enrollment` n'est créé

#### Scenario: Webhook Stripe traité en double (idempotence)
- **WHEN** le webhook `checkout.session.completed` est reçu deux fois pour la même session Stripe (réseau instable)
- **THEN** un seul `Enrollment` est créé (vérification de l'unicité sur `(userId, formationId)`)

### Requirement: Course player provides a complete learning experience
Le lecteur de cours `/apprendre/[id]` DOIT être accessible uniquement aux apprenants inscrits. Il DOIT afficher un lecteur adapté au type de leçon (vidéo HTML5 custom, visionneuse PDF, contenu texte riche, audio), un panneau de notes personnelles horodatées, et une sidebar curriculum avec l'état de progression de chaque leçon. La progression DOIT reprendre automatiquement à la dernière leçon vue.

#### Scenario: Accès au lecteur sans inscription
- **WHEN** un utilisateur non inscrit tente d'accéder directement à `/apprendre/[formationId]`
- **THEN** il est redirigé vers la page détail de la formation avec un message l'invitant à s'inscrire

#### Scenario: Reprise automatique à la dernière leçon vue
- **WHEN** un apprenant inscrit revient sur le lecteur d'une formation qu'il a déjà commencée
- **THEN** le lecteur ouvre automatiquement la dernière leçon pour laquelle `LessonProgress.completed = false` ou la toute première leçon si aucune n'a été commencée

#### Scenario: Marquer une leçon vidéo comme complétée automatiquement
- **WHEN** un apprenant visionne 90% ou plus d'une leçon vidéo
- **THEN** `LessonProgress.completed = true` est sauvegardé en base de données et la leçon est marquée d'une coche verte dans la sidebar curriculum

#### Scenario: Navigation entre les leçons via la sidebar
- **WHEN** un apprenant clique sur une leçon dans la sidebar curriculum
- **THEN** le contenu principal du lecteur change pour afficher cette leçon sans rechargement complet de la page

#### Scenario: Vitesse de lecture vidéo personnalisable
- **WHEN** un apprenant sélectionne une vitesse de lecture (ex: 1.5x) dans le lecteur vidéo
- **THEN** la vidéo joue à cette vitesse et le réglage est conservé pour les leçons suivantes de la session

#### Scenario: Notes personnelles horodatées
- **WHEN** un apprenant saisit une note dans le panneau latéral pendant la lecture d'une vidéo
- **THEN** la note est sauvegardée automatiquement avec le timestamp actuel de la vidéo, visible dans la liste des notes

#### Scenario: Lecteur PDF avec navigation et téléchargement optionnel
- **WHEN** une leçon de type PDF est ouverte dans le lecteur
- **THEN** le PDF est affiché dans une visionneuse intégrée avec navigation par pages et zoom. Le bouton de téléchargement est présent uniquement si `Lesson.allowDownload = true`

### Requirement: Interactive quizzes gate progress and enable certificate eligibility
Chaque quiz associé à une leçon DOIT pouvoir contenir jusqu'à 4 types de questions (choix unique, choix multiple, vrai/faux, texte libre). L'apprenant ne peut pas revenir en arrière pendant un quiz. Un résultat détaillé avec corrections DOIT être affiché immédiatement après soumission. Le quiz DOIT pouvoir être repassé en cas d'échec.

#### Scenario: Soumission d'un quiz avec score suffisant
- **WHEN** un apprenant soumet un quiz avec un score supérieur ou égal au `passingScore` configuré
- **THEN** `LessonProgress.completed = true` est enregistré, le score est sauvegardé, les corrections détaillées sont affichées, et le bouton "Continuer" vers la leçon suivante est activé

#### Scenario: Soumission d'un quiz avec score insuffisant
- **WHEN** un apprenant soumet un quiz avec un score inférieur au `passingScore`
- **THEN** un message "Score insuffisant" est affiché avec les corrections, et le bouton "Réessayer" permet de recommencer le quiz (les réponses sont réinitialisées)

#### Scenario: Timer de quiz expiré
- **WHEN** le timer d'un quiz configuré avec une limite de temps arrive à zéro
- **THEN** le quiz est automatiquement soumis avec les réponses saisies jusqu'à ce moment

#### Scenario: Question de type texte libre
- **WHEN** un apprenant répond à une question de type TEXTE_LIBRE
- **THEN** la réponse est enregistrée et comparée à la réponse attendue (`correctAnswer`) de manière insensible à la casse et aux espaces superflus

### Requirement: Learner dashboard provides a unified view of all enrolled formations
Le dashboard apprenant `/mes-formations` DOIT afficher les statistiques personnelles de l'apprenant (formations en cours, complétées, certifications, heures d'apprentissage, streak), la liste des formations avec leur progression, et un accès direct aux certificats obtenus.

#### Scenario: Affichage de la progression d'une formation en cours
- **WHEN** un apprenant visite son dashboard et a une formation avec 3 leçons complétées sur 10
- **THEN** la barre de progression affiche 30% et le bouton "Continuer" pointe vers la 4ème leçon

#### Scenario: Formation complétée à 100% avec certificat disponible
- **WHEN** une formation est marquée complétée (`Enrollment.completedAt` non null)
- **THEN** le bouton "Télécharger le certificat" est affiché et pointe vers le PDF du certificat

#### Scenario: Calcul du streak journalier
- **WHEN** un apprenant complète au moins une leçon chaque jour pendant 5 jours consécutifs
- **THEN** son streak est de 5 et s'affiche dans ses statistiques

### Requirement: Learner can request a refund within 30 days
Un apprenant DOIT pouvoir demander le remboursement d'une formation depuis son dashboard dans les 30 jours suivant l'achat. La demande DOIT être transmise à l'admin pour traitement. L'accès à la formation DOIT être suspendu après approbation du remboursement par l'admin.

#### Scenario: Demande de remboursement dans le délai
- **WHEN** un apprenant clique sur "Demander un remboursement" pour une formation achetée il y a moins de 30 jours
- **THEN** une demande de remboursement est créée avec statut "En attente", un email de confirmation est envoyé à l'apprenant et une notification est créée pour l'admin

#### Scenario: Tentative de remboursement hors délai
- **WHEN** un apprenant tente de demander un remboursement pour une formation achetée il y a plus de 30 jours
- **THEN** le bouton "Demander un remboursement" n'est pas affiché et un message indique que le délai est dépassé
