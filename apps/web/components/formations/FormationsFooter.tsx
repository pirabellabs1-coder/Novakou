"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function FormationsFooter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const t = useTranslations("formations_nav");

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <footer className="bg-slate-950 border-t border-white/5 px-6 lg:px-20 py-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
        {/* Branding */}
        <div className="space-y-8">
          <Link href="/formations" className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-4xl font-bold">school</span>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">FreelanceHigh</h2>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                Formations
              </span>
            </div>
          </Link>
          <p className="text-slate-500 text-base leading-relaxed">
            {t("footer_description")}
          </p>
          <div className="flex gap-4">
            {[
              { icon: "public", href: "https://freelancehigh.com" },
              { icon: "alternate_email", href: "mailto:contact@freelancehigh.com" },
            ].map(({ icon, href }) => (
              <Link
                key={icon}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-primary transition-all"
              >
                <span className="material-symbols-outlined">{icon}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Formations */}
        <div>
          <h4 className="text-white font-bold text-lg mb-8">{t("footer_formations")}</h4>
          <ul className="space-y-4 text-slate-500 text-base">
            <li><Link href="/formations/explorer" className="hover:text-primary transition-colors">{t("explore")}</Link></li>
            <li><Link href="/formations/categories" className="hover:text-primary transition-colors">{t("categories")}</Link></li>
            <li><Link href="/formations/produits" className="hover:text-primary transition-colors">{t("digital_products")}</Link></li>
            <li><Link href="/formations/inscription?role=instructeur" className="hover:text-primary transition-colors">{t("become_instructor")}</Link></li>
            <li><Link href="/" className="hover:text-primary transition-colors">{t("back_to_freelancehigh")}</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-bold text-lg mb-8">{t("footer_support")}</h4>
          <ul className="space-y-4 text-slate-500 text-base">
            <li><Link href="/aide" className="hover:text-primary transition-colors">{t("footer_faq")}</Link></li>
            <li><Link href="/aide" className="hover:text-primary transition-colors">{t("footer_contact")}</Link></li>
            <li><Link href="/cgu" className="hover:text-primary transition-colors">{t("footer_terms")}</Link></li>
            <li><Link href="/confidentialite" className="hover:text-primary transition-colors">{t("footer_privacy")}</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-white font-bold text-lg mb-8">{t("footer_newsletter_title")}</h4>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {t("footer_newsletter_desc")}
          </p>
          {submitted ? (
            <p className="text-sm font-bold flex items-center gap-2 text-accent">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {t("footer_newsletter_success")}
            </p>
          ) : (
            <form onSubmit={handleNewsletter} className="flex flex-col gap-3">
              <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl focus-within:border-primary transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("footer_newsletter_placeholder")}
                  required
                  autoComplete="email"
                  suppressHydrationWarning
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
      <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-slate-600 text-xs">{t("footer_copyright")}</p>
        <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600 font-bold">
          <Link href="/cgu" className="hover:text-white transition-colors">{t("footer_terms")}</Link>
          <Link href="/confidentialite" className="hover:text-white transition-colors">{t("footer_privacy")}</Link>
          <Link href="/mentions-legales" className="hover:text-white transition-colors">{t("footer_legal")}</Link>
        </div>
      </div>
    </footer>
  );
}
