import Link from "next/link";
import { Rocket } from "lucide-react";

const STEPS = [
  {
    number: 1,
    title: "Publiez votre mission",
    description:
      "Décrivez votre projet, vos besoins techniques et votre budget en moins de 2 minutes.",
  },
  {
    number: 2,
    title: "Sélectionnez votre expert",
    description:
      "Recevez des propositions qualifiées de freelances vérifiés et comparez les profils.",
  },
  {
    number: 3,
    title: "Collaborez en toute sécurité",
    description:
      "Payez via notre système de séquestre sécurisé. Les fonds ne sont libérés qu'après validation.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Visual */}
        <div className="relative order-2 lg:order-1">
          <div className="bg-primary/10 rounded-2xl w-full aspect-square absolute -rotate-3 z-0" />
          <div
            className="relative z-10 w-full aspect-square rounded-2xl shadow-2xl bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80')",
            }}
            role="img"
            aria-label="Équipe de freelances collaborant autour d'un ordinateur"
          />
          {/* Floating badge */}
          <div className="absolute -bottom-4 -right-4 rtl:-left-4 rtl:right-auto bg-white rounded-xl shadow-lg p-4 z-20 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-accent text-xl">✓</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Paiements</p>
                <p className="text-sm font-extrabold text-gray-900">Sécurisés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-10 order-1 lg:order-2">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              Comment ça marche ?
            </h2>
            <p className="text-gray-500 text-lg">
              Trouvez le talent qu&apos;il vous faut en quelques clics grâce à
              notre processus simplifié et sécurisé.
            </p>
          </div>

          <div className="space-y-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex gap-5">
                <div className="flex-none size-12 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-primary/20">
                  {step.number}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1.5">
                    {step.title}
                  </h4>
                  <p className="text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/inscription"
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 transition-all"
          >
            Lancer mon projet
            <Rocket className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
