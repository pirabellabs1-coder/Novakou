"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Zap } from "lucide-react";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import type { Metadata } from "next";

// Note: metadata export must be in a server component
// For MVP this page is client-only; SEO can be added via generateMetadata later

export default function ConnexionPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: connect to Supabase Auth
    console.log(form);
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      {/* Left brand panel */}
      <AuthLeftPanel
        headline={
          <>
            Bon retour
            <br />
            <span className="text-yellow-300">parmi nous</span>
          </>
        }
        subtext="Connectez-vous pour accéder à vos commandes, vos services et vos finances en toute sécurité."
        benefits={[
          "Tableau de bord personnalisé selon votre rôle",
          "Toutes vos commandes et messages centralisés",
          "Retraits Mobile Money, Stripe, PayPal disponibles",
          "Vos données protégées par chiffrement end-to-end",
        ]}
      />

      {/* Right form panel */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center px-6 py-12 sm:px-10 bg-white overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 self-start">
          <Link href="/" className="inline-flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-600 fill-purple-600" />
            <span className="text-xl font-extrabold text-gray-900">
              FreelanceHigh
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-1">
              Bienvenue
            </h1>
            <p className="text-gray-500 text-sm">
              Veuillez entrer vos identifiants pour continuer.
            </p>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="#0077B5"
                viewBox="0 0 24 24"
              >
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-gray-200" />
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-widest font-semibold">
              ou avec email
            </span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="nom@exemple.com"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Mot de passe
                </label>
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs text-purple-600 font-semibold hover:underline"
                >
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all mt-2 text-sm"
            >
              Se connecter
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="text-purple-600 hover:text-purple-700 font-bold hover:underline"
            >
              Inscrivez-vous gratuitement
            </Link>
          </p>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-4 mt-8 text-xs text-gray-400">
            <Link href="/cgu" className="hover:text-gray-600 transition-colors">
              CGU
            </Link>
            <span>·</span>
            <Link
              href="/confidentialite"
              className="hover:text-gray-600 transition-colors"
            >
              Confidentialité
            </Link>
            <span>·</span>
            <Link
              href="/contact"
              className="hover:text-gray-600 transition-colors"
            >
              Aide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
