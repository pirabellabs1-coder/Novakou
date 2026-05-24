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
        Vendre une formation en ligne en Afrique en 2026, c'est devenu accessible
        à n'importe qui — à condition de savoir <Strong>quoi vendre</Strong>,
        <Strong> à qui</Strong>, et <Strong>comment encaisser</Strong>. Cet article
        détaille la méthode complète, étape par étape, basée sur les données
        réelles de centaines de créateurs qui ont lancé leur première formation
        sur Novakou.
      </P>

      <TableOfContents
        items={[
          { id: "marche", label: "Le marché du digital en Afrique francophone" },
          { id: "sujet", label: "Choisir le bon sujet : 3 critères" },
          { id: "structure", label: "Structurer ta formation (vidéo, PDF, hybride)" },
          { id: "prix", label: "Fixer ton prix : 5 000 ou 75 000 FCFA ?" },
          { id: "paiement", label: "Encaisser : Mobile Money, Wave, Orange, MTN" },
          { id: "trafic", label: "Tes 3 premières sources de trafic" },
          { id: "premier", label: "Tes 100 premières ventes" },
        ]}
      />

      <H2 id="marche">Le marché du digital en Afrique francophone en 2026</H2>
      <P>
        Selon GSMA Intelligence, l'Afrique de l'Ouest francophone compte plus de
        <Strong> 180 millions d'utilisateurs internet actifs</Strong> en 2026,
        avec un taux de pénétration smartphone de 73 % au Sénégal, 68 % en Côte
        d'Ivoire et 61 % au Cameroun. La majorité de ces utilisateurs ont moins
        de 35 ans, parlent français et veulent <Strong>se former en ligne</Strong>
        sur des sujets pratiques : entrepreneuriat, marketing digital, compétences
        techniques, langues, développement personnel.
      </P>
      <P>
        Mais voici ce qui change tout : ils <Strong>ne veulent plus suivre des
        formations en anglais ou conçues pour le marché occidental</Strong>. Ils
        cherchent du contenu qui parle de leur réalité — formation Excel pour
        comptabilité d'une PME au Sénégal, marketing Instagram pour boutique
        Wax au Cameroun, anglais pour décrocher un emploi remote depuis Abidjan.
        C'est <Strong>ton avantage</Strong>.
      </P>

      <Callout variant="success" title="Le bon timing">
        Le marché est en pleine croissance mais encore peu saturé. Les
        formations spécialisées Afrique francophone se positionnent souvent
        rapidement sur Google car peu de concurrents publient en français
        sur ces sujets.
      </Callout>

      <H2 id="sujet">Choisir le bon sujet : les 3 critères qui marchent</H2>

      <H3>1. Une compétence concrète qui résout un problème</H3>
      <P>
        Oublie les sujets vagues comme "réussir sa vie" ou "atteindre ses
        objectifs". Les gens achètent des formations qui résolvent un problème
        précis et mesurable. Exemples qui fonctionnent :
      </P>
      <Ul>
        <Li>
          <Strong>"Créer son CV qui décroche un entretien"</Strong> — résout
          un problème immédiat (trouver un emploi).
        </Li>
        <Li>
          <Strong>"Maîtriser Excel pour comptabilité PME"</Strong> — cible
          un profil pro précis avec un besoin clair.
        </Li>
        <Li>
          <Strong>"Vendre sur Instagram avec 0 budget pub"</Strong> — promesse
          mesurable, transformation attendue claire.
        </Li>
      </Ul>

      <H3>2. Un sujet où TU as une expertise réelle</H3>
      <P>
        Tu n'as pas besoin d'être un expert mondial. Tu as juste besoin d'avoir
        <Strong> 2 ans d'avance</Strong> sur celui que tu veux aider. Si tu as
        géré la compta d'une boutique pendant 3 ans, tu peux former un débutant
        en compta. Si tu as gagné 5 millions de FCFA en vendant des prestations
        sur LinkedIn, tu peux former ceux qui n'ont pas encore commencé.
      </P>

      <H3>3. Une audience que tu peux atteindre (par toi ou par pub)</H3>
      <P>
        Vérifie que tu peux toucher ton public cible — soit parce que tu as déjà
        une communauté (groupe WhatsApp, page Facebook, abonnés Instagram), soit
        parce que des groupes existent où tu peux te positionner sans payer
        de pub massive au début.
      </P>

      <Callout variant="tip" title="Le test à 5 messages">
        Avant d'écrire ta formation, envoie 5 messages WhatsApp à 5 personnes
        qui correspondent à ton client cible. Demande-leur : "Si je te
        proposais une formation qui te montre [transformation X], tu paierais
        combien ?" Si au moins 3 disent "oui je serais intéressé", tu as
        un sujet validé.
      </Callout>

      <H2 id="structure">Comment structurer ta formation</H2>

      <H3>Format vidéo (le plus vendu)</H3>
      <P>
        Une formation vidéo se vend généralement entre <Strong>15 000 et
        75 000 FCFA</Strong> en Afrique francophone. Format idéal :
      </P>
      <Ul>
        <Li>3 à 5 modules thématiques</Li>
        <Li>3 à 6 leçons vidéo par module (8 à 15 minutes chacune)</Li>
        <Li>Une fiche pratique PDF par module pour ancrer les apprentissages</Li>
        <Li>Un quiz ou exercice à la fin de chaque module</Li>
        <Li>Total : 2 h à 4 h de contenu</Li>
      </Ul>
      <P>
        Pas besoin de matériel pro pour démarrer. Un smartphone récent (iPhone,
        Samsung milieu de gamme, Tecno Camon ou supérieur) filme en 1080p, ce
        qui est largement suffisant. Investis dans <Strong>un micro-cravate
        à 5 000 FCFA</Strong> — c'est l'élément qui fait passer ta formation
        de "amateur" à "pro" aux yeux de l'acheteur.
      </P>

      <H3>Format ebook (la barrière à l'entrée la plus basse)</H3>
      <P>
        Un ebook bien fait se vend entre <Strong>2 000 et 10 000 FCFA</Strong>.
        Plus rapide à produire qu'une vidéo, parfait pour valider une niche
        avant d'investir dans un cours complet. Structure type : 30 à 80 pages,
        15 à 25 chapitres courts, beaucoup d'exemples concrets et de captures
        d'écran. Outils gratuits pour rédiger : Google Docs (puis export PDF)
        ou Canva pour la mise en page.
      </P>

      <H3>Format hybride (le plus rentable)</H3>
      <P>
        La combinaison gagnante : <Strong>vidéo + PDF + groupe WhatsApp privé +
        1 session de Q&A en visio par mois</Strong>. Tu peux justifier un prix
        plus élevé (50 000 à 150 000 FCFA) et augmenter ton taux de satisfaction.
      </P>

      <H2 id="prix">Fixer ton prix : la formule simple</H2>
      <P>
        L'erreur n°1 des débutants en Afrique : <Strong>fixer un prix trop bas</Strong>
        en pensant que "personne ne paiera plus". Faux. Les gens paient pour la
        <Strong> valeur perçue</Strong>, pas pour le nombre d'heures de vidéo.
      </P>

      <Table
        headers={["Type de formation", "Prix bas", "Prix milieu", "Prix premium"]}
        rows={[
          ["Ebook (30-50 pages)", "2 000 FCFA", "5 000 FCFA", "10 000 FCFA"],
          ["Mini-cours (3-5 vidéos)", "5 000 FCFA", "15 000 FCFA", "25 000 FCFA"],
          ["Formation complète (2-4 h)", "15 000 FCFA", "35 000 FCFA", "75 000 FCFA"],
          ["Formation + coaching", "50 000 FCFA", "100 000 FCFA", "250 000 FCFA"],
        ]}
      />

      <P>
        Vise <Strong>le prix milieu</Strong> pour ta première formation. Plus
        bas, tu attires des acheteurs qui ne consomment pas (mauvais témoignages).
        Plus haut, tu auras du mal à convaincre sans preuve sociale.
      </P>

      <H2 id="paiement">Encaisser : Mobile Money est ta meilleure arme</H2>
      <P>
        En Afrique francophone, <Strong>plus de 70 % des paiements en ligne se
        font via Mobile Money</Strong> (Orange Money, Wave, MTN, Moov). Si tu
        n'acceptes que la carte bancaire Visa, tu coupes ton marché de 70 %
        dès le départ.
      </P>
      <P>
        Sur Novakou, les paiements Mobile Money sont activés par défaut via
        Moneroo et PayGenius — Orange Money Sénégal/Côte d'Ivoire/Cameroun,
        Wave Sénégal/Côte d'Ivoire, MTN MoMo, Moov Money. L'apprenant paie
        depuis son téléphone, l'argent arrive sur ton portefeuille Novakou
        sous 24-48 h, et tu peux le retirer vers ton propre numéro Mobile
        Money à tout moment.
      </P>

      <Callout variant="info" title="Combien ça te coûte ?">
        Novakou prend <Strong>10 %</Strong> de commission sur chaque vente —
        une des commissions les plus basses du marché. Les frais Mobile Money
        eux-mêmes (1 à 3 % selon l'opérateur) sont inclus dans cette commission.
        Aucun abonnement, tu ne paies que si tu vends.
      </Callout>

      <H2 id="trafic">Tes 3 premières sources de trafic gratuit</H2>

      <H3>1. WhatsApp Status + groupes</H3>
      <P>
        Ton réseau WhatsApp existant est ta première audience. Publie un Status
        court (15 secondes vidéo) qui présente ta formation, avec un lien
        court vers ta page produit Novakou. Demande à 5 amis de partager. Tu
        peux faire tes 10 premières ventes uniquement via WhatsApp.
      </P>

      <H3>2. Posts LinkedIn / Facebook réguliers</H3>
      <P>
        Publie <Strong>3 à 4 posts par semaine</Strong> sur ton sujet
        d'expertise. Chaque post = un mini-conseil actionnable (3 lignes
        suffisent). Une fois par semaine, mentionne ta formation en fin de
        post. Cela construit ta crédibilité sur le temps long.
      </P>

      <H3>3. Tunnels de vente gratuits (PDF ou mini-cours)</H3>
      <P>
        Crée un <A href="/tarifs">tunnel de vente</A> sur Novakou avec un PDF
        gratuit comme aimant : "5 erreurs à éviter quand on lance sa boutique
        en ligne en Afrique". Les gens téléchargent gratuitement, tu récupères
        leur email + téléphone, et tu leur proposes ensuite ta formation
        payante avec une séquence d'emails automatiques.
      </P>

      <H2 id="premier">Tes 100 premières ventes : la séquence concrète</H2>
      <Ol>
        <Li>
          <Strong>Semaine 1-2 :</Strong> publie ta formation, prix premium
          (35 000 FCFA), envoie-la à ton réseau direct WhatsApp + LinkedIn.
          Objectif : 5 ventes.
        </Li>
        <Li>
          <Strong>Semaine 3-4 :</Strong> demande à tes 5 premiers acheteurs
          un témoignage vidéo (20 secondes suffisent). Mets-les sur ta page
          produit. Crée 3 posts LinkedIn par semaine.
        </Li>
        <Li>
          <Strong>Mois 2 :</Strong> lance ton tunnel de vente avec PDF gratuit.
          Vise 100 emails collectés. La séquence email transforme 5 à 10 %
          en acheteurs.
        </Li>
        <Li>
          <Strong>Mois 3 :</Strong> tu as les preuves sociales et les emails.
          Lance ta première campagne <A href="/blog/publicite-facebook-instagram-afrique-budget-bas">
          publicité Facebook</A> avec un budget modeste (3 000 à 5 000 FCFA/jour).
        </Li>
        <Li>
          <Strong>Mois 4-6 :</Strong> optimise tes leviers, ajoute des
          upsells, crée une deuxième formation complémentaire à proposer à
          tes acheteurs existants.
        </Li>
      </Ol>

      <Callout variant="success" title="Le résultat attendu">
        En suivant cette séquence, la majorité de nos créateurs font
        <Strong> 50 à 100 ventes dans leurs 6 premiers mois</Strong>. À un
        prix moyen de 25 000 FCFA, cela représente entre 1,2 et 2,5 millions
        de FCFA de chiffre d'affaires (≈ 1 800 à 3 800 €).
      </Callout>

      <H2>Pour aller plus loin</H2>
      <P>
        Si tu veux aller au bout, lis ces articles complémentaires :
      </P>
      <Ul>
        <Li>
          <A href="/blog/mobile-money-orange-wave-mtn-guide-paiement">
            Guide complet Mobile Money : Orange, Wave, MTN, Moov
          </A>
        </Li>
        <Li>
          <A href="/blog/publicite-facebook-instagram-afrique-budget-bas">
            Publicité Facebook & Instagram avec 5 000 FCFA/jour
          </A>
        </Li>
        <Li>
          <A href="/blog/tunnel-vente-novakou-augmenter-conversions">
            Tunnels de vente : multiplier ses conversions par 3
          </A>
        </Li>
      </Ul>
    </Prose>
  );
}
