"use client";

import { useRef } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

const TESTIMONIALS = [
  { name: "Amadou Ba", country: "🇸🇳 Sénégal", quote: "Grâce à FreelanceHigh, j'ai décroché mes premiers clients internationaux en 3 mois. Les formations sont concrètes et adaptées au contexte africain.", rating: 5, formation: "React & Next.js" },
  { name: "Mariama Traore", country: "🇨🇮 Côte d'Ivoire", quote: "La formation UI/UX Design m'a permis de tripler mes tarifs. L'instructeur est excellent et les projets pratiques sont un vrai plus.", rating: 5, formation: "UI/UX Design" },
  { name: "Ibrahim Sow", country: "🇲🇱 Mali", quote: "J'ai suivi la formation Python Data Science depuis Bamako. Le contenu est au niveau des meilleures plateformes internationales, mais avec des exemples qui me parlent.", rating: 5, formation: "Python Data Science" },
  { name: "Khady Ndiaye", country: "🇫🇷 France", quote: "Excellent rapport qualité-prix. J'ai appris Flutter en 4 semaines et j'ai déjà publié ma première app sur le Play Store.", rating: 4, formation: "Flutter Mobile" },
  { name: "Ousmane Diallo", country: "🇬🇳 Guinée", quote: "Le quiz final et le certificat sont un vrai bonus pour le CV. J'ai partagé le mien sur LinkedIn et reçu 3 propositions d'entretien.", rating: 5, formation: "Docker & Kubernetes" },
  { name: "Fatoumata Camara", country: "🇧🇫 Burkina Faso", quote: "Formation WordPress parfaite pour lancer mon activité. Gratuite en plus ! Merci FreelanceHigh de démocratiser l'accès au savoir.", rating: 5, formation: "WordPress" },
];

export default function TestimonialCarousel() {
  const t = useTranslations("formations");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center mb-2">{t("testimonials_title")}</h2>
        <p className="text-slate-500 text-center mb-10 text-sm">4.8/5 basé sur 60+ avis vérifiés</p>

        <div className="relative">
          {/* Navigation */}
          <button onClick={() => scroll("left")} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors hidden md:flex">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={() => scroll("right")} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors hidden md:flex">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          {/* Cards */}
          <div ref={scrollRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4" style={{ scrollbarWidth: "none" }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="flex-shrink-0 w-[320px] sm:w-[380px] snap-start bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`w-4 h-4 ${s < t.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                  ))}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1 mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.country} · {t.formation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
