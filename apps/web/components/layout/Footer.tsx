"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap, Send } from "lucide-react";

const PLATFORM_LINKS = [
  { label: "Parcourir les freelances", href: "/explorer" },
  { label: "Comment ça marche", href: "/comment-ca-marche" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Avis clients", href: "/avis" },
  { label: "Blog", href: "/blog" },
];

const SUPPORT_LINKS = [
  { label: "Centre d'aide", href: "/aide" },
  { label: "Nous contacter", href: "/contact" },
  { label: "Politique de confidentialité", href: "/confidentialite" },
  { label: "CGU", href: "/cgu" },
  { label: "Mentions légales", href: "/mentions-legales" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // MVP: log uniquement, pas d'envoi réel
    console.log("Newsletter subscription:", email);
    setSubmitted(true);
    setEmail("");
  }

  return (
    <footer className="bg-gray-900 border-t border-white/5 px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Branding */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <Zap className="h-7 w-7 fill-primary text-primary" />
              <span className="text-xl font-extrabold text-white tracking-tight">
                FreelanceHigh
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Le pont entre les entreprises ambitieuses et les meilleurs talents
              indépendants d&apos;Afrique francophone et de sa diaspora.
            </p>
            <p className="text-xs text-gray-500 italic">
              &ldquo;La plateforme freelance qui élève votre carrière au plus
              haut niveau&rdquo;
            </p>
          </div>

          {/* Plateforme */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">
              Plateforme
            </h4>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">
              Support
            </h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">
              Newsletter
            </h4>
            <p className="text-gray-400 text-sm mb-4">
              Recevez les meilleures opportunités et talents chaque mois.
            </p>
            {submitted ? (
              <p className="text-accent text-sm font-semibold">
                ✓ Merci pour votre inscription !
              </p>
            ) : (
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  required
                  aria-label="Adresse email pour la newsletter"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <button
                  type="submit"
                  aria-label="S'abonner à la newsletter"
                  className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg transition-colors flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-500 text-xs">
            © 2026 FreelanceHigh. Tous droits réservés. Fondée par Lissanon
            Gildas.
          </p>
        </div>
      </div>
    </footer>
  );
}
