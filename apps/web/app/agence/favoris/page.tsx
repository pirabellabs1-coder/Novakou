"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";

// ─── Types ───────────────────────────────────────────────────────────────────

type FreelanceFavori = {
  id: string;
  initiales: string;
  nom: string;
  titre: string;
  note: number;
  avis: number;
  verifie: boolean;
  liste: string;
};

type ServiceSauvegarde = {
  id: string;
  titre: string;
  prestataire: string;
  prestataireinitiales: string;
  note: number;
  avis: number;
  prix: number;
  couleurGradient: string;
  liste: string;
};

type ListeProjet = {
  id: string;
  nom: string;
  elements: number;
  couleurIcon: string;
  icon: string;
};

// ─── Sous-composants ─────────────────────────────────────────────────────────

function EtoileRating({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={cn("w-3 h-3", i <= Math.round(note) ? "text-yellow-400" : "text-slate-600")} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function CarteFreelance({ freelance, onRetirer }: { freelance: FreelanceFavori; onRetirer: (id: string) => void }) {
  return (
    <div className="relative bg-background-dark/50 border border-border-dark rounded-xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary/40 transition-all group">
      <button onClick={() => onRetirer(freelance.id)} className="absolute top-3 right-3 text-primary hover:text-red-400 transition-colors" title="Retirer des favoris">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
          <span className="text-lg font-black text-primary">{freelance.initiales}</span>
        </div>
        {freelance.verifie && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background-dark">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <p className="font-bold text-slate-100 text-sm">{freelance.nom}</p>
        <p className="text-[11px] font-black text-primary tracking-wide uppercase">{freelance.titre}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <EtoileRating note={freelance.note} />
        <span className="text-xs font-bold text-slate-100">{freelance.note.toFixed(1)}</span>
        <span className="text-xs text-slate-400">({freelance.avis})</span>
      </div>
      <div className="flex gap-2 w-full mt-1">
        <Link href={`/freelances/${freelance.nom.toLowerCase().replace(/\s/g, "-")}`}
          className="flex-1 py-2 text-xs font-bold rounded-lg bg-background-dark border border-border-dark text-slate-300 hover:border-primary/40 hover:text-primary transition-all text-center">
          Profil
        </Link>
        <button className="flex-1 py-2 text-xs font-bold rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all">
          Contacter
        </button>
      </div>
    </div>
  );
}

function CarteService({ service, onRetirer }: { service: ServiceSauvegarde; onRetirer: (id: string) => void }) {
  return (
    <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden hover:border-primary/40 transition-all group">
      <div className={cn("relative h-44 bg-gradient-to-br", service.couleurGradient)}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-20 h-20 rounded-full border-2 border-white/30" />
          <div className="absolute bottom-4 right-6 w-32 h-32 rounded-full border border-white/20" />
        </div>
        <button onClick={() => onRetirer(service.id)}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-background-dark/70 flex items-center justify-center text-primary hover:text-red-400 hover:bg-background-dark transition-all opacity-0 group-hover:opacity-100" title="Retirer">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-primary">{service.prestataireinitiales}</span>
          </div>
          <span className="text-xs font-bold text-white drop-shadow-sm">{service.prestataire}</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">{service.titre}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <EtoileRating note={service.note} />
            <span className="text-xs font-bold text-slate-100">{service.note.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({service.avis})</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium">À partir de</p>
            <p className="text-sm font-black text-primary">{service.prix} EUR</p>
          </div>
        </div>
        <Link href={`/services/${service.id}`}
          className="block w-full py-2 text-center text-xs font-bold rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all">
          Voir le service
        </Link>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AgenceFavorisPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [tabActif, setTabActif] = useState("Tous");
  const [freelancesFavoris, setFreelancesFavoris] = useState<FreelanceFavori[]>([]);
  const [servicesSauvegardes, setServicesSauvegardes] = useState<ServiceSauvegarde[]>([]);
  const [listes, setListes] = useState<ListeProjet[]>([]);
  const [showNouvelleListeModal, setShowNouvelleListeModal] = useState(false);
  const [nouvelleListe, setNouvelleListe] = useState("");

  // Fetch favorites from API on mount
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.freelances)) setFreelancesFavoris(data.freelances);
        if (Array.isArray(data.services)) setServicesSauvegardes(data.services);
        if (Array.isArray(data.listes)) setListes(data.listes);
      } catch {
        // Silently fail - start with empty state
      }
    }
    fetchFavorites();
  }, []);

  // Derive tabs dynamically from lists + static "Tous"
  const tabs = ["Tous", ...listes.map((l) => l.nom)];

  const freelancesFiltres = tabActif === "Tous" ? freelancesFavoris : freelancesFavoris.filter((f) => f.liste === tabActif);
  const servicesFiltres = tabActif === "Tous" ? servicesSauvegardes : servicesSauvegardes.filter((s) => s.liste === tabActif);
  const totalElements = freelancesFavoris.length + servicesSauvegardes.length;

  function retirerFreelance(id: string) {
    setFreelancesFavoris((prev) => prev.filter((f) => f.id !== id));
    addToast("success", "Freelance retiré des favoris");
  }

  function retirerService(id: string) {
    setServicesSauvegardes((prev) => prev.filter((s) => s.id !== id));
    addToast("success", "Service retiré des favoris");
  }

  function creerListe() {
    const nom = nouvelleListe.trim();
    if (!nom) return;
    const newListe: ListeProjet = {
      id: `l-${Date.now()}`,
      nom,
      elements: 0,
      couleurIcon: "bg-slate-500/20 text-slate-400",
      icon: "folder",
    };
    setListes((prev) => [...prev, newListe]);
    addToast("success", `Liste "${nom}" créée`);
    setNouvelleListe("");
    setShowNouvelleListeModal(false);
  }

  return (
    <div className="max-w-full space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">Freelances & Services Favoris</h2>
          <p className="text-slate-400 text-sm mt-1">Gérez les prestataires et services sauvegardés pour les projets de l&apos;agence.</p>
          <p className="text-xs text-slate-500 mt-0.5">{totalElements} élément{totalElements !== 1 ? "s" : ""} sauvegardé{totalElements !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowNouvelleListeModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex-shrink-0">
          <span className="material-symbols-outlined text-base">add</span>
          Créer une liste
        </button>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setTabActif(tab)}
            className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tabActif === tab ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-background-dark/50 border border-border-dark text-slate-400 hover:border-primary/40 hover:text-slate-200"
            )}>
            {tab}
          </button>
        ))}
      </div>

      {/* Freelances */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h3 className="text-base font-black text-slate-100">Freelances Favoris</h3>
            <span className="text-xs font-bold text-slate-400 bg-background-dark/50 border border-border-dark px-2 py-0.5 rounded-full">{freelancesFiltres.length}</span>
          </div>
        </div>
        {freelancesFiltres.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {freelancesFiltres.map((f) => <CarteFreelance key={f.id} freelance={f} onRetirer={retirerFreelance} />)}
          </div>
        ) : (
          <div className="bg-background-dark/50 border border-dashed border-border-dark rounded-xl py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">person_search</span>
            <p className="text-slate-400 text-sm font-medium">Aucun freelance favori</p>
            <Link href="/explorer" className="text-xs text-primary font-bold hover:underline mt-1 inline-block">Explorer la marketplace</Link>
          </div>
        )}
      </section>

      {/* Services */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h3 className="text-base font-black text-slate-100">Services Sauvegardés</h3>
            <span className="text-xs font-bold text-slate-400 bg-background-dark/50 border border-border-dark px-2 py-0.5 rounded-full">{servicesFiltres.length}</span>
          </div>
        </div>
        {servicesFiltres.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicesFiltres.map((s) => <CarteService key={s.id} service={s} onRetirer={retirerService} />)}
          </div>
        ) : (
          <div className="bg-background-dark/50 border border-dashed border-border-dark rounded-xl py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">bookmark_remove</span>
            <p className="text-slate-400 text-sm font-medium">Aucun service sauvegardé</p>
            <Link href="/explorer" className="text-xs text-primary font-bold hover:underline mt-1 inline-block">Explorer les services</Link>
          </div>
        )}
      </section>

      {/* Listes de projets */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h3 className="text-base font-black text-slate-100">Listes de Projets</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {listes.map((liste) => (
            <button key={liste.id} onClick={() => setTabActif(liste.nom)}
              className={cn("bg-background-dark/50 border rounded-xl p-5 text-left hover:border-primary/40 transition-all group",
                tabActif === liste.nom ? "border-primary/50 shadow-md shadow-primary/10" : "border-border-dark"
              )}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", liste.couleurIcon)}>
                <span className="material-symbols-outlined text-xl">{liste.icon}</span>
              </div>
              <p className="text-sm font-bold text-slate-100 mb-1 group-hover:text-primary transition-colors">{liste.nom}</p>
              <p className="text-xs text-slate-400">{liste.elements} élément{liste.elements !== 1 ? "s" : ""}</p>
            </button>
          ))}
          <button onClick={() => setShowNouvelleListeModal(true)}
            className="bg-background-dark/30 border-2 border-dashed border-border-dark rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all group min-h-[120px]">
            <div className="w-10 h-10 rounded-xl bg-border-dark/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-primary transition-colors">add</span>
            </div>
            <p className="text-sm font-semibold text-slate-500 group-hover:text-primary transition-colors">+ Ajouter</p>
          </button>
        </div>
      </section>

      {/* Modal Nouvelle Liste */}
      {showNouvelleListeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNouvelleListeModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-background-dark border border-border-dark rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-slate-100">Créer une nouvelle liste</h3>
              <button onClick={() => setShowNouvelleListeModal(false)} className="w-8 h-8 rounded-lg bg-neutral-dark flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Nom de la liste *</label>
                <input type="text" value={nouvelleListe} onChange={(e) => setNouvelleListe(e.target.value)} placeholder="Ex : Projet e-commerce, SEO..."
                  className="w-full bg-neutral-dark border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:ring-2 focus:ring-primary/50 transition-all" autoFocus />
              </div>
              <div className="flex gap-3">
                <button onClick={creerListe}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50" disabled={!nouvelleListe.trim()}>
                  Créer la liste
                </button>
                <button onClick={() => setShowNouvelleListeModal(false)}
                  className="px-4 py-2.5 border border-border-dark rounded-xl text-sm font-bold text-slate-400 hover:text-slate-100 transition-all">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
