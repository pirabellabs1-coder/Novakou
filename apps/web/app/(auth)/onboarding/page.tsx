"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OnboardingContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "freelance";

  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden"
      style={{
        backgroundImage: "radial-gradient(circle at 2px 2px, rgba(14, 124, 102, 0.1) 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Navigation */}
      <header className="flex items-center justify-between border-b border-border-dark px-6 py-4 lg:px-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary flex items-center justify-center rounded-lg shadow-lg shadow-primary/20 text-accent">
            <span className="material-symbols-outlined text-3xl">language</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-extrabold leading-tight tracking-tight">
            Freelance<span className="text-primary">High</span>
          </h2>
        </div>

        <nav className="hidden md:flex items-center gap-10">
          <Link href="/explorer" className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors">Explorer</Link>
          <Link href="/comment-ca-marche" className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors">Comment ça marche</Link>
          <Link href="/tarifs" className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors">Tarifs</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/connexion"
            className="hidden sm:flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-10 px-5 text-slate-700 dark:text-white text-sm font-bold border border-border-dark hover:bg-white/5 transition-all"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            S&apos;inscrire
          </Link>
        </div>
      </header>

      <main className="flex flex-col items-center flex-1 w-full max-w-7xl mx-auto px-4 lg:px-20">
        {/* Hero Section */}
        <section className="w-full py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex flex-col gap-8 flex-1 text-center lg:text-left">
            <div className="inline-flex items-center self-center lg:self-start gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">verified</span>
              Identité forte, Opportunités globales
            </div>

            <h1 className="text-slate-900 dark:text-white text-4xl lg:text-6xl font-black leading-tight tracking-tight">
              Connecter les <span className="text-primary italic">talents</span> du monde entier
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl font-normal max-w-xl">
              FreelanceHigh est la plateforme de référence pour propulser votre carrière internationale tout en célébrant vos racines.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href={`/onboarding/etape?role=${role}`}
                className="flex items-center justify-center gap-2 rounded-xl h-14 px-8 bg-primary text-white text-lg font-bold shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all group"
              >
                <span>Compléter mon profil</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <Link
                href="/explorer"
                className="flex items-center justify-center gap-2 rounded-xl h-14 px-8 bg-white/5 dark:bg-neutral-dark border border-border-dark text-slate-700 dark:text-white text-lg font-bold hover:bg-white/10 transition-all"
              >
                Explorer les missions
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-accent opacity-20 blur-3xl rounded-full"></div>
              <div className="relative rounded-2xl overflow-hidden border-4 border-white dark:border-neutral-dark shadow-2xl aspect-video bg-neutral-dark">
                <img
                  alt="Creative professionals collaborating"
                  className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                />
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-accent flex items-center justify-center text-slate-900">
                      <span className="material-symbols-outlined text-sm">stars</span>
                    </div>
                    <p className="text-white text-sm font-medium">Top Freelance: &ldquo;Une plateforme qui comprend nos besoins.&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="w-full py-16 flex flex-col gap-12">
          <div className="flex flex-col gap-4 text-center items-center">
            <h2 className="text-slate-900 dark:text-white text-3xl lg:text-4xl font-bold">Pourquoi rejoindre FreelanceHigh ?</h2>
            <div className="h-1.5 w-24 bg-accent rounded-full"></div>
            <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl mt-2">
              Découvrez une expérience d&apos;onboarding conçue pour valoriser vos compétences uniques sur la scène internationale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "badge", title: "Identité Forte", description: "Une interface aux couleurs vibrantes pour une marque qui respecte et amplifie votre héritage professionnel.", color: "primary" },
              { icon: "public", title: "Opportunités Globales", description: "Accédez à des projets internationaux de haute facture tout en restant connecté à l'écosystème local.", color: "accent" },
              { icon: "diversity_3", title: "Réseau d'Experts", description: "Rejoignez une communauté dynamique de freelances et de clients engagés pour le succès collectif.", color: "primary" },
            ].map((card) => (
              <div
                key={card.title}
                className={`group flex flex-col gap-5 p-8 rounded-2xl border border-border-dark bg-white/5 dark:bg-neutral-dark/40 hover:border-${card.color}/50 hover:bg-${card.color}/5 transition-all`}
              >
                <div className={`size-14 rounded-xl bg-${card.color}/20 text-${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-2">{card.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Onboarding Path */}
        <section className="w-full py-16 mb-20 bg-primary/5 dark:bg-primary/10 rounded-3xl p-8 lg:p-12 border border-primary/20">
          <h2 className="text-slate-900 dark:text-white text-2xl lg:text-3xl font-bold mb-10 text-center lg:text-left">
            Votre parcours commence ici
          </h2>

          <div className="relative flex flex-col gap-0 md:flex-row md:gap-8">
            {/* Step 1 */}
            <div className="relative flex flex-1 flex-col gap-4 group">
              <div className="flex items-center gap-4">
                <div className="z-10 size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg group-hover:ring-4 group-hover:ring-primary/20 transition-all">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div className="md:hidden text-lg font-bold">Création de compte</div>
              </div>
              <div className="hidden md:block absolute top-6 left-12 w-full h-[2px] bg-border-dark"></div>
              <div className="ml-16 md:ml-0 flex flex-col">
                <p className="hidden md:block text-slate-900 dark:text-white text-lg font-bold">Création de compte</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Moins de 2 minutes pour s&apos;enregistrer</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-1 flex-col gap-4 group mt-8 md:mt-0">
              <div className="flex items-center gap-4">
                <div className="z-10 size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg group-hover:ring-4 group-hover:ring-primary/20 transition-all">
                  <span className="material-symbols-outlined">edit_square</span>
                </div>
                <div className="md:hidden text-lg font-bold">Personnalisation</div>
              </div>
              <div className="hidden md:block absolute top-6 left-12 w-full h-[2px] bg-border-dark"></div>
              <div className="ml-16 md:ml-0 flex flex-col">
                <p className="hidden md:block text-slate-900 dark:text-white text-lg font-bold">Personnalisation</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Ajoutez votre portfolio et vos tarifs</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-1 flex-col gap-4 group mt-8 md:mt-0">
              <div className="flex items-center gap-4">
                <div className="z-10 size-12 rounded-full bg-accent text-slate-900 flex items-center justify-center shadow-lg group-hover:ring-4 group-hover:ring-accent/20 transition-all">
                  <span className="material-symbols-outlined">rocket_launch</span>
                </div>
                <div className="md:hidden text-lg font-bold">Première mission</div>
              </div>
              <div className="ml-16 md:ml-0 flex flex-col">
                <p className="hidden md:block text-slate-900 dark:text-white text-lg font-bold">Première mission</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Postulez et gagnez vos premiers contrats</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href={`/onboarding/etape?role=${role}`}
              className="px-10 py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              Commencer l&apos;aventure
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white dark:bg-neutral-dark/80 py-12 px-6 lg:px-20 border-t border-border-dark">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary/20 flex items-center justify-center rounded-lg text-primary">
              <span className="material-symbols-outlined">language</span>
            </div>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold">FreelanceHigh</h2>
          </div>
          <div className="flex gap-8 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <Link href="/cgu" className="hover:text-primary">Conditions</Link>
            <Link href="/confidentialite" className="hover:text-primary">Confidentialité</Link>
            <Link href="/contact" className="hover:text-primary">Contact</Link>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">© 2026 FreelanceHigh. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
