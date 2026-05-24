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
  Em,
  Callout,
  Table,
  TableOfContents,
} from "./_prose";

export default function Body() {
  return (
    <Prose>
      <P>
        <Strong>Aïcha, 28 ans, assistante administrative à Dakar.</Strong>
        En 30 jours, elle a vendu sa première formation Excel pour un
        chiffre d'affaires de <Strong>660 000 FCFA (≈ 1 005 €)</Strong> sur
        Novakou. Voici la chronologie exacte, les leviers utilisés, et la
        méthode que tu peux copier pour ton propre lancement.
      </P>

      <Callout variant="info" title="Disclaimer">
        Le prénom et certains détails ont été modifiés pour préserver
        l'anonymat. Les chiffres sont réels et issus du dashboard Novakou.
      </Callout>

      <TableOfContents
        items={[
          { id: "contexte", label: "Le contexte avant de commencer" },
          { id: "semaine1", label: "Semaine 1 — Idée + validation" },
          { id: "semaine2", label: "Semaine 2 — Production de la formation" },
          { id: "semaine3", label: "Semaine 3 — Mise en ligne + premières ventes" },
          { id: "semaine4", label: "Semaine 4 — Pub Facebook + scale" },
          { id: "bilan", label: "Bilan chiffré au jour 30" },
          { id: "copier", label: "La méthode reproductible" },
        ]}
      />

      <H2 id="contexte">Le contexte avant de commencer</H2>
      <P>
        Aïcha travaillait depuis 4 ans comme assistante admin dans une PME
        de Dakar. Maîtrise avancée d'Excel (tableaux croisés dynamiques,
        formules, automatisations légères). Beaucoup de ses collègues
        plus jeunes lui demandaient régulièrement de l'aide pour leurs
        propres fichiers Excel.
      </P>
      <P>
        <Strong>Capital de départ : 0 FCFA.</Strong> Outils : un smartphone
        Tecno récent + un ordinateur du bureau qu'elle pouvait utiliser le
        soir. Audience : 800 contacts LinkedIn + 1 200 amis Facebook + un
        groupe WhatsApp de 80 personnes.
      </P>

      <H2 id="semaine1">Semaine 1 — Idée + validation</H2>

      <H3>Jour 1-2 : Choix du sujet</H3>
      <P>
        Aïcha applique la méthode du <A href="/blog/trouver-idee-produit-digital-rentable">
        choix d'idée</A> en se posant la question : "Qu'est-ce que mes
        collègues me demandent le plus ?". Réponse claire : "Comment faire
        des tableaux croisés dynamiques et automatiser leurs reportings
        mensuels."
      </P>
      <P>
        Sujet retenu : <Strong>"Maîtriser Excel pour reporting mensuel
        — formation 4 heures"</Strong>. Cible : assistantes admin et
        comptables débutants en Afrique francophone.
      </P>

      <H3>Jour 3-4 : Test à 5 messages</H3>
      <P>
        Envoie 5 messages WhatsApp à 5 collègues/connaissances qui
        correspondent au profil cible. Question : "Si je proposais une
        formation 4 h pour maîtriser Excel niveau reporting pro, ça
        t'intéresserait à quel prix ?". 4 répondent "Oui je serais
        intéressée, autour de 20-30 000 FCFA". <Strong>Validation acquise.</Strong>
      </P>

      <H3>Jour 5-7 : Plan de formation détaillé</H3>
      <P>
        Aïcha détaille le plan : 4 modules, 16 leçons vidéo de 10 min, 4
        fichiers Excel d'exercice. Plan écrit sur Google Doc, validation
        par une amie expérimentée qui ajoute 2 suggestions.
      </P>

      <H2 id="semaine2">Semaine 2 — Production</H2>

      <H3>Setup matériel</H3>
      <P>
        Investissement : <Strong>3 500 FCFA pour un micro-cravate</Strong>
        acheté sur Jumia. Logiciel d'enregistrement écran : OBS Studio
        (gratuit). Logiciel de montage : CapCut sur ordi (gratuit).
      </P>

      <H3>Production des vidéos</H3>
      <P>
        Aïcha enregistre <Strong>2 leçons par soir</Strong> après le
        travail, du lundi au vendredi. 10 leçons enregistrées en 5 jours.
        Le weekend, enregistrement des 6 dernières + premier montage.
      </P>

      <H3>Préparation des supports</H3>
      <P>
        Création des 4 fichiers Excel d'exercice (qu'elle utilisait déjà
        au travail, adaptés pour la formation). PDF récap de 12 pages
        rédigé en 1 soirée sur Google Docs, mis en page sur Canva.
      </P>

      <Callout variant="tip" title="Le piège évité">
        Aïcha ne s'est pas pris la tête avec la qualité vidéo "broadcast".
        Lumière naturelle de sa fenêtre + smartphone Tecno + micro-cravate.
        Audio = 90 % de la qualité perçue. Image "correcte" suffit largement.
      </Callout>

      <H2 id="semaine3">Semaine 3 — Mise en ligne + premières ventes (manuelles)</H2>

      <H3>Jour 15 : Mise en ligne sur Novakou</H3>
      <P>
        Création du compte vendeur Novakou (5 min). Upload des 16 vidéos
        et 4 PDF (3 heures). Création de la page produit :
      </P>
      <Ul>
        <Li>Titre : "Maîtriser Excel pour reporting mensuel — formation 4 h"</Li>
        <Li>Prix : 25 000 FCFA (prix milieu validé)</Li>
        <Li>Description : 4 modules, 16 leçons, fichiers d'exercice inclus</Li>
        <Li>Image cover : capture d'écran d'un de ses tableaux Excel pro</Li>
        <Li>Méthodes de paiement : Wave + Orange Money + Carte (tout activé)</Li>
      </Ul>

      <H3>Jour 16-17 : Lancement WhatsApp + Status</H3>
      <P>
        Status WhatsApp 15 secondes face caméra : <Em>"Hey ! J'ai créé une
        formation Excel pour reporting pro. 4 h de vidéo, fichiers inclus,
        25 000 FCFA. Lien dans la bio."</Em> Lien court vers la page
        Novakou.
      </P>
      <P>
        Messages directs aux 5 collègues du test initial : "C'est sortit !
        Lien ici, prix de lancement -30 % cette semaine si tu veux".
      </P>
      <P>
        <Strong>Résultat jour 16 : 0 vente. Jour 17 : 1 vente. Jour 18 : 2 ventes.</Strong>
      </P>

      <H3>Jour 18-21 : Posts LinkedIn quotidiens</H3>
      <P>
        Aïcha publie 4 posts LinkedIn dans la semaine, chacun avec un
        mini-conseil Excel + une mention discrète de sa formation. Chaque
        post fait 150-400 vues organiques. <Strong>4 ventes supplémentaires
        sur la semaine.</Strong>
      </P>

      <H3>Jour 21 : Premier témoignage</H3>
      <P>
        Aïcha contacte le premier acheteur par WhatsApp : "Comment tu as
        trouvé la formation ? Tu peux me dire en 30 secondes en audio ce
        qui t'a plu le plus ?". Réponse positive enregistrée → mise sur
        sa page produit Novakou en mode "Avis vérifié". Effet immédiat
        sur la conversion : <Strong>3 ventes supplémentaires les 3 jours
        suivants</Strong> grâce à la preuve sociale.
      </P>

      <H2 id="semaine4">Semaine 4 — Pub Facebook + scale</H2>

      <H3>Jour 23 : Setup Facebook Ads</H3>
      <P>
        Aïcha applique la méthode <A href="/blog/publicite-facebook-instagram-afrique-budget-bas">
        publicité Facebook</A>. Création Business Manager, installation
        Pixel via Novakou, première campagne :
      </P>
      <Ul>
        <Li>Audience : Sénégal, 25-45 ans, intérêts "Excel", "comptabilité", "administration"</Li>
        <Li>Budget : 5 000 FCFA/jour</Li>
        <Li>Créatif : vidéo selfie 15 sec face caméra avec sous-titres</Li>
        <Li>Objectif : Achat / Purchase Conversion</Li>
      </Ul>

      <H3>Jour 24-28 : Premiers résultats pub</H3>
      <P>
        Jour 24 : 1 200 personnes touchées, 38 clics, 0 vente. Jour 25 : 2
        ventes via pub. Jour 26 : 3 ventes. Jour 27 : 4 ventes. Jour 28 :
        5 ventes.
      </P>

      <H3>Jour 29-30 : Scale léger</H3>
      <P>
        Aïcha augmente le budget pub à 7 500 FCFA/jour (suivant la règle
        +20 %/jour max). Jour 29 : 6 ventes. Jour 30 : 7 ventes.
      </P>

      <H2 id="bilan">Bilan chiffré au jour 30</H2>

      <Table
        headers={["Source", "Ventes", "Revenu brut (FCFA)"]}
        rows={[
          ["WhatsApp + entourage direct", "5", "125 000"],
          ["LinkedIn posts organiques", "4", "100 000"],
          ["Bouche-à-oreille (témoignage)", "3", "75 000"],
          ["Publicité Facebook", "20", "500 000"],
          ["TOTAL", "32 ventes", "800 000"],
        ]}
      />

      <P>
        <Strong>Coûts :</Strong>
      </P>
      <Ul>
        <Li>Micro-cravate : 3 500 FCFA</Li>
        <Li>Pub Facebook (5 000 → 7 500 FCFA/j × 8 jours) : 47 500 FCFA</Li>
        <Li>Commission Novakou (10 %) : 80 000 FCFA</Li>
        <Li><Strong>Total coûts : 131 000 FCFA</Strong></Li>
      </Ul>

      <P>
        <Strong>Bénéfice net : 669 000 FCFA</Strong> (≈ 1 020 €) en 30 jours,
        avec 0 capital initial, en parallèle de son job.
      </P>

      <Callout variant="success" title="Ce qu'il faut retenir">
        Aïcha n'a fait <Strong>rien d'exceptionnel</Strong>. Pas de talent
        marketing inné, pas de communauté à 50k followers, pas de budget
        startup. Juste la méthode + la régularité quotidienne pendant
        30 jours.
      </Callout>

      <H2 id="copier">La méthode reproductible (résumé)</H2>
      <Ol>
        <Li>
          <Strong>Sujet :</Strong> compétence pratique que tu maîtrises
          déjà, demandée par ton entourage.
        </Li>
        <Li>
          <Strong>Validation :</Strong> 5 messages WhatsApp à 5 personnes du
          profil cible.
        </Li>
        <Li>
          <Strong>Production :</Strong> 5-10 jours avec smartphone + micro
          à 3-5 000 FCFA.
        </Li>
        <Li>
          <Strong>Mise en ligne :</Strong> page produit Novakou, paiement
          Mobile Money activé, image cover soignée.
        </Li>
        <Li>
          <Strong>Lancement :</Strong> WhatsApp Status + messages directs
          aux 5 personnes du test.
        </Li>
        <Li>
          <Strong>Preuve sociale :</Strong> demander un témoignage au
          premier acheteur dans les 48 h.
        </Li>
        <Li>
          <Strong>Volume :</Strong> 3-4 posts LinkedIn par semaine pendant
          le 1er mois.
        </Li>
        <Li>
          <Strong>Scale :</Strong> pub Facebook à 5 000 FCFA/j dès que tu
          as 1-2 témoignages.
        </Li>
      </Ol>

      <Callout variant="tip" title="Ton défi 30 jours">
        Tu peux faire exactement la même chose. Le sujet n'a pas besoin
        d'être Excel — tout ce qui est concret et résout un problème
        marche. Cuisine, sport, business, langue, marketing, design,
        programmation, gestion de patrimoine, etc.
      </Callout>

      <H2>Pour lancer ton propre défi 30 jours</H2>
      <Ul>
        <Li>
          <A href="/blog/trouver-idee-produit-digital-rentable">
            Trouver TON idée de produit digital
          </A> (méthode complète)
        </Li>
        <Li>
          <A href="/blog/vendre-formation-en-ligne-afrique-2026">
            Guide complet vendre une formation en Afrique
          </A>
        </Li>
        <Li>
          <A href="/inscription?role=vendeur">
            Créer ma boutique Novakou maintenant (gratuit)
          </A>
        </Li>
      </Ul>
    </Prose>
  );
}
