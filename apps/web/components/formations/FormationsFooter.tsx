"use client";

import Link from "next/link";
import { useState } from "react";

export function FormationsFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrMsg("Adresse email invalide");
      return;
    }
    setStatus("loading");
    setErrMsg(null);
    try {
      const res = await fetch("/api/formations/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Erreur d'inscription");
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (e) {
      setStatus("error");
      setErrMsg(e instanceof Error ? e.message : "Erreur réseau");
    }
  }

  return (
    <footer className="bg-slate-50 w-full py-16 border-t border-slate-100" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 max-w-7xl mx-auto">

        {/* Col 1 — Brand */}
        <div className="space-y-6">
          <div className="text-xl font-bold text-slate-900">Novakou</div>
          <p className="text-sm text-slate-500 leading-relaxed">
            La plateforme qui transforme les talents en actifs numériques rentables. Le futur de l&apos;économie des créateurs.
          </p>
        </div>

        {/* Col 2 — Marketplace */}
        <div className="space-y-6">
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Marketplace</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            <li><Link href="/formations/explorer" className="hover:text-[#006e2f] transition-colors">Explorer</Link></li>
            <li><Link href="/formations/freelances" className="hover:text-[#006e2f] transition-colors">Freelances</Link></li>
            <li><Link href="/formations/services" className="hover:text-[#006e2f] transition-colors">Services</Link></li>
            <li><Link href="/formations/tarifs" className="hover:text-[#006e2f] transition-colors">Tarifs</Link></li>
            <li><Link href="/formations/affiliation" className="hover:text-[#006e2f] transition-colors">Affiliation</Link></li>
          </ul>
        </div>

        {/* Col 3 — Entreprise */}
        <div className="space-y-6">
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Entreprise</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            <li><Link href="/formations/a-propos" className="hover:text-[#006e2f] transition-colors">À propos</Link></li>
            <li><Link href="/formations/blog" className="hover:text-[#006e2f] transition-colors">Blog</Link></li>
            <li><Link href="/formations/partenaires" className="hover:text-[#006e2f] transition-colors">Partenaires</Link></li>
            <li><Link href="/formations/contact" className="hover:text-[#006e2f] transition-colors">Contact</Link></li>
            <li><Link href="/formations/aide" className="hover:text-[#006e2f] transition-colors">Centre d&apos;aide</Link></li>
          </ul>
        </div>

        {/* Col 4 — Newsletter */}
        <div className="space-y-6">
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Newsletter</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            Recevez les meilleures stratégies de monétisation directement dans votre boîte.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              placeholder="votre@email.com"
              disabled={status === "loading" || status === "success"}
              className="flex-1 px-4 py-2 text-sm rounded-full border border-slate-200 bg-white outline-none focus:border-[#006e2f] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200 flex-shrink-0 disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              aria-label="S'abonner"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                {status === "loading" ? "progress_activity" : status === "success" ? "check" : "arrow_forward"}
              </span>
            </button>
          </form>
          {status === "success" && <p className="text-xs text-[#006e2f] font-semibold">✓ Inscription confirmée — merci !</p>}
          {status === "error" && errMsg && <p className="text-xs text-red-500">{errMsg}</p>}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 pt-8 border-t border-slate-100 px-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <p>© 2026 Novakou · La Curation Digital</p>
        <div className="flex gap-6">
          <Link href="/formations/cgu" className="hover:text-slate-600 transition-colors">CGU</Link>
          <Link href="/formations/confidentialite" className="hover:text-slate-600 transition-colors">Confidentialité</Link>
          <Link href="/formations/cookies" className="hover:text-slate-600 transition-colors">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
