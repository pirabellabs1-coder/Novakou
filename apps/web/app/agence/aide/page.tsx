"use client";

import { useState } from "react";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
interface HelpCategory {
  icon: string;
  title: string;
  description: string;
  articles: number;
  color: string;
}

const HELP_CATEGORIES: HelpCategory[] = [
  {
    icon: "groups",
    title: "Gestion d'équipe",
    description:
      "Inviter des membres, gérer les rôles, assigner des tâches et suivre la charge de travail.",
    articles: 12,
    color: "text-primary",
  },
  {
    icon: "folder_open",
    title: "Projets & Services",
    description:
      "Créer et publier des services, gérer les projets, suivre les commandes et les livrables.",
    articles: 18,
    color: "text-blue-400",
  },
  {
    icon: "payments",
    title: "Finances",
    description:
      "Facturation, retraits, commissions, portefeuille multi-devises et rapports financiers.",
    articles: 15,
    color: "text-emerald-400",
  },
  {
    icon: "handshake",
    title: "Sous-traitance",
    description:
      "Trouver des freelances externes, passer des commandes et gérer les missions sous-traitées.",
    articles: 8,
    color: "text-amber-400",
  },
  {
    icon: "settings",
    title: "Paramètres",
    description:
      "Configurer le profil agence, notifications, moyens de paiement et préférences générales.",
    articles: 10,
    color: "text-purple-400",
  },
  {
    icon: "shield",
    title: "Sécurité",
    description:
      "Double authentification, sessions actives, KYC agence et protection du compte.",
    articles: 7,
    color: "text-red-400",
  },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "1",
    question: "Comment inviter un nouveau membre dans mon agence ?",
    answer:
      "Rendez-vous dans l'onglet Équipe, puis cliquez sur \"Inviter un membre\". Entrez l'adresse email du freelance. Il recevra une invitation par email et pourra rejoindre votre agence tout en conservant son profil individuel. Vous pourrez ensuite lui attribuer un rôle (Admin, Manager, Membre ou Commercial).",
    category: "Gestion d'équipe",
  },
  {
    id: "2",
    question: "Quelle est la commission appliquée sur le plan Agence ?",
    answer:
      "Le plan Agence bénéficie d'une commission réduite à 8% sur toutes les transactions, contre 20% pour le plan Gratuit. Cette commission est prélevée automatiquement sur chaque paiement reçu avant le versement dans votre portefeuille. Vous pouvez aussi définir une commission interne pour redistribuer les revenus à vos membres.",
    category: "Finances",
  },
  {
    id: "3",
    question: "Comment publier un service sous la marque de l'agence ?",
    answer:
      "Allez dans l'onglet Services et cliquez sur \"Nouveau Service\". Le wizard de création vous guidera en 4 étapes : informations de base, forfaits (Basique/Standard/Premium), extras et FAQ, puis galerie et publication. Le service sera automatiquement rattaché à votre agence et visible sous votre marque dans la marketplace.",
    category: "Projets & Services",
  },
  {
    id: "4",
    question: "Comment fonctionne le système d'escrow (séquestre) ?",
    answer:
      "Lorsqu'un client passe une commande, les fonds sont automatiquement bloqués en séquestre. Ils ne sont libérés dans votre portefeuille qu'une fois la livraison validée par le client. En cas de litige, les fonds restent gelés jusqu'à résolution par l'équipe FreelanceHigh. Ce système garantit la sécurité financière pour les deux parties.",
    category: "Finances",
  },
  {
    id: "5",
    question: "Puis-je sous-traiter une commande à un freelance externe ?",
    answer:
      "Oui, depuis l'onglet Sous-traitance, vous pouvez rechercher des freelances sur la plateforme et leur passer une commande directement depuis l'espace agence. La facturation est automatisée : vous facturez le client final avec votre marge, et le freelance externe reçoit le montant convenu. Le suivi des missions sous-traitées est centralisé dans votre tableau de bord.",
    category: "Sous-traitance",
  },
  {
    id: "6",
    question: "Comment activer la double authentification (2FA) ?",
    answer:
      "Rendez-vous dans Paramètres > Sécurité > Double authentification. Vous pouvez activer le 2FA via Google Authenticator (code TOTP) ou par SMS. Nous recommandons fortement d'activer cette option pour protéger votre compte agence, surtout si plusieurs membres y ont accès. Chaque membre doit activer son propre 2FA sur son compte individuel.",
    category: "Sécurité",
  },
  {
    id: "7",
    question: "Comment effectuer un retrait depuis le portefeuille agence ?",
    answer:
      "Allez dans Finances > Retrait. Choisissez le montant et la méthode : virement SEPA (2-3 jours ouvrés), Orange Money, Wave, MTN Mobile Money (instantané), PayPal ou Wise. Le montant minimum de retrait est de 10 EUR. Les retraits Mobile Money sont disponibles dans 17 pays d'Afrique francophone via CinetPay.",
    category: "Finances",
  },
  {
    id: "8",
    question: "Quel est le quota de stockage sur le plan Agence ?",
    answer:
      "Le plan Agence inclut 50 GB de stockage dans l'espace Ressources & Médias. Vous pouvez y stocker des fichiers de projet, des briefs clients, des assets marketing et des livrables. Les fichiers sont organisables par dossiers et accessibles à toute l'équipe selon les permissions. Si vous dépassez le quota, vous pouvez upgrader ou archiver d'anciens fichiers.",
    category: "Paramètres",
  },
];

