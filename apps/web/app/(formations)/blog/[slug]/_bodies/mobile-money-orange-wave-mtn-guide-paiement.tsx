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
        Encaisser des paiements en Afrique francophone via Mobile Money n'est
        plus un casse-tête en 2026 — à condition de connaître <Strong>les bons
        opérateurs, les bons frais et le bon agrégateur</Strong>. Voici le guide
        complet pour recevoir tes premiers FCFA sur ton téléphone, en quelques
        clics, et payer le minimum de commission.
      </P>

      <TableOfContents
        items={[
          { id: "panorama", label: "Panorama des opérateurs en 2026" },
          { id: "comparaison", label: "Comparatif frais & délais" },
          { id: "couverture", label: "Quels pays pour quel opérateur ?" },
          { id: "integration", label: "Intégration via Novakou (3 minutes)" },
          { id: "retrait", label: "Retirer son argent vers son téléphone" },
          { id: "secu", label: "Sécurité & limites à connaître" },
          { id: "international", label: "Et pour vendre à la diaspora ?" },
        ]}
      />

      <H2 id="panorama">Panorama Mobile Money Afrique francophone 2026</H2>
      <P>
        Le Mobile Money a explosé en Afrique francophone ces 5 dernières années.
        Selon la BCEAO, plus de <Strong>62 millions de comptes Mobile Money
        actifs</Strong> existaient en zone UEMOA en 2025, et ce chiffre dépasse
        désormais les 75 millions en 2026. Les 4 acteurs majeurs :
      </P>
      <Ul>
        <Li>
          <Strong>Orange Money</Strong> — leader historique, présent dans 7 pays
          francophones, base d'utilisateurs la plus large.
        </Li>
        <Li>
          <Strong>Wave</Strong> — disrupteur qui a divisé les frais par 10 (1 %
          contre 7-10 % chez les autres), domine Sénégal et Côte d'Ivoire.
        </Li>
        <Li>
          <Strong>MTN MoMo</Strong> — fort sur Côte d'Ivoire, Cameroun, Bénin
          et Guinée.
        </Li>
        <Li>
          <Strong>Moov Money</Strong> — alternative présente dans 6 pays UEMOA.
        </Li>
      </Ul>

      <H2 id="comparaison">Comparatif des frais et délais de versement</H2>

      <Table
        headers={["Opérateur", "Frais (côté acheteur)", "Frais (côté vendeur)", "Délai versement"]}
        rows={[
          ["Wave", "0 % (envoi gratuit)", "1 % retrait", "Instantané"],
          ["Orange Money", "1,5 - 2 %", "0,5 - 1 % retrait", "Instantané"],
          ["MTN MoMo", "1 - 2 %", "0,5 - 1 % retrait", "Instantané"],
          ["Moov Money", "1,5 - 2 %", "0,5 - 1 % retrait", "Instantané"],
        ]}
      />

      <Callout variant="info" title="À retenir">
        Côté vendeur, les frais Mobile Money sont <Strong>très faibles</Strong>
        (moins de 1,5 % en général), beaucoup plus avantageux qu'une carte
        bancaire internationale (2,9 % + 0,30 € chez Stripe). C'est l'un des
        gros avantages de vendre en Afrique.
      </Callout>

      <H2 id="couverture">Quel opérateur pour quel pays ?</H2>

      <Table
        headers={["Pays", "Recommandé en priorité", "Alternatives"]}
        rows={[
          ["Sénégal", "Wave + Orange Money", "Free Money"],
          ["Côte d'Ivoire", "Wave + Orange + MTN", "Moov Money"],
          ["Cameroun", "Orange Money + MTN MoMo", "—"],
          ["Bénin", "MTN MoMo + Moov Money", "Celtiis Cash"],
          ["Mali", "Orange Money + Moov Money", "—"],
          ["Burkina Faso", "Orange Money + Moov Money", "Coris Money"],
          ["Togo", "T-Money (Moov) + MTN", "Flooz"],
        ]}
      />

      <Callout variant="tip" title="Conseil stratégique">
        Active <Strong>au moins 2 opérateurs par pays cible</Strong>. Si Orange
        est down (ça arrive 1-2 fois par mois en moyenne en Afrique), tu ne
        veux pas perdre toutes tes ventes ce jour-là. Avec 2 options, l'acheteur
        choisit l'alternative et tu encaisses quand même.
      </Callout>

      <H2 id="integration">Comment activer Mobile Money sur Novakou (3 minutes)</H2>
      <P>
        Novakou a intégré nativement <Strong>Moneroo</Strong> et
        <Strong> PayGenius</Strong>, les deux agrégateurs leaders en Afrique
        francophone. Tu n'as pas besoin de contracter individuellement avec
        chaque opérateur (Orange, Wave, MTN), Novakou gère tout en arrière-plan.
      </P>

      <H3>Étape 1 — Va dans tes paramètres paiement</H3>
      <P>
        Depuis ton tableau de bord vendeur, ouvre <Strong>Paramètres → Méthodes
        de paiement</Strong>. Active les méthodes que tu veux accepter (toutes
        sont activées par défaut sur Novakou).
      </P>

      <H3>Étape 2 — Configure ton numéro de retrait</H3>
      <P>
        Dans <Strong>Finances → Méthodes de retrait</Strong>, ajoute ton propre
        numéro Mobile Money. C'est sur ce numéro que Novakou te versera tes
        gains quand tu demandes un retrait. Tu peux ajouter plusieurs numéros
        (Wave + Orange par exemple) et choisir au moment du retrait.
      </P>

      <H3>Étape 3 — Teste avec un petit montant</H3>
      <P>
        Crée un produit à 500 FCFA (le minimum) et achète-le toi-même avec ton
        propre Mobile Money. Tu reçois l'argent sur ton portefeuille Novakou
        en 24 h. Demande un retrait → l'argent arrive sur ton téléphone en
        moins de 2 minutes. C'est aussi simple que ça.
      </P>

      <Callout variant="success" title="Combien Novakou prend ?">
        <Strong>10 % de commission</Strong> sur chaque vente — tout compris
        (frais Mobile Money + transaction + plateforme). Pas d'abonnement,
        pas de frais cachés. Tu ne paies que si tu vends.
      </Callout>

      <H2 id="retrait">Retirer son argent : combien, quand, comment</H2>

      <H3>Le délai escrow de 48 heures</H3>
      <P>
        Quand un acheteur paie, l'argent arrive sur ton portefeuille Novakou
        mais reste <Strong>"en attente" pendant 48 heures</Strong>. Ce délai
        sert à couvrir les éventuelles demandes de remboursement (très rares
        sur les formations digitales — moins de 2 % du temps). Passé ce délai,
        les fonds passent en "disponible" et tu peux retirer.
      </P>

      <H3>Demande de retrait</H3>
      <P>
        Depuis <Strong>Finances → Retraits</Strong>, demande un retrait. Choisis
        ton numéro Mobile Money. Validation instantanée pour les montants
        inférieurs à 500 000 FCFA. Au-delà, vérification anti-fraude sous 24 h
        max. Ensuite l'argent arrive sur ton téléphone en moins de 2 minutes.
      </P>

      <H3>Montant minimum et fréquence</H3>
      <P>
        Tu peux retirer à partir de <Strong>2 000 FCFA</Strong>, autant de
        fois que tu veux dans le mois — aucune limite mensuelle.
      </P>

      <H2 id="secu">Sécurité & limites à connaître</H2>

      <H3>KYC (vérification d'identité)</H3>
      <P>
        Pour retirer plus de <Strong>200 000 FCFA cumulés</Strong>, tu dois
        valider ton KYC sur Novakou (CNI ou passeport + selfie). C'est une
        obligation légale dans tous les pays — anti-blanchiment + protection
        contre l'usurpation. Le processus prend 24 à 48 h.
      </P>

      <H3>Limites Mobile Money par opérateur</H3>
      <P>
        Chaque opérateur a des limites de transaction (souvent 500 000 à
        2 000 000 FCFA par jour selon ton niveau de compte). Si tu vends
        régulièrement gros, contacte ton opérateur pour passer en compte
        "professionnel" (limites étendues, 5-10 millions FCFA par jour).
      </P>

      <H3>Anti-fraude</H3>
      <P>
        Novakou surveille les transactions atypiques (multiples retraits en
        rafale, achats avec cartes volées, etc.). En cas de suspicion, ton
        retrait peut être gelé temporairement (24-72 h) le temps de vérifier.
        Garde tes preuves (CNI, justif domicile) prêtes pour accélérer la
        vérification si besoin.
      </P>

      <H2 id="international">Vendre à la diaspora : ajouter la carte bancaire</H2>
      <P>
        Une grosse partie de tes acheteurs peut venir de la <Strong>diaspora
        africaine</Strong> en France, Belgique, Canada, USA. Ces personnes
        n'ont souvent pas de Mobile Money mais ont une carte Visa/Mastercard.
        Novakou active automatiquement le paiement carte (via Stripe ou
        PayGenius selon le pays de l'acheteur) — pas de config à faire.
      </P>
      <P>
        Pour les paiements carte, la commission Novakou reste à 10 % mais
        les frais Stripe/PayGenius (2,9 % + 0,30 € en moyenne) sont prélevés
        en sus. Concrètement : sur une formation vendue 30 000 FCFA à un
        client en France, tu reçois environ <Strong>25 500 FCFA nets</Strong>.
      </P>

      <Callout variant="success" title="Conclusion">
        Mobile Money en Afrique n'est plus une contrainte, c'est <Strong>ton
        avantage</Strong>. Frais beaucoup plus bas que la carte bancaire,
        adoption massive (75 millions+ d'utilisateurs), versement instantané.
        Activez-le, testez-le, et concentrez-vous sur ce qui compte vraiment :
        <A href="/blog/vendre-formation-en-ligne-afrique-2026"> créer la
        formation que vos clients veulent</A>.
      </Callout>
    </Prose>
  );
}
