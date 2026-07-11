/**
 * Pages statiques auto-générées d'une boutique vendeur.
 *
 * À la création d'une boutique, ces pages existent automatiquement : leur
 * contenu est construit à partir des infos du vendeur (nom de la boutique,
 * e-mail, téléphone, pays du compte) + d'éventuels champs légaux renseignés
 * dans les paramètres de la boutique. Aucune donnée à saisir n'est requise.
 */

export type ShopStaticSlug =
  | "a-propos"
  | "aide"
  | "contact"
  | "plan-du-site"
  | "mentions-legales"
  | "conditions"
  | "confidentialite";

export const SHOP_STATIC_PAGES: Record<ShopStaticSlug, { title: string; footerGroup: "boutique" | "legales" }> = {
  "a-propos": { title: "À propos", footerGroup: "boutique" },
  aide: { title: "Aide", footerGroup: "boutique" },
  contact: { title: "Contact", footerGroup: "boutique" },
  "plan-du-site": { title: "Plan du site", footerGroup: "boutique" },
  "mentions-legales": { title: "Mentions légales", footerGroup: "legales" },
  conditions: { title: "Conditions d'utilisation", footerGroup: "legales" },
  confidentialite: { title: "Politique de confidentialité", footerGroup: "legales" },
};

export function isShopStaticSlug(s: string): s is ShopStaticSlug {
  return Object.prototype.hasOwnProperty.call(SHOP_STATIC_PAGES, s);
}

/** Infos brutes nécessaires pour résoudre les pages (chargées depuis la DB). */
export interface ShopStaticSource {
  name: string;
  legalName: string | null;
  legalAddress: string | null;
  legalPhone: string | null;
  legalEmail: string | null;
  legalCountry: string | null;
  aboutText: string | null;
  description: string | null;
  updatedAt: Date | string | null;
  owner: { name: string | null; email: string | null; phone: string | null; country: string | null };
}

export interface ShopLegalInfo {
  shopName: string;
  legalName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  country: string;
  updatedLabel: string;
}

/** Résout les infos affichées avec repli sur le compte propriétaire. */
export function resolveShopLegalInfo(src: ShopStaticSource): ShopLegalInfo {
  const email = src.legalEmail || src.owner.email || null;
  const phone = src.legalPhone || src.owner.phone || null;
  const country = src.legalCountry || src.owner.country || "France";
  const d = src.updatedAt ? new Date(src.updatedAt) : new Date(0);
  const updatedLabel = Number.isNaN(d.getTime()) || d.getTime() === 0
    ? ""
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return {
    shopName: src.name,
    legalName: src.legalName || src.name,
    address: src.legalAddress || null,
    phone,
    email,
    country,
    updatedLabel,
  };
}

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "info"; rows: Array<{ label: string; value: string }> }
  | { type: "links"; links: Array<{ label: string; href: string }> };

/**
 * Contenu d'une page, généré à partir des infos de la boutique.
 * `base` = préfixe des liens internes de la boutique ("" sur domaine perso,
 * "/boutique/{slug}" sur la plateforme).
 */
