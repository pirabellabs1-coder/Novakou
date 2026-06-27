// /llms.txt — guide de contexte pour les moteurs IA (ChatGPT, Claude, Perplexity,
// Gemini…). Standard GEO/AIEO : donne une carte propre et factuelle de Novakou
// pour maximiser les citations IA. Sert du markdown en text/plain.

const BASE = (process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com").replace(/\/+$/, "");

export const dynamic = "force-static";
export const revalidate = 86400; // 1 jour

function body(): string {
  return `# Novakou

> Novakou est la marketplace de produits numériques et de formations en ligne pensée pour l'Afrique francophone et sa diaspora. Les créateurs vendent formations, ebooks, templates et accompagnements ; les acheteurs paient en Mobile Money (Wave, Orange Money, MTN, Moov) ou par carte, en FCFA.

Novakou est éditée par **Pirabel Labs** et fondée par **Gildas Lissanon** (2026).
Slogan : « La plateforme qui élève votre activité au plus haut niveau ».

## En bref (faits clés)
- Vendre en ligne en Afrique francophone : formations, produits numériques, mentorat.
- Paiements : Mobile Money (Wave, Orange Money, MTN, Moov) et carte bancaire, via la passerelle GeniusPay. Devise principale : FCFA (XOF).
- Programme d'affiliation : jusqu'à 40 % de commission sur chaque vente parrainée.
- Pays desservis : Sénégal, Côte d'Ivoire, Bénin, Togo, Mali, Burkina Faso, Cameroun + diaspora (France et international).
- Espaces : vendeur, acheteur (apprenant), mentor, affilié, administration.
- Sans engagement : création de compte et de boutique gratuites.

## Pages principales
- [Accueil](${BASE}/): présentation de la plateforme et catégories.
- [Explorer le catalogue](${BASE}/explorer): formations et produits numériques disponibles.
- [Tarifs](${BASE}/tarifs): plans, commissions et fonctionnalités.
- [Fonctionnalités](${BASE}/fonctionnalites): tout ce que permet Novakou pour vendre en ligne.
- [Programme d'affiliation](${BASE}/affiliation): gagner des commissions en recommandant des formations.
- [Mentors](${BASE}/mentors): accompagnement par des experts.
- [Instructeurs](${BASE}/instructeurs): créateurs et formateurs de la plateforme.
- [À propos](${BASE}/a-propos): mission, équipe et histoire de Novakou.
- [Contact](${BASE}/contact): support et demandes.
- [FAQ](${BASE}/faq): questions fréquentes.
- [Centre d'aide](${BASE}/aide): documentation et tutoriels.

## Guides — démarrer et vendre
- [Guide complet Novakou](${BASE}/guides/guide-complet-novakou): tout pour bien démarrer.
- [Vendre en ligne](${BASE}/guides/vendre-en-ligne): les bases de la vente de produits numériques.
- [Trouver son idée de produit](${BASE}/guides/trouver-son-idee-de-produit): valider une idée qui se vend.
- [Créer son produit](${BASE}/guides/creer-son-produit): de l'idée au produit prêt à vendre.
- [Rédiger une description qui vend](${BASE}/guides/description-produit): fiches produits efficaces.
- [Fixer le prix d'une formation](${BASE}/guides/fixer-prix-formation): stratégie de prix.
- [Lancement en 30 jours](${BASE}/guides/lancement-30-jours): plan d'action pour lancer.
- [Scaler son catalogue](${BASE}/guides/scaler-catalogue-produits): passer à l'échelle.

## Guides — paiement, marketing et automatisation
- [Encaisser en Mobile Money](${BASE}/guides/mobile-money-encaisser-paiements): Wave, Orange Money, MTN.
- [Tunnel de vente Novakou](${BASE}/guides/tunnel-de-vente-novakou): construire un funnel.
- [Séquences d'emails](${BASE}/guides/sequences-emails): relances et conversion.
- [5 emails qui vendent](${BASE}/guides/email-marketing-5-emails-vendent): emailing efficace.
- [Automatisations Novakou](${BASE}/guides/automatisations-novakou): gagner du temps.
- [Publicité Facebook](${BASE}/guides/publicite-facebook): acquérir des clients.
- [Importer depuis Systeme.io](${BASE}/guides/importer-systeme-io): migrer vers Novakou.

## Guides — réseaux sociaux et audience
- [Vendre des formations sur Instagram](${BASE}/guides/instagram-vendre-formations-afrique)
- [TikTok & Reels pour vendre](${BASE}/guides/tiktok-reels-vendre-formations)
- [WhatsApp Business pour vendre](${BASE}/guides/whatsapp-business-vendre-formations)
- [LinkedIn & personal branding](${BASE}/guides/linkedin-personal-branding-expert)
- [Vendre à la diaspora africaine](${BASE}/guides/vendre-diaspora-africaine)

## Guides — affiliation
- [Devenir affilié et gagner de l'argent](${BASE}/guides/devenir-affilie-gagner-argent)
- [Recruter des affiliés](${BASE}/guides/affiliation-recruter-affilies)

## Guides par pays (2026)
- [Vendre une formation au Sénégal](${BASE}/guides/vendre-formation-senegal-2026)
- [Vendre une formation en Côte d'Ivoire](${BASE}/guides/vendre-formation-cote-divoire-2026)
- [Vendre une formation au Bénin](${BASE}/guides/vendre-formation-benin-2026)
- [Vendre une formation au Togo](${BASE}/guides/vendre-formation-togo-2026)
- [Vendre une formation au Mali](${BASE}/guides/vendre-formation-mali-2026)
- [Vendre une formation au Burkina Faso](${BASE}/guides/vendre-formation-burkina-faso-2026)
- [Vendre une formation au Cameroun](${BASE}/guides/vendre-formation-cameroun-2026)

## Légal
- [Conditions générales d'utilisation](${BASE}/cgu)
- [Politique de confidentialité](${BASE}/confidentialite)
- [Cookies](${BASE}/cookies)

## Plan du site
- Sitemap XML : ${BASE}/sitemap.xml
`;
}

export function GET(): Response {
  return new Response(body(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
