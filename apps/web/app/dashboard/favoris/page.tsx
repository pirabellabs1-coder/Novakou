"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  slug: string;
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

// ─── Données statiques ───────────────────────────────────────────────────────

const TABS = ["Tous", "Projet Logo", "Développement Web", "Rédaction Content"];

const FREELANCES: FreelanceFavori[] = [
  {
    id: "f1",
    initiales: "JD",
    nom: "Jean D.",
    titre: "EXPERT REACT",
    note: 4.9,
    avis: 120,
    verifie: true,
    liste: "Développement Web",
  },
  {
    id: "f2",
    initiales: "ML",
    nom: "Marie L.",
    titre: "UI/UX DESIGNER",
    note: 5.0,
    avis: 85,
    verifie: true,
    liste: "Projet Logo",
  },
  {
    id: "f3",
    initiales: "DS",
    nom: "Dev Studio",
    titre: "FULLSTACK AGENCY",
    note: 4.8,
    avis: 210,
    verifie: true,
    liste: "Développement Web",
  },
  {
    id: "f4",
    initiales: "SD",
    nom: "Sophie Design",
    titre: "ILLUSTRATRICE",
    note: 4.9,
    avis: 56,
    verifie: true,
    liste: "Projet Logo",
  },
];

const SERVICES: ServiceSauvegarde[] = [
  {
    id: "s1",
    slug: "design-logo-minimaliste-branding-premium",
    titre: "Design de Logo Minimaliste & Branding Premium",
    prestataire: "Marie L.",
    prestataireinitiales: "ML",
    note: 4.9,
    avis: 42,
    prix: 250,
    couleurGradient: "from-teal-900/80 via-emerald-900/60 to-background-dark/90",
    liste: "Projet Logo",
  },
  {
    id: "s2",
    slug: "landing-page-conversion-optimisee-figma-react",
    titre: "Landing Page Conversion-Optimisée (Figma/React)",
    prestataire: "Jean D.",
    prestataireinitiales: "JD",
    note: 5.0,
    avis: 18,
    prix: 800,
    couleurGradient: "from-blue-900/80 via-indigo-900/60 to-background-dark/90",
    liste: "Développement Web",
  },
  {
    id: "s3",
    slug: "illustrations-personnalisees-saas-blogs",
    titre: "Illustrations Personnalisées pour SaaS & Blogs",
    prestataire: "Sophie Design",
    prestataireinitiales: "SD",
    note: 4.8,
    avis: 29,
    prix: 150,
    couleurGradient: "from-purple-900/80 via-pink-900/60 to-background-dark/90",
    liste: "Rédaction Content",
  },
];

const LISTES: ListeProjet[] = [
  {
    id: "l1",
    nom: "Projet Logo",
    elements: 12,
    couleurIcon: "bg-emerald-500/20 text-emerald-400",
    icon: "palette",
  },
  {
    id: "l2",
    nom: "Développement Web",
    elements: 5,
    couleurIcon: "bg-blue-500/20 text-blue-400",
    icon: "code",
  },
  {
    id: "l3",
    nom: "Montage Vidéo",
    elements: 3,
    couleurIcon: "bg-violet-500/20 text-violet-400",
    icon: "movie",
  },
];

// ─── Sous-composants ─────────────────────────────────────────────────────────

