"use client";

import Link from "next/link";
import { useState } from "react";
import "./nav/nav.css";
import { NavIcon } from "./nav/icons";

const PLATFORM_LINKS = [
  { href: "/explorer", label: "Marketplace" },
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/affiliation", label: "Affiliation" },
  { href: "/mentors", label: "Mentorat" },
];

const COMPANY_LINKS = [
  { href: "/a-propos", label: "À propos" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/contact", label: "Contact" },
  { href: "/aide", label: "Centre d'aide" },
  { href: "/confiance-securite", label: "Confiance & sécurité" },
  { href: "/documentation-paiements", label: "Documentation paiements" },
];

const LEGAL_LINKS = [
  { href: "/cgu", label: "CGU" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cookies", label: "Cookies" },
];

/**
 * Pied de page plateforme. Les liens « Freelances » et « Services » ont
 * disparu : la marketplace de services (héritage FreelanceHigh) n'existe plus.
 */
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

  const busy = status === "loading" || status === "success";

  return (
    <footer className="nk-foot w-full border-t border-[#0e1512]/[.06] bg-slate-50 pb-10 pt-16 lg:pt-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:gap-10">

        {/* Col 1 — Marque */}
        <div className="space-y-5">
          <Link href="/" className="nk-nav__logo inline-flex" aria-label="Novakou — accueil">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="36" height="36" rx="10" fill="#006e2f" />
              <path d="M11 26V10h3l7 10.5V10h3v16h-3L14 15.5V26h-3z" fill="white" />
            </svg>
            <span className="text-lg font-extrabold tracking-tight text-[#0e1512]">Novakou</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-[#5c6b62]">
            Vendez vos formations et produits numériques en Afrique francophone — encaissés en Mobile Money.
          </p>
          <p className="text-xs text-[#8a968e]">Zéro abonnement · 10 % par vente</p>
        </div>

        {/* Col 2 — Plateforme */}
        <div className="space-y-5">
          <h4 className="nk-foot__title">Plateforme</h4>
          <ul className="space-y-3 text-sm">
            {PLATFORM_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} className="nk-foot__link">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Entreprise */}
        <div className="space-y-5">
          <h4 className="nk-foot__title">Entreprise</h4>
          <ul className="space-y-3 text-sm">
            {COMPANY_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} className="nk-foot__link">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Col 4 — Newsletter */}
        <div className="space-y-5">
          <h4 className="nk-foot__title">Newsletter</h4>
          <p className="text-sm leading-relaxed text-[#5c6b62]">
            Recevez les meilleures stratégies de monétisation directement dans votre boîte.
          </p>
          <form onSubmit={handleSubscribe} className="nk-foot__field" noValidate>
            <input
              type="email"
              required
              autoComplete="email"
              aria-label="Adresse email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              placeholder="votre@email.com"
              disabled={busy}
              className="nk-foot__input"
            />
            <button type="submit" disabled={busy} className="nk-foot__submit" aria-label="S'abonner">
              {status === "loading" ? (
                <NavIcon name="progress_activity" className="nk-spin" />
              ) : status === "success" ? (
                <NavIcon name="check" />
              ) : (
                <NavIcon name="arrow_forward" />
              )}
            </button>
          </form>
          <div aria-live="polite" className="min-h-[1rem]">
            {status === "success" && <p className="text-xs font-semibold text-[#006e2f]">Inscription confirmée — merci.</p>}
            {status === "error" && errMsg && <p className="text-xs text-red-600">{errMsg}</p>}
          </div>
        </div>
      </div>

      {/* Barre basse */}
      <div className="mx-auto mt-14 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-[#0e1512]/[.06] px-6 pt-8 text-xs text-[#6b7772] sm:px-8 md:flex-row">
        <p>© 2026 Novakou · La Curation Digital</p>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {LEGAL_LINKS.map((l) => (
            <li key={l.href}><Link href={l.href} className="nk-foot__link nk-foot__legal">{l.label}</Link></li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
