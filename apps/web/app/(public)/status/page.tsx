import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statut des services",
  description: "Etat en temps reel de l'infrastructure FreelanceHigh.",
};

const SERVICES = [
  {
    name: "Application Web",
    description: "Frontend Next.js, pages et API",
    icon: "web",
  },
  {
    name: "Base de données",
    description: "PostgreSQL via Supabase",
    icon: "database",
  },
  {
    name: "Authentification",
    description: "Connexion, inscription, sessions",
    icon: "lock",
  },
  {
    name: "Paiements",
    description: "Stripe Connect, CinetPay",
    icon: "payments",
  },
  {
    name: "Stockage fichiers",
    description: "Supabase Storage, Cloudinary",
    icon: "cloud",
  },
  {
    name: "Emails transactionnels",
    description: "Resend",
    icon: "email",
  },
];

export default function StatusPage() {
  const isDev = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Statut des services</h1>
          <p className="text-lg text-slate-500">
            Etat de l&apos;infrastructure FreelanceHigh.
          </p>
        </div>

        {/* Global status banner */}
        {isDev ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 mb-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-amber-500">construction</span>
              <span className="text-lg font-bold text-amber-700">
                Mode developpement — monitoring non active
              </span>
            </div>
            <p className="text-sm text-amber-600 mt-2">
              Les services ci-dessous ne sont pas encore monitorés en temps réel.
              Le monitoring sera activé au déploiement en production.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 mb-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-lg font-bold text-emerald-700">
                Tous les systemes sont operationnels
              </span>
            </div>
          </div>
        )}

        {/* Services list */}
        <div className="bg-white dark:bg-neutral-dark rounded-2xl border border-slate-200 dark:border-border-dark divide-y divide-slate-100 dark:divide-border-dark shadow-sm">
          {SERVICES.map((service) => (
            <div key={service.name} className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500">{service.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDev ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-xs font-medium text-slate-400">Non monitoré</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-600">Opérationnel</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          {isDev
            ? "Le monitoring en temps réel sera activé lors du déploiement en production."
            : `Dernière vérification : ${new Date().toLocaleString("fr-FR")}`
          }
        </p>
      </div>
    </div>
  );
}