function EtoileRating({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={cn(
            "w-3 h-3",
            i <= Math.round(note) ? "text-yellow-400" : "text-slate-600"
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function CarteFreelance({
  freelance,
  onRetirer,
}: {
  freelance: FreelanceFavori;
  onRetirer: (id: string) => void;
}) {
  return (
    <div className="relative bg-background-dark/50 border border-border-dark rounded-xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary/40 transition-all group">
      {/* Bouton cœur */}
      <button
        onClick={() => onRetirer(freelance.id)}
        className="absolute top-3 right-3 text-primary hover:text-red-400 transition-colors"
        title="Retirer des favoris"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>

      {/* Avatar avec badge vérifié */}
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

      {/* Infos */}
      <div className="space-y-0.5">
        <p className="font-bold text-slate-100 text-sm">{freelance.nom}</p>
        <p className="text-[11px] font-black text-primary tracking-wide uppercase">{freelance.titre}</p>
      </div>

      {/* Note */}
      <div className="flex items-center gap-1.5">
        <EtoileRating note={freelance.note} />
        <span className="text-xs font-bold text-slate-100">{freelance.note.toFixed(1)}</span>
        <span className="text-xs text-slate-400">({freelance.avis})</span>
      </div>

      {/* Bouton profil */}
      <Link
        href={`/freelances/${freelance.nom.toLowerCase().replace(/\s/g, "-")}`}
        className="mt-1 w-full py-2 text-xs font-bold rounded-lg bg-background-dark border border-border-dark text-slate-300 hover:border-primary/40 hover:text-primary transition-all"
      >
        Profil
      </Link>
    </div>
  );
}

function CarteService({
  service,
  onRetirer,
}: {
  service: ServiceSauvegarde;
  onRetirer: (id: string) => void;
}) {
  return (
    <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden hover:border-primary/40 transition-all group">
      {/* Image placeholder avec gradient */}
      <div className={cn("relative h-44 bg-gradient-to-br", service.couleurGradient)}>
        {/* Pattern décoratif */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-20 h-20 rounded-full border-2 border-white/30" />
          <div className="absolute bottom-4 right-6 w-32 h-32 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-lg border-2 border-white/20 rotate-45" />
        </div>

        {/* Bouton retirer */}
        <button
          onClick={() => onRetirer(service.id)}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-background-dark/70 flex items-center justify-center text-primary hover:text-red-400 hover:bg-background-dark transition-all opacity-0 group-hover:opacity-100"
          title="Retirer des favoris"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        {/* Prestataire overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-primary">{service.prestataireinitiales}</span>
          </div>
          <span className="text-xs font-bold text-white drop-shadow-sm">{service.prestataire}</span>
        </div>
      </div>

      {/* Infos service */}
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
            <p className="text-sm font-black text-primary">€{service.prix}</p>
          </div>
        </div>
        <Link
          href={`/services/${service.slug || service.id}`}
          className="block w-full py-2 text-center text-xs font-bold rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all"
        >
          Voir le service
        </Link>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function FavorisPage() {
  const [tabActif, setTabActif] = useState("Tous");
  const [freelancesFavoris, setFreelancesFavoris] = useState<FreelanceFavori[]>(FREELANCES);
  const [servicesSauvegardes, setServicesSauvegardes] = useState<ServiceSauvegarde[]>(SERVICES);
  const [showNouvelleListeModal, setShowNouvelleListeModal] = useState(false);
  const [nouvelleListe, setNouvelleListe] = useState("");

  // Filtrage par onglet
  const freelancesFiltres =
    tabActif === "Tous"
      ? freelancesFavoris
      : freelancesFavoris.filter((f) => f.liste === tabActif);

  const servicesFiltres =
    tabActif === "Tous"
      ? servicesSauvegardes
      : servicesSauvegardes.filter((s) => s.liste === tabActif);

  function retirerFreelance(id: string) {
    setFreelancesFavoris((prev) => prev.filter((f) => f.id !== id));
  }

  function retirerService(id: string) {
    setServicesSauvegardes((prev) => prev.filter((s) => s.id !== id));
  }

  const totalElements = freelancesFavoris.length + servicesSauvegardes.length;

  return (
    <div className="max-w-full space-y-4 sm:space-y-6 lg:space-y-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Services et Freelances Favoris
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Gérez vos prestataires et services sauvegardés pour vos futurs projets.
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{totalElements} éléments sauvegardés</p>
        </div>
        <button
          onClick={() => setShowNouvelleListeModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all flex-shrink-0"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Créer une nouvelle liste
        </button>
      </header>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setTabActif(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tabActif === tab
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-background-dark/50 border border-border-dark text-slate-400 hover:border-primary/40 hover:text-slate-200"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Section : Freelances Favoris ───────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h3 className="text-base font-black text-slate-100">Freelances Favoris</h3>
            <span className="text-xs font-bold text-slate-400 bg-background-dark/50 border border-border-dark px-2 py-0.5 rounded-full">
              {freelancesFiltres.length}
            </span>
          </div>
          <Link
            href="/explorer"
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            Explorer
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {freelancesFiltres.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {freelancesFiltres.map((f) => (
              <CarteFreelance key={f.id} freelance={f} onRetirer={retirerFreelance} />
            ))}
          </div>
        ) : (
          <div className="bg-background-dark/50 border border-dashed border-border-dark rounded-xl py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">person_search</span>
            <p className="text-slate-400 text-sm font-medium">Aucun freelance dans cette liste</p>
            <Link href="/explorer" className="text-xs text-primary font-bold hover:underline mt-1 inline-block">
              Explorer la marketplace
            </Link>
          </div>
        )}
      </section>

      {/* ── Section : Services Sauvegardés ─────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h3 className="text-base font-black text-slate-100">Services Sauvegardés</h3>
            <span className="text-xs font-bold text-slate-400 bg-background-dark/50 border border-border-dark px-2 py-0.5 rounded-full">
              {servicesFiltres.length}
            </span>
          </div>
          <Link
            href="/explorer"
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            Explorer
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {servicesFiltres.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicesFiltres.map((s) => (
              <CarteService key={s.id} service={s} onRetirer={retirerService} />
            ))}
          </div>
        ) : (
          <div className="bg-background-dark/50 border border-dashed border-border-dark rounded-xl py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">bookmark_remove</span>
            <p className="text-slate-400 text-sm font-medium">Aucun service dans cette liste</p>
            <Link href="/explorer" className="text-xs text-primary font-bold hover:underline mt-1 inline-block">
              Explorer les services
            </Link>
          </div>
        )}
      </section>

      {/* ── Section : Vos Listes de Projets ────────────────────────── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 rounded-full bg-primary" />
              <h3 className="text-base font-black text-slate-100">Vos Listes de Projets</h3>
            </div>
            <p className="text-sm text-slate-400 pl-3">
              Organisez vos favoris par projet ou besoin spécifique.
            </p>
          </div>
          <button
            onClick={() => setShowNouvelleListeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nouvelle liste
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {LISTES.map((liste) => (
            <button
              key={liste.id}
              onClick={() => setTabActif(liste.nom)}
              className={cn(
                "bg-background-dark/50 border rounded-xl p-5 text-left hover:border-primary/40 transition-all group",
                tabActif === liste.nom ? "border-primary/50 shadow-md shadow-primary/10" : "border-border-dark"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", liste.couleurIcon)}>
                <span className="material-symbols-outlined text-xl">{liste.icon}</span>
              </div>
              <p className="text-sm font-bold text-slate-100 mb-1 group-hover:text-primary transition-colors">
                {liste.nom}
              </p>
              <p className="text-xs text-slate-400">
                {liste.elements} élément{liste.elements > 1 ? "s" : ""}
              </p>
            </button>
          ))}

          {/* Carte ajouter */}
          <button
            onClick={() => setShowNouvelleListeModal(true)}
            className="bg-background-dark/30 border-2 border-dashed border-border-dark rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all group min-h-[120px]"
          >
            <div className="w-10 h-10 rounded-xl bg-border-dark/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-primary transition-colors">
                add
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-500 group-hover:text-primary transition-colors">
              + Ajouter
            </p>
          </button>
        </div>
      </section>

      {/* ── Modal : Nouvelle Liste ──────────────────────────────────── */}
      {showNouvelleListeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNouvelleListeModal(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md bg-[#11211e] border border-border-dark rounded-2xl p-6 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-slate-100">Créer une nouvelle liste</h3>
              <button
                onClick={() => setShowNouvelleListeModal(false)}
                className="w-8 h-8 rounded-lg bg-background-dark/50 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-border-dark transition-all"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Nom de la liste *
                </label>
                <input
                  type="text"
                  value={nouvelleListe}
                  onChange={(e) => setNouvelleListe(e.target.value)}
                  placeholder="Ex : Projet e-commerce, Design mobile…"
                  className="w-full bg-background-dark/50 border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (nouvelleListe.trim()) {
                      setNouvelleListe("");
                      setShowNouvelleListeModal(false);
                    }
                  }}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                  disabled={!nouvelleListe.trim()}
                >
                  Créer la liste
                </button>
                <button
                  onClick={() => setShowNouvelleListeModal(false)}
                  className="px-4 py-2.5 border border-border-dark rounded-xl text-sm font-bold text-slate-400 hover:text-slate-100 hover:border-slate-500 transition-all"
                >
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
