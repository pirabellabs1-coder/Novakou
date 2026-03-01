import Link from "next/link";

export function CtaSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-24 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900 border border-primary/20 rounded-3xl p-10 sm:p-16 lg:p-20 text-center space-y-8 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 size-64 bg-primary/25 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 size-64 bg-secondary/15 blur-[100px] rounded-full" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white max-w-3xl mx-auto leading-tight">
              Prêt à transformer vos idées en{" "}
              <span className="text-primary">réalité numérique</span> ?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Rejoignez la plus grande communauté de talents digitaux
              francophones et boostez votre croissance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/explorer"
                className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-primary/20"
              >
                Trouver un freelance
              </Link>
              <Link
                href="/inscription"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-10 py-4 rounded-xl font-bold text-lg transition-all"
              >
                Devenir Freelance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
