import Link from "next/link";

const STEPS = [
  {
    number: 1,
    title: "Décrivez votre projet",
    description:
      "Dites-nous ce que vous cherchez. Publiez votre besoin ou parcourez notre catalogue de services freelance.",
  },
  {
    number: 2,
    title: "Trouvez l'expert idéal",
    description:
      "Comparez les profils, les portfolios et les avis. Échangez directement avec les freelances avant de vous engager.",
  },
  {
    number: 3,
    title: "Collaborez en confiance",
    description:
      "Paiement sécurisé par séquestre. Vos fonds sont protégés jusqu'à ce que vous soyez satisfait de la livraison.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-32 px-6 lg:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        {/* Visual */}
        <div className="relative order-2 lg:order-1 overflow-hidden">
          <div className="bg-accent/10 rounded-[3rem] w-full aspect-square absolute -rotate-6 z-0 border border-accent/20"></div>
          <img
            alt="Collaboration entre client et freelance"
            className="relative z-10 w-full aspect-square object-cover rounded-[3rem] shadow-2xl"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU-wjNmvoaekii1VavUXeH1NsSrY4IxYrzNNkTbCP8yKbfy1k_TDeZhsNcFxkTJeixI5PfZ3lPN3DXitH98toGdsHGA3QEPVNUMsRJcTEZ1kPA67JZrE1WYBDQl1BF91GUVn7T07qLGjcz-eSWPFRr4Lo2feTVSi1k3mcwpO1UW0P_ceWrYmdf9frG9yLFLjlNPDfwX5xUJiKodovaeyIgF_XnSDmuGO0-n1_rgYfJbv8OihuopGfISoad4bbM3SBwAkfp6yFhKD9o"
          />
          {/* Floating card */}
          <div className="absolute -bottom-8 right-0 sm:-right-8 z-20 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl border border-primary/10 max-w-[200px] sm:max-w-xs">
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">verified</span>
              <p className="font-bold text-lg leading-tight">Satisfaction garantie</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chaque freelance est vérifié. Vous ne payez que lorsque le travail vous satisfait pleinement.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12 order-1 lg:order-2">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Simple, rapide et <span className="text-primary">sécurisé</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              En 3 étapes, trouvez le freelance parfait et lancez votre projet en toute sérénité.
            </p>
          </div>

          <div className="space-y-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex gap-6 items-start">
                <div className="flex-none size-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-primary/20">
                  {step.number}
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/inscription"
            className="inline-flex items-center gap-4 bg-primary hover:bg-primary/90 text-white rounded-2xl px-10 py-5 text-xl font-bold shadow-2xl shadow-primary/20 transition-all group"
          >
            Commencer gratuitement
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
