"use client";

import { useState, useEffect } from "react";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/client/EmptyState";

const CATEGORIES = [
  { icon: "payments", title: "Paiements & Facturation", value: "paiements", desc: "Retraits, dépôts, factures et litiges financiers." },
  { icon: "task_alt", title: "Gestion des Projets", value: "projets", desc: "Suivi des commandes, livraisons et révisions." },
  { icon: "shield_person", title: "Sécurité & Profil", value: "securite", desc: "Paramètres, vérification d'identité et sécurité." },
  { icon: "group", title: "Trouver un Freelance", value: "freelance", desc: "Recherche, filtres, favoris et recommandations." },
  { icon: "gavel", title: "Litiges & Résolution", value: "litiges", desc: "Ouverture, suivi et résolution de litiges." },
  { icon: "help", title: "Utiliser la Plateforme", value: "plateforme", desc: "Premiers pas, navigation et fonctionnalités." },
];

const FAQS = [
  { q: "Comment puis-je modifier mon adresse de paiement ?", a: "Rendez-vous dans Paramètres > Paiements & Facturation pour modifier vos informations de paiement. Les changements sont effectifs immédiatement." },
  { q: "Que faire si un freelance ne répond plus à mes messages ?", a: "Si un freelance ne répond pas dans les 48h, vous pouvez nous contacter via le support ou ouvrir un litige depuis la page Commandes." },
  { q: "Quels sont les frais de service de FreelanceHigh ?", a: "Les frais de service sont de 3% sur chaque transaction pour le client. Ce taux finance l'escrow, la médiation et la sécurité de la plateforme." },
  { q: "Comment devenir un client vérifié ?", a: "Complétez votre profil entreprise, vérifiez votre email et votre téléphone. La vérification KYC niveau 3 est optionnelle mais augmente votre crédibilité." },
  { q: "Comment fonctionne le système d'escrow ?", a: "Lorsque vous passez une commande, les fonds sont bloqués en escrow. Ils ne sont libérés au freelance qu'après votre validation de la livraison." },
  { q: "Puis-je demander un remboursement ?", a: "Oui, vous pouvez demander un remboursement en ouvrant un litige. Notre équipe examinera votre demande et rendra une décision sous 48h à 7 jours." },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ouvert: { label: "Ouvert", color: "bg-blue-500/10 text-blue-400" },
  en_cours: { label: "En cours", color: "bg-amber-500/10 text-amber-400" },
  resolu: { label: "Resolu", color: "bg-green-500/10 text-green-400" },
  ferme: { label: "Ferme", color: "bg-slate-500/10 text-slate-400" },
};

