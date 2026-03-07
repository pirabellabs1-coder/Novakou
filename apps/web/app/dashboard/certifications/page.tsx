"use client";

import Link from "next/link";

export default function CertificationsPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-8">
      {/* Icon */}
      <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-primary">school</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Certifications IA</h1>
        <p className="text-slate-400">
          Fonctionnalité en cours de développement
        </p>
      </div>

      {/* Feature list */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-left space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Ce qui arrive bientôt
        </h2>
        <ul className="space-y-3">
          {[
            { icon: "quiz", text: "Tests de compétences techniques surveillés par IA" },
            { icon: "verified", text: "Badges de certification affichés sur votre profil public" },
            { icon: "category", text: "Catalogue de certifications : développement, design, rédaction, marketing" },
            { icon: "trending_up", text: "Classement par centile parmi les freelances de votre domaine" },
          ].map((item) => (
            <li key={item.icon} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">{item.icon}</span>
              <span className="text-sm text-slate-300">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Version note */}
      <p className="text-xs text-slate-500">
        Prévu pour la V3 — Les certifications IA permettront de valider vos compétences
        auprès des clients internationaux.
      </p>

      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Retour au tableau de bord
      </Link>
    </div>
  );
}
