"use client";

import { useState } from "react";
import Link from "next/link";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  title: string;
  icon: string;
  color: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    title: "General",
    icon: "help",
    color: "text-primary",
    items: [
      { q: "Qu'est-ce que FreelanceHigh ?", a: "FreelanceHigh est une plateforme de freelancing internationale, pensee pour l'Afrique francophone, la diaspora et le marche international. Elle met en relation freelances, clients et agences." },
      { q: "Comment fonctionne FreelanceHigh ?", a: "Les freelances publient des services, les clients commandent. Les paiements sont securises par un systeme d'escrow (sequestre). Les fonds sont liberes apres validation de la livraison." },
      { q: "FreelanceHigh est-il gratuit ?", a: "L'inscription est gratuite. Un plan Gratuit avec 20% de commission est disponible. Des plans Pro (15%), Business (10%) et Agence (8%) offrent plus de fonctionnalites." },
      { q: "Dans quels pays FreelanceHigh est-il disponible ?", a: "FreelanceHigh est accessible dans le monde entier, avec un focus particulier sur l'Afrique francophone (Senegal, Cote d'Ivoire, Cameroun, etc.), la France et la diaspora." },
      { q: "Quelles langues sont supportees ?", a: "Francais (principal) et anglais. L'arabe et l'espagnol sont prevus dans les prochaines versions." },
    ],
  },
  {
    title: "Freelances",
    icon: "person",
    color: "text-emerald-400",
    items: [
      { q: "Comment devenir freelance sur FreelanceHigh ?", a: "Inscrivez-vous en choisissant le role 'Freelance', completez votre profil et publiez votre premier service. C'est gratuit." },
      { q: "Combien de services puis-je publier ?", a: "Le plan Gratuit permet 3 services actifs. Le plan Pro permet 15, et les plans Business/Agence sont illimites." },
      { q: "Comment suis-je paye ?", a: "Apres validation de votre livraison par le client, les fonds sont liberes dans votre portefeuille. Vous pouvez retirer via virement SEPA, Mobile Money (Orange, Wave, MTN), PayPal ou Wise." },
      { q: "Quelle est la commission FreelanceHigh ?", a: "Elle depend de votre plan : 20% (Gratuit), 15% (Pro a 15€/mois), 10% (Business a 45€/mois) ou 8% (Agence a 99€/mois)." },
      { q: "Comment obtenir un badge Verifie ?", a: "Completez la verification KYC : email verifie (niveau 1), telephone (niveau 2), piece d'identite (niveau 3) et verification professionnelle (niveau 4 — badge Elite)." },
    ],
  },
  {
    title: "Clients",
    icon: "business",
    color: "text-blue-400",
    items: [
      { q: "Comment commander un service ?", a: "Parcourez la marketplace, choisissez un service et un forfait (Basique, Standard, Premium), puis procedez au paiement. Le freelance sera notifie immediatement." },
      { q: "Mon argent est-il en securite ?", a: "Oui. Tous les paiements passent par un systeme d'escrow. Les fonds ne sont liberes au freelance qu'apres votre validation de la livraison." },
      { q: "Que faire si je ne suis pas satisfait ?", a: "Vous pouvez demander une revision (selon le forfait choisi) ou ouvrir un litige. Notre equipe d'arbitrage intervient pour trouver une solution equitable." },
      { q: "Puis-je publier une offre de projet ?", a: "Oui ! Publiez une offre avec votre budget et vos criteres. Les freelances postuleront avec leur proposition et tarif." },
      { q: "Quels moyens de paiement sont acceptes ?", a: "Carte bancaire (Visa, Mastercard), Mobile Money (Orange, Wave, MTN), PayPal, virement SEPA. Les cryptos (USDC/USDT) arrivent en V4." },
    ],
  },
  {
    title: "Agences",
    icon: "business_center",
    color: "text-amber-400",
    items: [
      { q: "Comment creer une agence ?", a: "Choisissez le role 'Agence' lors de l'inscription. Renseignez le nom, le secteur et la taille de votre agence, puis invitez vos membres." },
      { q: "Puis-je inviter des freelances existants ?", a: "Oui, invitez-les par email. Ils gardent leur profil individuel tout en etant membres de votre agence." },
      { q: "Comment fonctionne la facturation agence ?", a: "Les revenus des services agence sont centralises. Vous definissez la commission interne par membre et pouvez effectuer des retraits collectifs." },
      { q: "Combien de membres peut avoir une agence ?", a: "Le plan Agence (99€/mois) permet jusqu'a 20 membres. Contactez-nous pour des besoins superieurs." },
    ],
  },
  {
    title: "Paiements",
    icon: "payments",
    color: "text-cyan-400",
    items: [
      { q: "Quelle est la devise par defaut ?", a: "L'euro (EUR). Vous pouvez afficher les prix en FCFA, USD, GBP ou MAD grace au selecteur de devise." },
      { q: "Quand recois-je mes fonds ?", a: "Les fonds sont liberes dans votre portefeuille des que le client valide la livraison. Les retraits sont traites sous 1 a 3 jours ouvrables." },
      { q: "Le Mobile Money est-il supporte ?", a: "Oui ! Orange Money, Wave et MTN Mobile Money sont disponibles pour les paiements et les retraits dans 17 pays d'Afrique francophone." },
    ],
  },
  {
    title: "Securite",
    icon: "shield",
    color: "text-red-400",
    items: [
      { q: "Mes données sont-elles protégées ?", a: "Oui. Nous utilisons le chiffrement SSL/TLS, le stockage sécurisé des documents KYC, et nous sommes conformes au RGPD." },
      { q: "Comment fonctionne le système de litiges ?", a: "En cas de désaccord, ouvrez un litige. Les fonds sont gelés. Notre équipe examine les preuves et rend un verdict équitable." },
      { q: "Puis-je activer la double authentification ?", a: "Oui, dans Paramètres > Sécurité. Nous supportons Google Authenticator (TOTP) et les codes SMS." },
    ],
  },
];

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  function toggleItem(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredCategories = FAQ_DATA.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-background-dark">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Questions frequentes</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Trouvez rapidement les reponses a vos questions sur FreelanceHigh.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une question..."
              className="w-full bg-neutral-dark border border-border-dark rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* FAQ categories */}
        <div className="space-y-8">
          {filteredCategories.map((cat) => (
            <div key={cat.title}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`material-symbols-outlined ${cat.color}`}>{cat.icon}</span>
                <h2 className="text-xl font-bold text-white">{cat.title}</h2>
                <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                  {cat.items.length}
                </span>
              </div>
              <div className="bg-neutral-dark rounded-2xl border border-border-dark divide-y divide-border-dark">
                {cat.items.map((item, i) => {
                  const key = `${cat.title}-${i}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="text-sm font-semibold text-white pr-4">{item.q}</span>
                        <span
                          className={`material-symbols-outlined text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        >
                          expand_more
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 -mt-1">
                          <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-slate-500 mb-3 block">search_off</span>
              <p className="text-slate-400">Aucune question trouvee pour &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-neutral-dark rounded-2xl border border-primary/20 p-8 text-center mt-12">
          <h2 className="text-xl font-bold text-white mb-3">Vous n&apos;avez pas trouve votre reponse ?</h2>
          <p className="text-slate-400 mb-6">Contactez notre equipe support pour une aide personnalisee.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Nous contacter
            </Link>
            <Link
              href="/aide"
              className="inline-flex items-center gap-2 bg-white/5 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors border border-border-dark"
            >
              Centre d&apos;aide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
