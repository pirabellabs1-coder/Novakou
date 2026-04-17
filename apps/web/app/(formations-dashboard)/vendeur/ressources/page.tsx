"use client";

import Link from "next/link";

export default function RessourcesPage() {
  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes Ressources</h1>
          <p className="text-sm text-[#5c647a] mt-1">Gérez tous les fichiers de vos formations</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          Bientôt disponible
        </span>
      </div>

      {/* Coming soon card */}
      <div className="bg-gradient-to-br from-[#006e2f]/5 to-emerald-50 border border-[#006e2f]/10 rounded-2xl p-10 text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[32px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>
            folder_open
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">Bibliothèque de ressources — En construction</h2>
        <p className="text-sm text-[#5c647a] max-w-xl mx-auto mb-6">
          Bientôt vous pourrez centraliser tous vos fichiers (vidéos, PDFs, images, templates) dans un cloud dédié.
          Pour l&apos;instant, vos ressources s&apos;attachent directement à chaque leçon depuis l&apos;éditeur de cours.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          {[
            { icon: "upload", title: "Upload illimité", desc: "Vidéos 4K, PDFs, images" },
            { icon: "folder", title: "Organisation", desc: "Dossiers par formation" },
            { icon: "share", title: "Partage rapide", desc: "Lien direct vers une leçon" },
            { icon: "history", title: "Historique", desc: "Versions des fichiers" },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-[#006e2f]/10 p-4 text-left flex gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#006e2f] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                {f.icon}
              </span>
              <div>
                <p className="text-xs font-bold text-[#191c1e]">{f.title}</p>
                <p className="text-[10px] text-[#5c647a] mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-sm font-semibold text-[#191c1e] mb-1">Besoin d&apos;ajouter des fichiers maintenant ?</p>
        <p className="text-xs text-[#5c647a] mb-4">
          Ouvrez une formation depuis vos produits et ajoutez des ressources à chaque leçon directement.
        </p>
        <Link
          href="/vendeur/produits"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          Voir mes produits
        </Link>
      </div>
    </div>
  );
}
