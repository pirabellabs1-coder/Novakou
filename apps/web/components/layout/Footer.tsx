"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const t = useTranslations("footer");

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <footer className="bg-slate-950 border-t border-white/5 px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 lg:gap-16">
        {/* Branding */}
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-4xl font-bold">public</span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Novakou</h2>
          </Link>
          <p className="text-slate-500 text-base leading-relaxed">
            {t("description")}
          </p>
          <div className="flex gap-4">
            {["language", "grid_view", "alternate_email"].map((icon) => (
              <Link
                key={icon}
                href="#"
                className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-primary transition-all"
              >
                <span className="material-symbols-outlined">{icon}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Plateforme */}
        <div>
          <h4 className="text-white font-bold text-lg mb-4 sm:mb-8">{t("platform")}</h4>
          <ul className="space-y-4 text-slate-500 text-base">
            <li><Link href="/explorer" className="hover:text-primary transition-colors">{t("links.explore_services")}</Link></li>
            <li><Link href="/offres-projets" className="hover:text-primary transition-colors">{t("links.ongoing_projects")}</Link></li>
            <li><Link href="/inscription" className="hover:text-primary transition-colors">{t("links.become_freelance")}</Link></li>
            <li><Link href="/tarifs" className="hover:text-primary transition-colors">{t("links.pricing")}</Link></li>
            <li><Link href="/affiliation" className="hover:text-primary transition-colors">{t("links.affiliation")}</Link></li>
          </ul>
        </div>

        {/* Support & Sécurité */}
        <div>
          <h4 className="text-white font-bold text-lg mb-4 sm:mb-8">{t("support_security")}</h4>
          <ul className="space-y-4 text-slate-500 text-base">
            <li><Link href="/confiance-securite" className="hover:text-primary transition-colors">{t("links.payment_protection")}</Link></li>
            <li><Link href="/comment-ca-marche" className="hover:text-primary transition-colors">{t("links.how_it_works")}</Link></li>
            <li><Link href="/aide" className="hover:text-primary transition-colors">{t("links.help_center")}</Link></li>
            <li><Link href="/confidentialite" className="hover:text-primary transition-colors">{t("links.privacy")}</Link></li>
            <li><Link href="/cookies" className="hover:text-primary transition-colors">{t("links.cookies")}</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-white font-bold text-lg mb-4 sm:mb-8">{t("newsletter_title")}</h4>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {t("newsletter_desc")}
          </p>
          {submitted ? (
            <p className="text-sm font-bold flex items-center gap-2 text-accent">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {t("newsletter_success")}
            </p>
          ) : (
            <form onSubmit={handleNewsletter} className="flex flex-col gap-3">
              <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl focus-within:border-primary transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("newsletter_placeholder")}
                  required
                  className="bg-transparent border-none outline-none text-sm text-white w-full px-3 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="bg-primary text-white p-3 rounded-lg hover:bg-primary/80 transition-all flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1440px] mx-auto pt-8 sm:pt-16 mt-8 sm:mt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-8">
        <p className="text-slate-600 text-xs">{t("copyright")}</p>
        <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600 font-bold">
          <Link href="/cgu" className="hover:text-white transition-colors">{t("links.terms")}</Link>
          <Link href="/confidentialite" className="hover:text-white transition-colors">{t("links.confidentiality")}</Link>
          <Link href="/mentions-legales" className="hover:text-white transition-colors">{t("links.legal_notices")}</Link>
          <Link href="/cookies" className="hover:text-white transition-colors">{t("links.cookies_upper")}</Link>
        </div>
      </div>
    </footer>
  );
}
