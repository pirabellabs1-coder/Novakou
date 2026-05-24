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
        En Afrique francophone, tu peux faire des campagnes publicitaires
        Facebook & Instagram <Strong>rentables avec un budget de 5 000 FCFA
        par jour</Strong> (≈ 7,5 €). Cet article te donne la méthode exacte
        utilisée par les vendeurs Novakou qui ont fait leurs premières
        ventes via Meta Ads — sans agence, sans budget de startup.
      </P>

      <TableOfContents
        items={[
          { id: "prerequis", label: "Les pré-requis avant de payer du pub" },
          { id: "setup", label: "Setup compte pub + Pixel en 15 minutes" },
          { id: "ciblage", label: "Ciblage : 4 audiences qui marchent" },
          { id: "creatifs", label: "Créatifs qui convertissent en Afrique" },
          { id: "budget", label: "Budget 5 000 FCFA/jour : structure idéale" },
          { id: "abtest", label: "A/B test sans complexer" },
          { id: "scaler", label: "Scaler de 5 000 à 50 000 FCFA/jour" },
        ]}
      />

      <H2 id="prerequis">Ce que tu dois avoir AVANT de payer de la pub</H2>
      <P>
        Faire de la pub sans ces 3 prérequis, c'est jeter ton argent par la
        fenêtre. Coche cette liste avant de continuer :
      </P>
      <Ul>
        <Li>
          <Strong>Une page produit qui convertit</Strong> (sur Novakou : ta
          formation, ton ebook, ton template avec image, prix, description,
          bouton acheter). Idéalement au moins 1-3 témoignages clients
          (pour la preuve sociale).
        </Li>
        <Li>
          <Strong>Un paiement qui marche</Strong> : Mobile Money activé +
          carte bancaire pour la diaspora. Si l'acheteur ne peut pas payer
          de son téléphone en 30 secondes, tu perds 70 % de tes prospects.
        </Li>
        <Li>
          <Strong>Un Facebook Pixel installé</Strong> sur ta page produit
          Novakou. Sans Pixel, Meta ne sait pas qui a acheté → l'algo ne
          peut pas optimiser → tu paies cher pour des clics qui ne convertissent
          pas. Sur Novakou tu colles ton Pixel ID dans
          Settings → Marketing → Pixels et c'est fait.
        </Li>
      </Ul>

      <Callout variant="warning" title="Erreur fatale n°1">
        90 % des débutants lancent leur première pub sans Pixel. Résultat :
        ils brûlent 50 000 FCFA en 3 jours, ne savent pas pourquoi ça ne
        convertit pas, abandonnent. Installe ton Pixel AVANT de payer.
      </Callout>

      <H2 id="setup">Setup compte pub Meta + Pixel en 15 minutes</H2>

      <H3>1. Créer ton compte Business Manager</H3>
      <P>
        Va sur <A href="https://business.facebook.com">business.facebook.com</A>,
        crée un Business Manager avec le nom de ta marque (pas ton nom perso),
        ton email, ton numéro de téléphone. Gratuit. 3 minutes.
      </P>

      <H3>2. Ajouter une carte bancaire pour facturation</H3>
      <P>
        Meta accepte les cartes Visa/Mastercard internationales. En Afrique
        francophone, les cartes Wave Visa, Ecobank, et celles de la plupart
        des banques marchent. Si ta carte est refusée, demande une
        <Strong>carte Wave Plus</Strong> ou <Strong>Ecobank Visa Virtual</Strong>
        — créées en 5 minutes depuis ton téléphone.
      </P>

      <H3>3. Créer ton Pixel</H3>
      <P>
        Dans Business Manager → Events Manager → Connect Data Sources → Web →
        Facebook Pixel. Donne-lui un nom (ex: "Novakou Boutique"). Copie le
        Pixel ID (chiffre à 15-16 digits).
      </P>

      <H3>4. Coller le Pixel ID sur Novakou</H3>
      <P>
        Sur ta boutique Novakou : <Strong>Settings → Marketing → Pixels →
        Facebook</Strong>. Colle l'ID. Sauvegarder. Vérifie avec l'extension
        Chrome "Meta Pixel Helper" sur ta page produit que le Pixel est bien
        détecté.
      </P>

      <H2 id="ciblage">Les 4 audiences qui convertissent en Afrique francophone</H2>

      <H3>Audience 1 : Intérêts larges (pour découvrir des nouveaux acheteurs)</H3>
      <P>
        Ciblage : Pays cible (ex: Sénégal), âge 25-45, intérêts liés à ton
        sujet. Pour une formation Excel : "Microsoft Excel", "Comptabilité",
        "Entrepreneuriat". Taille audience : 500 000 à 2 millions de personnes.
        C'est ta meilleure audience pour démarrer.
      </P>

      <H3>Audience 2 : Lookalike de tes acheteurs (à activer après 50 ventes)</H3>
      <P>
        Quand tu as <Strong>50+ acheteurs</Strong> via ton Pixel, crée une
        audience Lookalike 1 % du pays. Meta trouve des gens qui ressemblent
        statistiquement à tes acheteurs. Habituellement la meilleure performance
        après 2-3 mois de pub.
      </P>

      <H3>Audience 3 : Retargeting visiteurs de ta page produit</H3>
      <P>
        Ciblage : "Personnes ayant visité ta page produit dans les 7 derniers
        jours mais n'ayant pas acheté". Audience petite mais ULTRA chaude.
        Conversion 3-5× supérieure aux audiences froides.
      </P>

      <H3>Audience 4 : Engagements Instagram/Facebook</H3>
      <P>
        Si tu as une page IG/FB avec quelques followers : retarget les gens
        qui ont liké, commenté, sauvegardé tes posts dans les 90 derniers
        jours. Ils te connaissent déjà → conversion élevée.
      </P>

      <H2 id="creatifs">Créatifs qui convertissent vraiment en Afrique</H2>

      <H3>Format 1 — Vidéo selfie 15 secondes (le plus performant)</H3>
      <P>
        Filme-toi face caméra avec ton smartphone. Hook ultra-direct :
      </P>
      <Callout variant="tip" title="Script type qui marche">
        <P>
          "Si tu galères avec [problème], cette formation va changer ta vie.
          J'ai aidé [X personnes] en [délai] à [résultat concret]. Lien en
          bas, c'est ouvert jusqu'à dimanche soir."
        </P>
      </Callout>
      <P>
        Pas besoin de montage compliqué. Sous-titres en bas obligatoires
        (les gens scrollent en silence). Outils gratuits pour sous-titrer :
        CapCut, InShot, Premiere Rush.
      </P>

      <H3>Format 2 — Carrousel résultats avant/après</H3>
      <P>
        4-5 slides : "Avant : tu ne savais pas X" → "Tu apprends Y dans la
        formation" → "Après : voici ce que tu sais faire" → "Témoignage
        client" → "CTA". Performant pour les formations à résultat tangible.
      </P>

      <H3>Format 3 — Photo simple + texte fort</H3>
      <P>
        Une photo de toi (ou de ton produit) + un texte percutant en gros.
        Économique à produire, très bien pour tester rapidement plusieurs
        angles d'accroche. Outil : Canva (gratuit, templates pub Facebook
        format 1080x1080 et 1080x1350).
      </P>

      <Callout variant="warning" title="Ce qui NE marche PAS">
        Photos stock génériques (gens blancs en costume dans un bureau),
        textes longs sans hook, créatifs trop "design" qui ressemblent à
        de la pub évidente. Les gens scrollent dessus en 0,8 seconde.
      </Callout>

      <H2 id="budget">Structure idéale avec 5 000 FCFA/jour (≈ 7,50 €)</H2>

      <Table
        headers={["Élément", "Setup recommandé"]}
        rows={[
          ["Type campagne", "Objectif: Ventes (Conversions) — pas Trafic"],
          ["Budget", "5 000 FCFA/jour, niveau campagne"],
          ["Nombre d'audiences", "1 seule audience pour démarrer (intérêts larges)"],
          ["Nombre de créatifs", "3 créatifs différents (vidéo + carrousel + photo)"],
          ["Placement", "Automatique (laisse Meta optimiser)"],
          ["Optimisation", "Achat / Purchase (pas vue de page)"],
        ]}
      />

      <P>
        Avec 5 000 FCFA/jour, attends-toi à :
      </P>
      <Ul>
        <Li>1 500 à 3 000 personnes touchées par jour</Li>
        <Li>30 à 100 clics vers ta page produit</Li>
        <Li>0 à 3 ventes par jour (selon ton produit et ton ciblage)</Li>
      </Ul>
      <P>
        Si tu n'as <Strong>aucune vente après 3 jours</Strong>, le problème
        n'est probablement pas la pub : c'est ta page produit ou ton prix.
        Pause la pub, fixe le problème, relance.
      </P>

      <H2 id="abtest">A/B test sans te prendre la tête</H2>
      <P>
        Test simple à mener pendant tes 2 premières semaines :
      </P>
      <Ol>
        <Li>
          <Strong>Semaine 1 :</Strong> 1 audience large + 3 créatifs différents.
          Identifie le créatif gagnant (CTR le plus élevé + plus de ventes).
        </Li>
        <Li>
          <Strong>Semaine 2 :</Strong> garde le créatif gagnant, test 2
          audiences différentes (intérêts vs lookalike si dispo). Identifie
          l'audience gagnante.
        </Li>
        <Li>
          <Strong>Semaine 3+ :</Strong> tu as le combo (créatif + audience)
          gagnant. Tu peux scaler le budget.
        </Li>
      </Ol>

      <H2 id="scaler">Scaler de 5 000 à 50 000 FCFA/jour</H2>
      <P>
        Quand ton combo gagnant fait 3+ ventes/jour pendant 7 jours
        consécutifs, tu peux augmenter le budget. Règle d'or :
        <Strong> +20 % de budget par jour max</Strong>. Si tu augmentes
        brutalement (de 5 000 à 30 000 FCFA d'un coup), l'algorithme Meta
        repasse en phase d'apprentissage et tes performances chutent
        pendant 3-7 jours.
      </P>
      <P>
        Exemple de scaling sain :
      </P>
      <Ul>
        <Li>Jour 1 : 5 000 FCFA → 6 000 FCFA</Li>
        <Li>Jour 3 : 6 000 → 7 200 FCFA</Li>
        <Li>Jour 6 : 7 200 → 8 600 FCFA</Li>
        <Li>Jour 14 : ~15 000 FCFA, contrôlé</Li>
      </Ul>

      <Callout variant="success" title="Combien tu peux espérer ?">
        Avec une formation à 25 000 FCFA et une dépense pub de 5 000 FCFA/jour
        bien optimisée, le ROAS (return on ad spend) typique en Afrique
        francophone est entre <Strong>2,5× et 4×</Strong>. Donc 5 000 FCFA
        dépensés = 12 500 à 20 000 FCFA de chiffre d'affaires. Reste 7 500
        à 15 000 FCFA après pub, moins 10 % commission Novakou = ton bénéfice
        net.
      </Callout>

      <H2>Pour aller plus loin</H2>
      <Ul>
        <Li>
          <A href="/blog/tunnel-vente-novakou-augmenter-conversions">
            Augmenter tes conversions avec un tunnel de vente
          </A> (×3 de revenu avec le même trafic)
        </Li>
        <Li>
          <A href="/blog/vendre-formation-en-ligne-afrique-2026">
            La méthode globale pour lancer ta première formation
          </A>
        </Li>
      </Ul>
    </Prose>
  );
}
