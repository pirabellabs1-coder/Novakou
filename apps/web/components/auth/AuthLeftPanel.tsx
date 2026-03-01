import Link from "next/link";
import { Zap, Check } from "lucide-react";

interface AuthLeftPanelProps {
  headline?: React.ReactNode;
  subtext?: string;
  benefits?: string[];
}

const DEFAULT_BENEFITS = [
  "Accédez à des milliers de clients en Afrique et dans le monde",
  "Paiements sécurisés via escrow : Mobile Money, Stripe, PayPal",
  "Profil vérifié avec badges de confiance",
  "Support dédié francophone 7j/7",
];

export function AuthLeftPanel({
  headline,
  subtext,
  benefits = DEFAULT_BENEFITS,
}: AuthLeftPanelProps) {
  return (
    <div
      className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
      style={{
        background:
          "linear-gradient(145deg, #6C2BD9 0%, #4A1B9E 55%, #2D1060 100%)",
      }}
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern
              id="auth-grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
      </div>
      {/* Glow blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-sky-400/15 rounded-full blur-3xl" />

      {/* Logo */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="bg-white/15 p-2 rounded-xl">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <span className="text-white text-xl font-extrabold tracking-tight">
            FreelanceHigh
          </span>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest mb-6 w-fit">
          Plateforme francophone n°1
        </div>
        <h2 className="text-white text-4xl font-black leading-tight mb-4">
          {headline ?? (
            <>
              Élevez votre carrière
              <br />
              <span className="text-yellow-300">au plus haut niveau</span>
            </>
          )}
        </h2>
        <p className="text-white/70 text-base leading-relaxed mb-10 max-w-sm">
          {subtext ??
            "Rejoignez des milliers de professionnels en Afrique francophone, en France et dans la diaspora mondiale."}
        </p>
        <ul className="space-y-4">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
              <span className="text-white/80 text-sm leading-snug">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/15">
        <div>
          <span className="text-yellow-300 text-2xl font-bold block">12k+</span>
          <span className="text-white/60 text-xs">Freelances actifs</span>
        </div>
        <div className="w-px h-10 bg-white/20" />
        <div>
          <span className="text-yellow-300 text-2xl font-bold block">8 500+</span>
          <span className="text-white/60 text-xs">Projets terminés</span>
        </div>
        <div className="w-px h-10 bg-white/20" />
        <div>
          <span className="text-yellow-300 text-2xl font-bold block">28</span>
          <span className="text-white/60 text-xs">Pays couverts</span>
        </div>
      </div>
    </div>
  );
}
