import {
  Prose,
  H2,
  H3,
  P,
  A,
  Ul,
  Ol,
  Li,
  Strong,
  Callout,
  Table,
  TableOfContents,
} from "./_prose";

export default function Body() {
  return (
    <Prose>
      <P>
        "Qu'est-ce que je peux bien vendre ?" — c'est LA question qui bloque
        90 % des futurs créateurs digitaux. Bonne nouvelle : tu as déjà
        plusieurs idées rentables sous le nez, tu ne les vois juste pas encore.
        Cet article te donne <Strong>10 idées concrètes</Strong> qui marchent
        en Afrique francophone en 2026, avec les prix réels, les acheteurs
        types et les ventes moyennes constatées sur Novakou.
      </P>

      <TableOfContents
        items={[
          { id: "methode", label: "La méthode pour trouver TON idée" },
          { id: "ebooks", label: "1-3 — Ebooks ultra-vendus" },
          { id: "templates", label: "4-5 — Templates digitaux" },
          { id: "formations", label: "6-8 — Formations vidéo" },
          { id: "premium", label: "9-10 — Produits premium" },
          { id: "valider", label: "Comment valider ton idée en 48 h" },
        ]}
      />

      <H2 id="methode">La méthode "audit personnel" pour trouver TON idée</H2>
      <P>
        Avant de regarder ce que les autres vendent, fais ce petit audit. Sors
        une feuille et réponds à ces 4 questions :
      </P>
      <Ol>
        <Li>
          <Strong>Quelle compétence pratique as-tu acquise dans les 5
          dernières années ?</Strong> (Métier actuel, side-project, hobby
          maîtrisé)
        </Li>
        <Li>
          <Strong>Qu'est-ce que tes amis te demandent souvent comme conseil ?</Strong>
          (CV, négociation salaire, recettes, organisation, etc.)
        </Li>
        <Li>
          <Strong>Quelle erreur as-tu mis 2 ans à éviter</Strong> que tu pourrais
          enseigner en 2 heures ? (Économie de temps colossale pour les autres)
        </Li>
        <Li>
          <Strong>Quel outil maîtrises-tu</Strong> que beaucoup utilisent mal
          (Excel, Canva, WhatsApp Business, Notion, ChatGPT) ?
        </Li>
      </Ol>
      <P>
        Les réponses à ces 4 questions contiennent au moins <Strong>3 idées
        de produits digitaux vendables</Strong>. Maintenant, voici les 10
        catégories qui marchent en Afrique francophone.
      </P>

      <H2 id="ebooks">Catégorie 1 : Ebooks ultra-vendus (2 000 - 8 000 FCFA)</H2>

      <H3>1. "Réussir son entretien d'embauche au Sénégal/CI/Cameroun"</H3>
      <P>
        Format : 40-60 pages PDF, exemples concrets, scripts de réponses aux
        questions classiques. Acheteurs : jeunes diplômés (20-30 ans). Prix
        idéal : <Strong>3 500 FCFA</Strong>. Marketing : LinkedIn (cible
        principale), groupes Facebook "Emploi Sénégal/CI/etc.".
      </P>

      <H3>2. "Mon CV qui décroche : modèles & guide"</H3>
      <P>
        Format : ebook + 5 templates Word/Google Docs. Acheteurs : recherche
        d'emploi active. Prix : <Strong>5 000 FCFA</Strong>. Marketing :
        groupes LinkedIn + boost FB de 2 000 FCFA/jour, ciblage "intérêt :
        recherche d'emploi".
      </P>

      <H3>3. "Lancer son business en ligne avec moins de 100 000 FCFA"</H3>
      <P>
        Format : 50-80 pages, étude de cas réels, liste d'outils gratuits.
        Acheteurs : aspirants entrepreneurs (25-40 ans). Prix :
        <Strong>7 500 FCFA</Strong>. Excellent comme premier produit
        d'appel : convertit ensuite vers une formation plus complète.
      </P>

      <H2 id="templates">Catégorie 2 : Templates digitaux (5 000 - 15 000 FCFA)</H2>

      <H3>4. "Pack Excel comptabilité PME" (10 fichiers)</H3>
      <P>
        Format : 10 fichiers Excel pré-remplis avec formules — compta simple,
        suivi clients, devis, factures, trésorerie. Acheteurs : auto-entrepreneurs,
        comptables débutants, gérants de petites boutiques. Prix :
        <Strong>10 000 FCFA</Strong>. Vente moyenne sur Novakou : 35 ventes/mois
        pour les bonnes niches.
      </P>

      <H3>5. "Templates Canva pour business Wax/Restaurant/Coiffure"</H3>
      <P>
        Format : 30-50 templates Canva (flyers, posts Instagram, menu, cartes
        de visite) pour un secteur précis. Acheteurs : commerçants qui veulent
        un visuel pro sans designer. Prix : <Strong>8 000 - 12 000 FCFA</Strong>.
      </P>

      <Callout variant="tip" title="Astuce ciblage">
        Crée un pack templates par secteur, pas un pack "généraliste". Un
        "Pack Canva pour Salon de Coiffure" se vend 3× mieux qu'un "Pack
        Canva tous secteurs" parce que les acheteurs veulent <Strong>VOIR
        leur métier</Strong> dans les templates.
      </Callout>

      <H2 id="formations">Catégorie 3 : Formations vidéo (15 000 - 75 000 FCFA)</H2>

      <H3>6. "Maîtriser Excel de A à Z (formation 4 h)"</H3>
      <P>
        Format : 4 h de vidéo + fichiers d'exercice. 4-5 modules : bases,
        formules, tableaux croisés dynamiques, graphiques, automatisation
        légère. Acheteurs : étudiants, jeunes actifs, comptables. Prix :
        <Strong>25 000 FCFA</Strong>. Marketing : posts LinkedIn 3×/semaine
        + boost FB sur "fonction : comptable/admin/gestion".
      </P>

      <H3>7. "Vendre sur Instagram sans budget pub"</H3>
      <P>
        Format : 3-4 h de vidéo. Modules : optimiser bio + highlights, Reels
        qui marchent, DM stratégie, conversion en vente. Acheteurs : boutiques
        Wax, restaurants, coiffeuses, créateurs. Prix : <Strong>35 000
        FCFA</Strong>. Très haut potentiel viral si ton intro est bonne.
      </P>

      <H3>8. "Anglais business pour décrocher un emploi remote"</H3>
      <P>
        Format : 6 h de vidéo + ebook + groupe WhatsApp. Très haute valeur
        perçue car le ROI est tangible (emploi à 500-2000 €/mois). Acheteurs :
        20-35 ans, déjà niveau intermédiaire en anglais, qui cherchent à
        passer pro. Prix : <Strong>50 000 - 75 000 FCFA</Strong>.
      </P>

      <H2 id="premium">Catégorie 4 : Produits premium (50 000 - 250 000 FCFA)</H2>

      <H3>9. "Coaching individuel + formation" (3 mois)</H3>
      <P>
        Format : formation vidéo + 1 séance Zoom/mois + groupe WhatsApp privé
        + révision de ton travail. Acheteurs : 5-10 par cohorte max. Prix :
        <Strong>100 000 - 250 000 FCFA</Strong>. Idéal pour les sujets où
        l'accompagnement personnalisé est crucial (lancement business,
        négociation salaire, perte de poids).
      </P>

      <H3>10. "Mastermind annuel" (10-20 personnes)</H3>
      <P>
        Format : 12 sessions visio mensuelles + ressources + accès à un
        réseau privé. Acheteurs : pros et entrepreneurs voulant accélérer.
        Prix : <Strong>250 000 - 1 000 000 FCFA</Strong>. À ne lancer que
        quand tu as déjà une marque et une crédibilité.
      </P>

      <H2 id="valider">Valider ton idée en 48 heures (gratuit)</H2>
      <P>
        Avant d'investir 1 mois à créer ton produit, valide-le. Méthode du
        <Strong> pré-lancement</Strong> :
      </P>
      <Ol>
        <Li>
          Crée une page produit minimale sur Novakou (1 paragraphe, 1 image,
          le prix). Marque-la <Strong>"Pré-commande - sortie dans 30 jours"</Strong>.
        </Li>
        <Li>
          Partage le lien à 50 personnes de ton réseau (WhatsApp, LinkedIn,
          email). Pose la question : "J'ai créé ça, ça résout [problème X]
          pour [audience Y]. Si tu connais 2 personnes intéressées, tu peux
          leur envoyer le lien ?"
        </Li>
        <Li>
          Compte le nombre de <Strong>clics + ajouts au panier</Strong>. Si
          tu as plus de 5 % de conversion (5 commandes pour 100 visites), ton
          idée est validée et tu peux investir le temps à créer le produit
          complet.
        </Li>
        <Li>
          Si tu as moins de 1 % de conversion, c'est que ton offre n'est pas
          claire ou pas désirée — itère sur le titre, le prix, l'image.
        </Li>
      </Ol>

      <Callout variant="success" title="Le bonus rare">
        Si tu fais déjà des pré-commandes pendant la phase de validation,
        tu peux utiliser cet argent (en escrow chez Novakou) pour
        financer la production de ton produit. Méthode utilisée par
        plusieurs des plus gros créateurs Novakou pour démarrer sans
        capital initial.
      </Callout>

      <H2>Suite logique</H2>
      <P>
        Tu as ton idée ? Voici les prochaines étapes :
      </P>
      <Ul>
        <Li>
          <A href="/blog/vendre-formation-en-ligne-afrique-2026">
            Comment vendre ta première formation en Afrique
          </A> (méthode complète)
        </Li>
        <Li>
          <A href="/blog/publicite-facebook-instagram-afrique-budget-bas">
            Faire connaître ton produit avec 5 000 FCFA/jour de pub Facebook
          </A>
        </Li>
        <Li>
          <A href="/blog/tunnel-vente-novakou-augmenter-conversions">
            Construire ton tunnel de vente pour multiplier les conversions
          </A>
        </Li>
      </Ul>
    </Prose>
  );
}