export function buildShopStaticContent(slug: ShopStaticSlug, info: ShopLegalInfo, base: string): { intro?: string; blocks: ContentBlock[] } {
  const contactRows: Array<{ label: string; value: string }> = [
    { label: "Nom de l'entreprise", value: info.legalName },
    ...(info.address ? [{ label: "Adresse", value: info.address }] : []),
    ...(info.country ? [{ label: "Pays", value: info.country }] : []),
    ...(info.phone ? [{ label: "Téléphone", value: info.phone }] : []),
    ...(info.email ? [{ label: "E-mail", value: info.email }] : []),
  ];
  const link = (s: ShopStaticSlug) => `${base}/${s}`;

  switch (slug) {
    case "a-propos":
      return {
        intro: `Bienvenue chez ${info.shopName}.`,
        blocks: [
          { type: "p", text: `${info.legalName} propose des produits et formations digitales, sélectionnés et créés avec soin pour vous aider à progresser. Notre objectif : vous offrir des contenus de qualité, accessibles immédiatement après achat.` },
          { type: "h2", text: "Nous contacter" },
          { type: "p", text: `Une question sur un produit ou une commande ? Écrivez-nous${info.email ? ` à ${info.email}` : ""}${info.phone ? ` ou appelez le ${info.phone}` : ""}. Nous répondons dans les meilleurs délais.` },
        ],
      };
    case "aide":
      return {
        intro: "Besoin d'aide ? Voici les réponses aux questions les plus fréquentes.",
        blocks: [
          { type: "h2", text: "Comment acheter un produit ?" },
          { type: "p", text: "Cliquez sur « Acheter maintenant », choisissez votre moyen de paiement (carte bancaire, Mobile Money…) et validez. L'accès est immédiat après le paiement." },
          { type: "h2", text: "Comment accéder à mon achat ?" },
          { type: "p", text: "Vous recevez un e-mail de confirmation avec le lien d'accès. Vous retrouvez aussi tous vos achats dans votre espace « Mes achats »." },
          { type: "h2", text: "Je n'ai pas reçu mon produit" },
          { type: "p", text: `Vérifiez vos spams. Si le problème persiste, contactez-nous${info.email ? ` à ${info.email}` : ""} en précisant votre e-mail d'achat.` },
          { type: "h2", text: "Puis-je être remboursé ?" },
          { type: "p", text: "Contactez-nous pour toute demande : nous étudions chaque situation au cas par cas, conformément à nos conditions d'utilisation." },
        ],
      };
    case "contact":
      return {
        intro: `Contactez ${info.shopName}.`,
        blocks: [
          { type: "info", rows: contactRows },
          { type: "p", text: "Nous nous efforçons de répondre à toutes les demandes dans les plus brefs délais." },
        ],
      };
    case "plan-du-site":
      return {
        blocks: [
          { type: "h2", text: "Boutique" },
          { type: "links", links: [
            { label: "Accueil de la boutique", href: base || "/" },
            { label: "À propos", href: link("a-propos") },
            { label: "Aide", href: link("aide") },
            { label: "Contact", href: link("contact") },
          ] },
          { type: "h2", text: "Informations légales" },
          { type: "links", links: [
            { label: "Mentions légales", href: link("mentions-legales") },
            { label: "Conditions d'utilisation", href: link("conditions") },
            { label: "Politique de confidentialité", href: link("confidentialite") },
          ] },
        ],
      };
    case "mentions-legales":
      return {
        blocks: [
          { type: "h2", text: "Informations sur l'entreprise" },
          { type: "info", rows: contactRows },
          { type: "h2", text: "Exploitation du site" },
          { type: "p", text: `Ce site est exploité par ${info.legalName}. Les informations présentes sont fournies à titre d'information générale.` },
          { type: "h2", text: "Propriété intellectuelle" },
          { type: "p", text: `Tout le contenu de ce site (textes, graphiques, logos, images, fichiers) est la propriété de ${info.legalName} ou de ses fournisseurs de contenu et est protégé par les lois sur le droit d'auteur et la propriété intellectuelle.` },
          { type: "h2", text: "Clause de non-responsabilité" },
          { type: "p", text: `Les informations sont fournies « en l'état ». ${info.legalName} ne donne aucune garantie, expresse ou implicite, et décline toute autre garantie.` },
          { type: "h2", text: "Droit applicable" },
          { type: "p", text: `Ces mentions et votre utilisation du site sont régies par les lois de ${info.country}. Tout litige sera soumis à la juridiction compétente de ${info.country}.` },
          { type: "h2", text: "Modifications" },
          { type: "p", text: "Nous nous réservons le droit de modifier ces mentions à tout moment. Les modifications prennent effet dès leur publication sur le site." },
        ],
      };
    case "conditions":
      return {
        blocks: [
          { type: "h2", text: "1. Objet" },
          { type: "p", text: `Les présentes conditions régissent l'utilisation de la boutique ${info.shopName} et l'achat des produits qui y sont proposés.` },
          { type: "h2", text: "2. Produits et prix" },
          { type: "p", text: "Les produits sont des contenus numériques accessibles après paiement. Les prix sont indiqués en devise locale, toutes taxes éventuelles comprises." },
          { type: "h2", text: "3. Commande et paiement" },
          { type: "p", text: "Toute commande implique l'acceptation des présentes conditions. Le paiement s'effectue via les moyens proposés au moment de l'achat. L'accès au produit est délivré après confirmation du paiement." },
          { type: "h2", text: "4. Droit de rétractation" },
          { type: "p", text: "S'agissant de contenus numériques fournis immédiatement, le droit de rétractation peut ne pas s'appliquer une fois l'accès délivré. Toute demande est étudiée au cas par cas." },
          { type: "h2", text: "5. Responsabilité" },
          { type: "p", text: `${info.legalName} met tout en œuvre pour assurer l'exactitude des informations mais ne saurait être tenu responsable d'une utilisation inadaptée des contenus.` },
          { type: "h2", text: "6. Contact" },
          { type: "p", text: `Pour toute question relative à ces conditions${info.email ? `, écrivez à ${info.email}` : ""}.` },
        ],
      };
    case "confidentialite":
      return {
        blocks: [
          { type: "h2", text: "Données collectées" },
          { type: "p", text: "Lors d'un achat, nous collectons les informations nécessaires au traitement de votre commande : nom, adresse e-mail et, le cas échéant, numéro de téléphone." },
          { type: "h2", text: "Utilisation des données" },
          { type: "p", text: "Vos données servent uniquement à traiter vos commandes, vous donner accès à vos achats et vous contacter en cas de besoin. Elles ne sont jamais revendues." },
          { type: "h2", text: "Conservation" },
          { type: "p", text: "Vos données sont conservées le temps nécessaire au traitement de vos commandes et au respect de nos obligations légales." },
          { type: "h2", text: "Vos droits" },
          { type: "p", text: `Vous pouvez à tout moment demander l'accès, la rectification ou la suppression de vos données${info.email ? ` en écrivant à ${info.email}` : ""}.` },
          { type: "h2", text: "Cookies" },
          { type: "p", text: "Ce site peut utiliser des cookies pour améliorer votre expérience et mesurer l'audience. Vous pouvez les désactiver dans les réglages de votre navigateur." },
        ],
      };
  }
}
