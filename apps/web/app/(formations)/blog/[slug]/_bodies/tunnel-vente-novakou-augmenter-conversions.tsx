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
        Une page produit toute seule convertit en moyenne <Strong>1 à 3 %</Strong>
        des visiteurs. Un tunnel de vente bien construit peut faire monter ce
        chiffre à <Strong>8 à 15 %</Strong>. Sur 1 000 visiteurs, ça fait la
        différence entre 20 ventes et 100 ventes. Cet article te montre comment
        construire ton premier tunnel sur Novakou, étape par étape.
      </P>

      <TableOfContents
        items={[
          { id: "concept", label: "Tunnel de vente : c'est quoi exactement ?" },
          { id: "pourquoi", label: "Pourquoi 3× plus de ventes ?" },
          { id: "structure", label: "La structure d'un tunnel qui convertit" },
          { id: "etapes", label: "Étape par étape sur Novakou" },
          { id: "upsell", label: "Upsell : doubler ton panier moyen" },
          { id: "metriques", label: "Métriques à suivre" },
          { id: "erreurs", label: "Erreurs à éviter" },
        ]}
      />

      <H2 id="concept">Tunnel de vente : c'est quoi, concrètement ?</H2>
      <P>
        Un tunnel (ou "funnel" en anglais) est une <Strong>séquence de pages</Strong>
        par lesquelles passe un visiteur, organisée pour le faire avancer pas
        à pas vers l'achat — puis pour augmenter le montant qu'il dépense.
      </P>
      <P>
        Page produit classique = 1 page : "voici le produit, achète".
        Tunnel = 3 à 5 pages enchaînées : page de capture → page de vente →
        commande → upsell → confirmation. Chaque étape est optimisée pour son
        objectif spécifique.
      </P>

      <H2 id="pourquoi">Pourquoi un tunnel convertit 3× plus</H2>
      <P>
        Trois raisons psychologiques :
      </P>

      <H3>1. Le visiteur "froid" achète rarement</H3>
      <P>
        Quelqu'un qui découvre ta marque pour la première fois (via une pub
        Facebook par exemple) ne te connaît pas et ne te fait pas confiance.
        Lui demander de sortir sa carte tout de suite, c'est lui demander
        d'épouser quelqu'un au premier rendez-vous.
      </P>
      <P>
        Le tunnel sert à <Strong>réchauffer</Strong> ce visiteur avec un
        échange de valeur progressif : tu donnes d'abord (un ebook gratuit,
        une vidéo gratuite), tu construis la confiance, puis tu vends.
      </P>

      <H3>2. L'engagement progressif</H3>
      <P>
        Donner son email pour télécharger un PDF gratuit = micro-engagement.
        Une fois cet engagement pris, le visiteur est psychologiquement
        prédisposé à dire "oui" à l'offre payante qui suit. C'est le principe
        de cohérence (Cialdini).
      </P>

      <H3>3. Le panier moyen augmente avec l'upsell</H3>
      <P>
        Une fois que quelqu'un a sorti sa carte (ou son Mobile Money) pour
        acheter ta formation à 25 000 FCFA, lui proposer un <Strong>upsell
        à 15 000 FCFA</Strong> ("Pack 5 templates Excel complémentaires")
        convertit à 20-40 %. Tu doubles facilement ton panier moyen sans
        coût d'acquisition supplémentaire.
      </P>

      <H2 id="structure">La structure d'un tunnel Novakou qui convertit</H2>

      <H3>Étape 1 — Page de capture (lead magnet)</H3>
      <P>
        Une page avec UNE seule action possible : <Strong>laisser son email
        + téléphone</Strong> pour recevoir un PDF gratuit (ou une vidéo, ou
        un mini-cours). Le PDF doit être <Strong>vraiment utile</Strong>
        (pas du contenu vide marketing). Exemple :
        "5 modèles d'emails LinkedIn pour décrocher un entretien".
      </P>

      <H3>Étape 2 — Page de remerciement + offre principale</H3>
      <P>
        Le visiteur a téléchargé son PDF. La page de remerciement contient
        son lien de téléchargement + une <Strong>vidéo de 2-3 minutes</Strong>
        où tu présentes ton offre payante. Format VSL (Video Sales Letter)
        court qui crée le désir.
      </P>

      <H3>Étape 3 — Page de commande</H3>
      <P>
        Bouton "Acheter maintenant" → page de paiement (Mobile Money + Carte).
        Sur Novakou, c'est intégré nativement avec Moneroo et PayGenius —
        l'acheteur paie sans quitter ton tunnel.
      </P>

      <H3>Étape 4 — Upsell 1 (one-click)</H3>
      <P>
        IMMÉDIATEMENT après la commande validée, propose un produit
        complémentaire à prix avantageux : <Strong>"Ajoute ce pack Templates
        à ta commande pour 15 000 FCFA au lieu de 25 000"</Strong>. Bouton
        OUI / NON. Si OUI, on facture le supplément directement (pas de
        nouvelle carte à saisir).
      </P>

      <H3>Étape 5 — Confirmation + accès produit</H3>
      <P>
        Page finale : "Merci pour ton achat. Accède à ta formation ici". Email
        de confirmation automatique avec lien d'accès.
      </P>

      <H2 id="etapes">Construire ton premier tunnel sur Novakou</H2>

      <Ol>
        <Li>
          <Strong>Crée ton lead magnet PDF.</Strong> 8-15 pages, ultra-utile,
          lié à ton offre payante. Tu peux le rédiger en 1-2 jours, le mettre
          en page sur Canva.
        </Li>
        <Li>
          <Strong>Va dans Marketing → Tunnels</Strong> sur ton dashboard
          vendeur Novakou. Clique "Créer un nouveau tunnel".
        </Li>
        <Li>
          <Strong>Choisis le template "Lead magnet + offre"</Strong> (4 ou
          5 étapes prédéfinies). Tu peux éditer chaque page dans l'éditeur
          visuel — pas besoin de coder.
        </Li>
        <Li>
          <Strong>Configure l'étape 1</Strong> : titre + sous-titre + image +
          formulaire (email + téléphone + prénom). Active la livraison
          automatique du PDF par email.
        </Li>
        <Li>
          <Strong>Configure l'étape 2</Strong> : héberge ta vidéo sur YouTube
          (en non-listé) ou Vimeo, intègre-la dans la page. Sous la vidéo :
          bouton "Acheter maintenant - 25 000 FCFA".
        </Li>
        <Li>
          <Strong>Configure l'upsell</Strong> : choisis un de tes autres
          produits, fixe un prix promo (-30 à -50 % du prix normal).
        </Li>
        <Li>
          <Strong>Active le tunnel et copie son URL publique.</Strong>
          C'est cette URL que tu mettras dans tes pubs Facebook et tes posts.
        </Li>
      </Ol>

      <Callout variant="tip" title="Conseil de pro">
        Crée <Strong>une séquence email automatique de 5-7 emails</Strong>
        pour les visiteurs qui téléchargent ton lead magnet mais n'achètent
        pas tout de suite. Tu convertis 5 à 15 % d'entre eux sur les jours
        suivants. Novakou propose cette automatisation native dans
        Marketing → Séquences emails.
      </Callout>

      <H2 id="upsell">Upsell intelligent : doubler ton panier moyen</H2>

      <H3>Règle n°1 : l'upsell DOIT être complémentaire</H3>
      <P>
        Ne propose pas un produit aléatoire. Si l'acheteur prend ta formation
        Excel, l'upsell doit être "Pack 10 modèles Excel pro" ou "Coaching 1h
        pour appliquer Excel à ton secteur". Pas une formation de cuisine.
      </P>

      <H3>Règle n°2 : prix de l'upsell ≤ 60 % du prix de la commande principale</H3>
      <P>
        L'acheteur vient de payer X. Lui proposer un upsell à 1,5×X est trop.
        Lui proposer un upsell à 0,5×X est mentalement accessible :
        "Si j'ai payé 25 000, ajouter 12 000 c'est pas grand chose".
      </P>

      <H3>Règle n°3 : créer l'urgence</H3>
      <P>
        L'upsell est valide <Strong>seulement à cet instant</Strong>. Une fois
        qu'il quitte la page, l'offre disparaît. C'est ce qui fait la
        conversion : la peur de rater l'opportunité unique.
      </P>

      <H2 id="metriques">Les métriques à suivre absolument</H2>

      <Table
        headers={["Métrique", "Cible", "Action si en-dessous"]}
        rows={[
          ["Conversion page capture", "30-50 %", "Améliorer la promesse + image"],
          ["Conversion vente principale", "5-15 %", "Améliorer la vidéo VSL + témoignages"],
          ["Conversion upsell", "20-40 %", "Vérifier que l'upsell est vraiment complémentaire"],
          ["EPC (€ par clic)", "0,5 - 2 €", "Calculer : revenu total / clics tunnel"],
          ["Désinscriptions email", "< 2 %", "Au-delà, séquence email trop agressive"],
        ]}
      />

      <H2 id="erreurs">Les 5 erreurs qui plombent les tunnels</H2>
      <Ol>
        <Li>
          <Strong>Trop d'étapes</Strong> (8-10 pages). Plus tu ajoutes d'étapes,
          plus tu perds des visiteurs. Reste à 4-5 max.
        </Li>
        <Li>
          <Strong>Lead magnet trop léger</Strong> (1 page "5 conseils").
          L'acheteur sent qu'il y a de la valeur ailleurs → il ne croit pas
          en ton offre payante.
        </Li>
        <Li>
          <Strong>Pas de Pixel Facebook installé</Strong> sur le tunnel.
          Tu ne peux pas optimiser tes pubs sans données de conversion.
        </Li>
        <Li>
          <Strong>Pas de paiement Mobile Money sur la commande</Strong>.
          Tu perds 70 % des clients en Afrique francophone.
        </Li>
        <Li>
          <Strong>Pas d'analytique active</Strong> (taux conversion par étape).
          Tu ne sais pas où tu perds tes visiteurs, donc tu ne peux pas
          optimiser. Novakou affiche tout ça nativement dans Tunnels →
          Analytics.
        </Li>
      </Ol>

      <Callout variant="success" title="Bilan attendu">
        Un tunnel optimisé sur Novakou amène typiquement :
        <Strong> 5-10 % de conversion globale</Strong> (visiteur → acheteur),
        un <Strong>panier moyen +30 à +60 %</Strong> via upsell, et un
        ROAS sur pub Facebook entre 3× et 6× (au lieu de 1,5× à 2× sans
        tunnel). Si tu fais 50 000 FCFA de pub avec un tunnel à 5×, tu
        sors 250 000 FCFA de chiffre d'affaires.
      </Callout>

      <H2>Suite logique</H2>
      <Ul>
        <Li>
          <A href="/blog/publicite-facebook-instagram-afrique-budget-bas">
            Comment driver du trafic vers ton tunnel avec 5 000 FCFA/jour de pub
          </A>
        </Li>
        <Li>
          <A href="/blog/mobile-money-orange-wave-mtn-guide-paiement">
            Activer tous les moyens de paiement pour ne perdre aucun acheteur
          </A>
        </Li>
      </Ul>
    </Prose>
  );
}
