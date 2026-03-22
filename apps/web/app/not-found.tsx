import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
          <span className="material-symbols-outlined text-5xl text-primary">explore_off</span>
        </div>

        <h1 className="text-6xl font-black text-white mb-4">404</h1>
        <h2 className="text-xl font-bold text-white mb-3">Page introuvable</h2>
        <p className="text-slate-400 mb-8">
          La page que vous recherchez n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Retour &agrave; l&apos;accueil
          </Link>
          <Link
            href="/explorer"
            className="inline-flex items-center gap-2 bg-white/5 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors border border-border-dark"
          >
            <span className="material-symbols-outlined text-lg">search</span>
            Explorer
          </Link>
        </div>
      </div>
    </div>
  );
}