const USEFUL_LINKS = [
  { label: "Conditions Générales d'Utilisation", icon: "description", href: "/cgu" },
  { label: "Politique de confidentialité", icon: "privacy_tip", href: "/confidentialite" },
  { label: "Guide de démarrage Agence", icon: "rocket_launch", href: "#" },
  { label: "Documentation API", icon: "code", href: "#" },
  { label: "Blog FreelanceHigh", icon: "article", href: "/blog" },
  { label: "Statut des services", icon: "monitor_heart", href: "/status" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AgenceAide() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const { addToast } = useToastStore();

  // Filter FAQ by search
  const filteredFaq = FAQ_ITEMS.filter(
    (item) =>
      !search ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Filter categories by search
  const filteredCategories = HELP_CATEGORIES.filter(
    (cat) =>
      !search ||
      cat.title.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())
  );

  function toggleFaq(id: string) {
    setOpenFaq((prev) => (prev === id ? null : id));
  }

  function handleSubmitTicket() {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      addToast("error", "Veuillez remplir le sujet et le message.");
      return;
    }
    addToast(
      "success",
      "Ticket envoyé avec succès. Notre équipe vous répondra sous 24h."
    );
    setTicketSubject("");
    setTicketMessage("");
  }

  function handleLiveChat() {
    addToast("info", "Ouverture du chat en direct...");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Centre d&apos;aide</h1>
        <p className="text-slate-400 text-sm mt-1">
          Trouvez des réponses à vos questions ou contactez notre équipe
          support.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">
          search
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans l'aide (ex : membres, retrait, commission...)"
          className="w-full pl-12 pr-4 py-3.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Help categories */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Catégories d&apos;aide
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCategories.map((cat) => (
            <button
              key={cat.title}
              onClick={() => {
                setSearch(cat.title);
                addToast("info", `Filtrage par : ${cat.title}`);
              }}
              className="bg-neutral-dark rounded-xl border border-border-dark p-5 text-left hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-background-dark flex items-center justify-center flex-shrink-0">
                  <span
                    className={cn(
                      "material-symbols-outlined text-xl",
                      cat.color
                    )}
                  >
                    {cat.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">
                    {cat.articles} articles
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {filteredCategories.length === 0 && (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-3xl text-slate-600 mb-2 block">
              search_off
            </span>
            <p className="text-sm text-slate-400">
              Aucune catégorie ne correspond à votre recherche.
            </p>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Questions fréquentes
        </p>
        <div className="space-y-2">
          {filteredFaq.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(item.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-background-dark/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
                    help
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {item.question}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {item.category}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "material-symbols-outlined text-slate-500 text-lg transition-transform duration-200 flex-shrink-0 ml-2",
                    openFaq === item.id ? "rotate-180" : "rotate-0"
                  )}
                >
                  expand_more
                </span>
              </button>
              {openFaq === item.id && (
                <div className="px-4 pb-4 pt-0">
                  <div className="pl-9 border-l-2 border-primary/20 ml-1">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {item.answer}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <p className="text-[10px] text-slate-500">
                        Cette réponse vous a-t-elle aidé ?
                      </p>
                      <button
                        onClick={() =>
                          addToast("success", "Merci pour votre retour !")
                        }
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          thumb_up
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          addToast(
                            "info",
                            "Nous améliorerons cette réponse. Merci !"
                          )
                        }
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          thumb_down
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredFaq.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-slate-600 mb-2 block">
                search_off
              </span>
              <p className="text-sm text-slate-400">
                Aucune question ne correspond à &quot;{search}&quot;.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact support */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ticket form */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-lg">
              confirmation_number
            </span>
            <h2 className="font-bold text-white">Ouvrir un ticket</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                Sujet
              </label>
              <input
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Résumez votre problème en une phrase"
                className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                Message
              </label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                rows={4}
                placeholder="Décrivez votre problème en détail..."
                className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none"
              />
            </div>
            <button
              onClick={handleSubmitTicket}
              className="w-full py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              Envoyer le ticket
            </button>
          </div>
        </div>

        {/* Live chat + support info */}
        <div className="space-y-4">
          {/* Live chat CTA */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-emerald-400 text-lg">
                chat
              </span>
              <h2 className="font-bold text-white">Chat en direct</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                En ligne
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Discutez en temps réel avec un membre de notre équipe support.
              Temps de réponse moyen : 2 minutes.
            </p>
            <button
              onClick={handleLiveChat}
              className="w-full py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">
                support_agent
              </span>
              Démarrer une conversation
            </button>
          </div>

          {/* Support team info */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-blue-400 text-lg">
                info
              </span>
              <h2 className="font-bold text-white">Informations support</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Temps de réponse moyen
                </span>
                <span className="text-sm font-semibold text-white">
                  &lt; 2h (tickets)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Horaires d&apos;ouverture
                </span>
                <span className="text-sm font-semibold text-white">
                  Lun-Ven, 8h-20h (UTC+1)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Support prioritaire
                </span>
                <span className="text-sm font-semibold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    check_circle
                  </span>
                  Inclus (Plan Agence)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Email support</span>
                <span className="text-sm font-semibold text-white">
                  support@freelancehigh.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Useful links */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Liens utiles
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {USEFUL_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() =>
                addToast("info", `Navigation vers : ${link.label}`)
              }
              className="bg-neutral-dark rounded-xl border border-border-dark p-4 text-center hover:border-primary/40 transition-all group"
            >
              <span className="material-symbols-outlined text-2xl text-slate-500 group-hover:text-primary transition-colors mb-2 block">
                {link.icon}
              </span>
              <p className="text-xs text-slate-400 group-hover:text-white transition-colors font-medium leading-tight">
                {link.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