export default function ClientHelp() {
  const [search, setSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", category: "plateforme", message: "", priority: "normale" });
  const [showTickets, setShowTickets] = useState(false);

  const { addToast } = useToastStore();
  const { supportTickets, syncSupportTickets, createSupportTicket, loading } = useClientStore();

  useEffect(() => {
    syncSupportTickets();
  }, [syncSupportTickets]);

  const filteredFaqs = search.trim()
    ? FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
    : FAQS;

  async function submitTicket() {
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      addToast("error", "Veuillez remplir le sujet et le message");
      return;
    }
    setSubmitting(true);
    const success = await createSupportTicket({
      subject: ticketForm.subject,
      category: ticketForm.category,
      message: ticketForm.message,
      priority: ticketForm.priority,
    });
    setSubmitting(false);
    if (success) {
      addToast("success", "Ticket cree avec succes ! Nous vous repondrons sous 24h.");
      setTicketForm({ subject: "", category: "plateforme", message: "", priority: "normale" });
      setShowTicketForm(false);
      setShowTickets(true);
    } else {
      addToast("error", "Erreur lors de la creation du ticket. Reessayez.");
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-primary/5 rounded-2xl border border-primary/10 p-8 text-center">
        <h1 className="text-3xl font-black text-white mb-2">Centre d&apos;Aide et Support</h1>
        <p className="text-slate-400 max-w-xl mx-auto mb-6">Comment pouvons-nous vous aider aujourd&apos;hui ? Recherchez dans notre base de connaissances ou parcourez les categories ci-dessous.</p>

        <div className="max-w-2xl mx-auto relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ex : Comment retirer mes gains ?"
            className="w-full pl-12 pr-32 py-4 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 shadow-xl shadow-primary/5"
          />
          <button
            onClick={() => {/* Search is instant via filtering */}}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary text-background-dark text-sm font-bold rounded-lg hover:brightness-110 transition-all"
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Categories d&apos;aide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setSearch(c.title)}
              className="bg-neutral-dark rounded-xl border border-border-dark p-5 text-left hover:border-primary/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">{c.icon}</span>
              </div>
              <p className="font-bold text-white text-sm">{c.title}</p>
              <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">quiz</span>
            Questions frequentes
          </h2>
        </div>
        <div className="space-y-2">
          {filteredFaqs.map((f, i) => (
            <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-background-dark/30 transition-colors"
              >
                <span className="text-sm font-semibold text-white pr-4">{f.q}</span>
                <span className={cn("material-symbols-outlined text-slate-400 transition-transform flex-shrink-0", expandedFaq === i && "rotate-180")}>
                  expand_more
                </span>
              </button>
              {expandedFaq === i && (
                <div className="px-5 pb-4 border-t border-border-dark pt-3">
                  <p className="text-sm text-slate-400 leading-relaxed">{f.a}</p>
                </div>
              )}
            </div>
          ))}
          {filteredFaqs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">Aucun resultat pour &quot;{search}&quot;</p>
            </div>
          )}
        </div>
      </div>

      {/* My tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">confirmation_number</span>
            Mes tickets de support
            {supportTickets.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{supportTickets.length}</span>
            )}
          </h2>
          <button
            onClick={() => setShowTickets(!showTickets)}
            className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
          >
            {showTickets ? "Masquer" : "Afficher"}
            <span className={cn("material-symbols-outlined text-sm transition-transform", showTickets && "rotate-180")}>expand_more</span>
          </button>
        </div>

        {showTickets && (
          <div className="space-y-3">
            {loading.supportTickets ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
                    <div className="h-4 bg-border-dark rounded w-1/3 mb-2" />
                    <div className="h-3 bg-border-dark rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : supportTickets.length === 0 ? (
              <EmptyState
                icon="confirmation_number"
                title="Aucun ticket"
                description="Vous n'avez pas encore cree de ticket de support."
                actionLabel="Creer un ticket"
                onAction={() => { setShowTicketForm(true); setShowTickets(false); }}
              />
            ) : (
              supportTickets.map(ticket => (
                <div key={ticket.id} className="bg-neutral-dark rounded-xl border border-border-dark p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{ticket.subject}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(ticket.createdAt)}</p>
                    </div>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", STATUS_MAP[ticket.status]?.color || "bg-slate-500/10 text-slate-400")}>
                      {STATUS_MAP[ticket.status]?.label || ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{ticket.message}</p>
                  {ticket.responses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border-dark">
                      <p className="text-xs text-slate-500 mb-1">{ticket.responses.length} reponse(s)</p>
                      <p className="text-sm text-slate-300">{ticket.responses[ticket.responses.length - 1].message}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="bg-neutral-dark rounded-2xl border border-border-dark p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white mb-2">Vous ne trouvez pas la reponse ?</h2>
          <p className="text-slate-400 text-sm">Nos experts sont disponibles pour vous accompagner.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => addToast("info", "Chat en direct bientot disponible en V2")}
            className="py-3 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">forum</span>
            Chat en direct
          </button>
          <button
            onClick={() => { setShowTicketForm(true); document.getElementById("ticket-form")?.scrollIntoView({ behavior: "smooth" }); }}
            className="py-3 border border-border-dark text-white text-sm font-bold rounded-xl hover:bg-background-dark transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">confirmation_number</span>
            Ouvrir un ticket
          </button>
        </div>

        {/* Ticket form */}
        {showTicketForm && (
          <div id="ticket-form" className="bg-background-dark rounded-xl border border-border-dark p-5 space-y-4">
            <p className="font-bold text-white text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">mail</span>
              Nouveau ticket de support
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Categorie</label>
                <select
                  value={ticketForm.category}
                  onChange={e => setTicketForm(t => ({ ...t, category: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Priorite</label>
                <select
                  value={ticketForm.priority}
                  onChange={e => setTicketForm(t => ({ ...t, priority: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Sujet</label>
              <input
                value={ticketForm.subject}
                onChange={e => setTicketForm(t => ({ ...t, subject: e.target.value }))}
                placeholder="Decrivez brievement votre probleme"
                className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Message</label>
              <textarea
                value={ticketForm.message}
                onChange={e => setTicketForm(t => ({ ...t, message: e.target.value }))}
                rows={4}
                placeholder="Expliquez votre probleme en detail..."
                className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={submitTicket}
                disabled={submitting}
                className="px-6 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <span className="material-symbols-outlined text-lg animate-spin">hourglass_empty</span>}
                {submitting ? "Envoi en cours..." : "Envoyer le ticket"}
              </button>
              <button
                onClick={() => setShowTicketForm(false)}
                className="px-4 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
