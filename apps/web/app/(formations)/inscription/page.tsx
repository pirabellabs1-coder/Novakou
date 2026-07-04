"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Mic,
  Search,
  Share2,
  ShieldCheck,
  Store,
  type LucideIcon,
} from "lucide-react";

type TabType = "vendeur" | "apprenant" | "mentor" | "affilie";
const ROLE_ORDER: TabType[] = ["vendeur", "apprenant", "mentor", "affilie"];
const VALID_ROLES: TabType[] = ROLE_ORDER;

// Map tab choice → formationsRole stored in DB (single source of truth for routing)
const roleToFormationsRole: Record<string, "instructeur" | "apprenant" | "mentor" | "affilie" | undefined> = {
  vendeur: "instructeur",
  apprenant: "apprenant",
  mentor: "mentor",
  affilie: "affilie",
};

/* ─────────────────────────────────────────────────────────────────────────────
   Thème par rôle : couleurs, dégradé du héro, contenus (accroche, bénéfices,
   statistiques) et libellés du formulaire.
──────────────────────────────────────────────────────────────────────────── */

interface RoleTheme {
  id: TabType;
  icon: LucideIcon;
  /** Couleur de base du rôle (pastille, bordure, bouton). */
  color: string;
  /** Fin du dégradé du bouton de soumission. */
  gradTo: string;
  /** Accent lumineux lisible sur fond sombre (icônes du héro). */
  heroAccent: string;
  /** Dégradé complet du panneau héro (vert sombre → couleur du rôle). */
  heroBg: string;
  cardTitle: string;
  cardDesc: string;
  heroTitle: string[];
  heroBenefits: string[];
  heroStats: { value: string; label: string }[];
  formTitle: string;
  formSubtitle: string;
  submitLabel: string;
}

const ROLES: Record<TabType, RoleTheme> = {
  vendeur: {
    id: "vendeur",
    icon: Store,
    color: "#006e2f",
    gradTo: "#22c55e",
    heroAccent: "#4ade80",
    heroBg:
      "radial-gradient(560px circle at 85% 12%, rgba(74,222,128,0.20), transparent 55%), linear-gradient(152deg, #04150c 0%, #06371c 50%, #0b7a39 100%)",
    cardTitle: "Je vends",
    cardDesc: "Formations, ebooks, produits digitaux",
    heroTitle: ["Créez votre boutique,", "vendez vos savoirs", "en ligne."],
    heroBenefits: [
      "Votre boutique en ligne prête en 5 minutes",
      "Paiement Mobile Money intégré : Orange, Wave, MTN",
      "Vos fonds disponibles sous 48 h",
      "0 % de frais pendant les 30 premiers jours",
    ],
    heroStats: [
      { value: "0 %", label: "Frais 30 jours" },
      { value: "48 h", label: "Paiement" },
      { value: "7j/7", label: "Support FR" },
    ],
    formTitle: "Créez votre boutique gratuitement",
    formSubtitle: "Votre espace de vente prêt en quelques minutes.",
    submitLabel: "Créer ma boutique",
  },
  apprenant: {
    id: "apprenant",
    icon: GraduationCap,
    color: "#2563eb",
    gradTo: "#3b82f6",
    heroAccent: "#60a5fa",
    heroBg:
      "radial-gradient(560px circle at 85% 12%, rgba(96,165,250,0.20), transparent 55%), linear-gradient(152deg, #04150c 0%, #0a2547 50%, #2563eb 100%)",
    cardTitle: "J’apprends",
    cardDesc: "Accès à tout le catalogue",
    heroTitle: ["Apprenez auprès", "des meilleurs experts", "francophones."],
    heroBenefits: [
      "Un catalogue de formations créées par des experts",
      "Accès à vie à toutes vos formations achetées",
      "Paiement local : Mobile Money et carte bancaire",
      "Attestations de réussite à valoriser",
    ],
    heroStats: [
      { value: "À vie", label: "Accès aux achats" },
      { value: "100 %", label: "Paiement sécurisé" },
      { value: "7j/7", label: "Support FR" },
    ],
    formTitle: "Apprenez sans limites",
    formSubtitle: "Accédez au catalogue et progressez à votre rythme.",
    submitLabel: "Commencer à apprendre",
  },
  mentor: {
    id: "mentor",
    icon: Mic,
    color: "#d97706",
    gradTo: "#f59e0b",
    heroAccent: "#fbbf24",
    heroBg:
      "radial-gradient(560px circle at 85% 12%, rgba(251,191,36,0.18), transparent 55%), linear-gradient(152deg, #04150c 0%, #3f2408 50%, #c96d05 100%)",
    cardTitle: "Je coache",
    cardDesc: "Sessions de mentorat 1:1",
    heroTitle: ["Partagez votre expertise,", "monétisez votre temps."],
    heroBenefits: [
      "Sessions de mentorat 1:1 en visioconférence",
      "Agenda intégré : vous choisissez vos disponibilités",
      "Votre tarif par session, fixé librement",
      "Paiements sécurisés, versés sous 48 h",
    ],
    heroStats: [
      { value: "1:1", label: "Sessions privées" },
      { value: "Libre", label: "Votre tarif" },
      { value: "48 h", label: "Paiement" },
    ],
    formTitle: "Devenez mentor rémunéré",
    formSubtitle: "Transformez votre expérience en revenus réguliers.",
    submitLabel: "Devenir mentor",
  },
  affilie: {
    id: "affilie",
    icon: Share2,
    color: "#7c3aed",
    gradTo: "#8b5cf6",
    heroAccent: "#a78bfa",
    heroBg:
      "radial-gradient(560px circle at 85% 12%, rgba(167,139,250,0.20), transparent 55%), linear-gradient(152deg, #04150c 0%, #241250 50%, #7c3aed 100%)",
    cardTitle: "J’affilie",
    cardDesc: "40 % de commission par vente",
    heroTitle: ["Recommandez, partagez,", "gagnez 40 % par vente."],
    heroBenefits: [
      "40 % de commission sur chaque vente apportée",
      "Votre lien d’affiliation unique, prêt en 1 minute",
      "Statistiques en direct : clics, ventes, gains",
      "Commissions versées sous 48 h",
    ],
    heroStats: [
      { value: "40 %", label: "Commission" },
      { value: "30 j", label: "Cookie de suivi" },
      { value: "48 h", label: "Paiement" },
    ],
    formTitle: "Gagnez 40 % de commission",
    formSubtitle: "Partagez votre lien unique et suivez vos gains en direct.",
    submitLabel: "Devenir affilié",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Pays : Afrique francophone d'abord, puis anglophone, international, autre.
──────────────────────────────────────────────────────────────────────────── */

const COUNTRIES: string[] = [
  "Bénin",
  "Côte d’Ivoire",
  "Sénégal",
  "Cameroun",
  "Togo",
  "Burkina Faso",
  "Mali",
  "Niger",
  "Guinée",
  "RD Congo",
  "Congo",
  "Gabon",
  "Tchad",
  "Mauritanie",
  "Madagascar",
  "Rwanda",
  "Burundi",
  "Djibouti",
  "Comores",
  "Maroc",
  "Algérie",
  "Tunisie",
  "Ghana",
  "Nigeria",
  "Kenya",
  "Afrique du Sud",
  "France",
  "Belgique",
  "Suisse",
  "Canada",
  "États-Unis",
  "Haïti",
  "Autre pays",
];

function normalizeStr(s: string): string {
  // NFD sépare les lettres de leurs accents ; le filtre [^a-z0-9] retire
  // ensuite les signes diacritiques — recherche insensible aux accents.
  return s.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/* ─────────────────────────────────────────────────────────────────────────────
   Règles de mot de passe — alignées sur l'API (/api/auth/register) :
   ≥ 10 caractères, 1 majuscule, 1 minuscule, 1 chiffre.
──────────────────────────────────────────────────────────────────────────── */

const PASSWORD_RULES: { id: string; label: string; test: (p: string) => boolean }[] = [
  { id: "len", label: "10 caractères minimum", test: (p) => p.length >= 10 },
  { id: "upper", label: "Une majuscule", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Une minuscule", test: (p) => /[a-z]/.test(p) },
  { id: "digit", label: "Un chiffre", test: (p) => /[0-9]/.test(p) },
];

const INPUT_BASE =
  "w-full rounded-xl border bg-white text-sm text-[#191c1e] placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/25 focus:border-[#006e2f]";

/* ─────────────────────────────────────────────────────────────────────────────
   Sélecteur de pays : dropdown custom recherchable (clavier, clic extérieur).
──────────────────────────────────────────────────────────────────────────── */

function CountrySelect({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (country: string) => void;
  invalid: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = normalizeStr(query);
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => normalizeStr(c).includes(q));
  }, [query]);

  // Fermeture au clic extérieur + touche Échap
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onDocKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, [open]);

  // À l'ouverture : recherche vide + focus sur le champ de recherche
  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  // Garde l'option surlignée visible dans la liste
  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  function select(country: string) {
    onChange(country);
    setOpen(false);
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = filtered[highlight];
      if (c) select(c);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${INPUT_BASE} flex items-center gap-2.5 py-3 pl-10 pr-3.5 text-left ${
          invalid ? "border-red-300" : "border-gray-200"
        }`}
      >
        <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c647a]" />
        <span className={`flex-1 truncate ${value ? "text-[#191c1e]" : "text-gray-400"}`}>
          {value || "Sélectionnez votre pays"}
        </span>
        <ChevronDown
          size={17}
          className={`flex-shrink-0 text-[#5c647a] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="nk-fade-up absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c647a]" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Rechercher un pays…"
                aria-label="Rechercher un pays"
                className="w-full rounded-lg bg-gray-50 py-2 pl-9 pr-3 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/25"
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-[#5c647a]">Aucun pays trouvé</p>
          ) : (
            <ul ref={listRef} role="listbox" aria-label="Pays" className="max-h-56 overflow-y-auto py-1">
              {filtered.map((c, i) => {
                const selected = c === value;
                return (
                  <li key={c} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => select(c)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors duration-150 ${
                        i === highlight ? "bg-gray-50" : ""
                      } ${selected ? "font-semibold text-[#006e2f]" : "text-[#191c1e]"}`}
                    >
                      <span className="truncate">{c}</span>
                      {selected && <Check size={15} strokeWidth={3} className="flex-shrink-0 text-[#006e2f]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Carte de rôle : pastille colorée, titre, sous-titre, coche animée.
──────────────────────────────────────────────────────────────────────────── */

function RoleCard({ role, active, onSelect }: { role: RoleTheme; active: boolean; onSelect: () => void }) {
  const Icon = role.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group relative rounded-2xl border-2 bg-white p-3.5 text-left transition-all duration-300 ${
        active ? "shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
      style={active ? { borderColor: role.color, boxShadow: `0 6px 22px -8px ${role.color}55` } : undefined}
    >
      {active && (
        <span
          className="nk-pop absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: role.color }}
        >
          <Check size={11} strokeWidth={3.5} className="text-white" />
        </span>
      )}
      <span
        className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
        style={
          active
            ? { background: role.color, color: "#ffffff", boxShadow: `0 0 0 4px ${role.color}1f` }
            : { background: `${role.color}14`, color: role.color }
        }
      >
        <Icon size={19} />
      </span>
      <span className="block text-[13px] font-bold text-[#191c1e]">{role.cardTitle}</span>
      <span className="mt-0.5 block truncate text-[11px] leading-snug text-[#5c647a]">{role.cardDesc}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page d'inscription
──────────────────────────────────────────────────────────────────────────── */

function InscriptionInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get("role");
  const callbackUrl = searchParams.get("callbackUrl") ?? searchParams.get("returnTo") ?? undefined;
  const initialTab: TabType = VALID_ROLES.includes(roleParam as TabType) ? (roleParam as TabType) : "vendeur";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [countryError, setCountryError] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (VALID_ROLES.includes(roleParam as TabType)) setActiveTab(roleParam as TabType);
  }, [roleParam]);

  const role = ROLES[activeTab];
  const formationsRole = roleToFormationsRole[activeTab];
  const passwordValid = PASSWORD_RULES.every((r) => r.test(password));

  const redirectAfterAuth =
    callbackUrl ??
    (activeTab === "vendeur"
      ? "/vendeur/dashboard"
      : activeTab === "mentor"
        ? "/mentor/dashboard"
        : activeTab === "affilie"
          ? "/affilie/dashboard"
          : "/apprenant/dashboard");

  async function handleGoogle() {
    setLoading(true);
    // Store desired role in cookie so OAuth callback can pick it up
    if (formationsRole) {
      document.cookie = `pendingFormationsRole=${formationsRole}; path=/; max-age=300; SameSite=Lax`;
    }
    await signIn("google", { callbackUrl: redirectAfterAuth });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) { setError("Le prénom est requis."); return; }
    if (!country) { setCountryError(true); setError("Veuillez sélectionner votre pays."); return; }
    if (!email) { setError("L’adresse e-mail est requise."); return; }
    if (!passwordValid) { setError("Le mot de passe ne respecte pas encore tous les critères de sécurité."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (!accepted) { setError("Veuillez accepter les conditions générales d’utilisation."); return; }

    setLoading(true);

    try {
      // 1. Create account
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          role: activeTab === "vendeur" ? "freelance" : activeTab === "mentor" ? "freelance" : "client",
          formationsRole,
          country,
        }),
      });
      const registerJson = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerJson.error ?? "Erreur lors de la création du compte.");
        setLoading(false);
        return;
      }

      // 2. If new account requires email verification, redirect to OTP page.
      //    Password is passed so auto-login can happen right after verification.
      if (registerJson.requiresVerification) {
        const params = new URLSearchParams({
          email: email.trim().toLowerCase(),
          callbackUrl: redirectAfterAuth,
          p: password,
        });
        router.push(`/verifier-email?${params.toString()}`);
        return;
      }

      // 3. Existing account where only formationsRole was updated → direct sign-in
      const signInResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      // If email not verified yet → force OTP flow
      if (signInResult?.error === "EMAIL_NOT_VERIFIED") {
        const params = new URLSearchParams({
          email: email.trim().toLowerCase(),
          callbackUrl: redirectAfterAuth,
          p: password,
        });
        router.push(`/verifier-email?${params.toString()}`);
        return;
      }

      if (signInResult?.error) {
        router.push(`/connexion?callbackUrl=${encodeURIComponent(redirectAfterAuth)}&registered=1`);
        return;
      }

      router.push(redirectAfterAuth);
      router.refresh();
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion.");
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-[calc(100vh-64px)] bg-[#f7f9fb] lg:h-[calc(100vh-64px)] lg:min-h-[640px]"
      style={{ fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <style>{`
        @keyframes nkFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes nkFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nkPop { 0% { opacity: 0; transform: scale(0.4); } 70% { transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        .nk-fade-up { animation: nkFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .nk-fade { animation: nkFade 0.4s ease both; }
        .nk-pop { animation: nkPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>

      {/* ── Volet gauche : héro immersif ─────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden lg:flex lg:w-1/2 xl:w-[45%]">
        {/* Dégradés par rôle, en fondu croisé */}
        {ROLE_ORDER.map((id) => (
          <div
            key={id}
            aria-hidden
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ background: ROLES[id].heroBg, opacity: activeTab === id ? 1 : 0 }}
          />
        ))}
        {/* Motifs décoratifs : grille de points + anneaux concentriques */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1.4px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div aria-hidden className="absolute -left-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div aria-hidden className="absolute -left-10 -top-10 h-52 w-52 rounded-full border border-white/10" />
        <div aria-hidden className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full border border-white/10" />
        <div aria-hidden className="absolute -bottom-16 -right-4 h-64 w-64 rounded-full border border-white/10" />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="inline-flex w-fit items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/25 bg-white/15 backdrop-blur-sm">
              <span className="text-sm font-extrabold tracking-tight text-white">NK</span>
            </span>
            <span className="text-lg font-bold text-white">Novakou</span>
          </Link>

          <div key={activeTab} className="nk-fade-up py-8">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: role.heroAccent }} />
              <span className="text-xs font-semibold tracking-wide text-white/90">
                Plateforme n°1 en Afrique francophone
              </span>
            </span>

            <h1 className="mb-8 text-[2rem] font-extrabold leading-[1.12] tracking-tight text-white xl:text-[2.5rem]">
              {role.heroTitle.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <div className="mb-9 space-y-3.5">
              {role.heroBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 size={19} style={{ color: role.heroAccent }} className="mt-px flex-shrink-0" />
                  <p className="text-[15px] leading-snug text-white/85">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {role.heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-3.5 text-center backdrop-blur-md"
                >
                  <p className="text-lg font-extrabold text-white xl:text-xl">{stat.value}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-white/65">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ShieldCheck size={17} className="flex-shrink-0 text-white/70" />
            <p className="text-xs text-white/70">
              Paiements sécurisés · Données protégées · Plateforme 100&nbsp;% africaine
            </p>
          </div>
        </div>
      </aside>

      {/* ── Volet droit : formulaire ─────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 lg:overflow-y-auto xl:w-[55%]">
        <div className="flex justify-center px-4 py-8 sm:px-6 lg:py-10">
          <div className="w-full max-w-xl">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#006e2f]">
                <span className="text-xs font-extrabold text-white">NK</span>
              </span>
              <span className="text-base font-bold text-[#191c1e]">Novakou</span>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div key={activeTab} className="nk-fade mb-6">
                <h2 className="mb-1.5 text-2xl font-extrabold leading-tight text-[#191c1e]">{role.formTitle}</h2>
                <p className="text-sm text-[#5c647a]">{role.formSubtitle}</p>
              </div>

              {/* Sélecteur de rôles */}
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5c647a]">Votre profil</p>
              <div className="mb-6 grid grid-cols-2 gap-2.5">
                {ROLE_ORDER.map((id) => (
                  <RoleCard key={id} role={ROLES[id]} active={activeTab === id} onSelect={() => setActiveTab(id)} />
                ))}
              </div>

              {/* Google OAuth */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-[#191c1e] transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </button>

              <div className="relative mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="flex-shrink-0 text-xs font-medium text-[#5c647a]">ou</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {/* Erreur */}
              {error && (
                <div role="alert" className="nk-fade mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="prenom" className="mb-1.5 block text-xs font-semibold text-[#191c1e]">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="prenom"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Aminata"
                      required
                      autoComplete="given-name"
                      className={`${INPUT_BASE} border-gray-200 px-3.5 py-3`}
                    />
                  </div>
                  <div>
                    <label htmlFor="nom" className="mb-1.5 block text-xs font-semibold text-[#191c1e]">
                      Nom
                    </label>
                    <input
                      id="nom"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Diallo"
                      autoComplete="family-name"
                      className={`${INPUT_BASE} border-gray-200 px-3.5 py-3`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#191c1e]">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <CountrySelect
                    value={country}
                    invalid={countryError}
                    onChange={(c) => {
                      setCountry(c);
                      setCountryError(false);
                      if (error === "Veuillez sélectionner votre pays.") setError(null);
                    }}
                  />
                  {countryError && !country && (
                    <p className="mt-1 text-[11px] font-medium text-red-500">Veuillez sélectionner votre pays.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#191c1e]">
                    Adresse e-mail <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c647a]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      required
                      autoComplete="email"
                      className={`${INPUT_BASE} border-gray-200 py-3 pl-10 pr-4`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#191c1e]">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c647a]" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="10 caractères minimum"
                      required
                      autoComplete="new-password"
                      className={`${INPUT_BASE} border-gray-200 py-3 pl-10 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5c647a] transition-colors hover:text-[#191c1e]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* Checklist live — alignée sur les exigences de l'API */}
                  <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <div key={rule.id} className="flex items-center gap-1.5">
                          <span
                            className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                              ok ? "bg-[#16a34a]" : "bg-gray-200"
                            }`}
                          >
                            <Check size={9} strokeWidth={3.5} className="text-white" />
                          </span>
                          <span
                            className={`text-[11px] font-medium transition-colors duration-300 ${
                              ok ? "text-[#16a34a]" : "text-[#5c647a]"
                            }`}
                          >
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold text-[#191c1e]">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c647a]" />
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Répétez votre mot de passe"
                      required
                      autoComplete="new-password"
                      className={`${INPUT_BASE} py-3 pl-10 pr-12 ${
                        confirm && confirm !== password ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5c647a] transition-colors hover:text-[#191c1e]"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="mt-1 text-[11px] font-medium text-red-500">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-[#006e2f]"
                  />
                  <label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-[#5c647a]">
                    J&apos;accepte les{" "}
                    <Link href="/cgu" className="font-semibold text-[#006e2f] hover:underline">
                      conditions générales
                    </Link>{" "}
                    et la{" "}
                    <Link href="/confidentialite" className="font-semibold text-[#006e2f] hover:underline">
                      politique de confidentialité
                    </Link>
                    .
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !accepted}
                  className="mt-1 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${role.color} 0%, ${role.gradTo} 100%)`,
                    boxShadow: `0 10px 22px -10px ${role.color}99`,
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Création du compte…
                    </span>
                  ) : (
                    <span key={activeTab} className="nk-fade flex items-center gap-2">
                      {role.submitLabel}
                      <ArrowRight size={17} />
                    </span>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-[#5c647a]">
                Déjà un compte&nbsp;?{" "}
                <Link href="/connexion" className="font-bold text-[#006e2f] hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#5c647a]">
              <Lock size={13} />
              Inscription gratuite · Aucune carte bancaire requise · Résiliable à tout moment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] bg-[#f7f9fb]" />}>
      <InscriptionInner />
    </Suspense>
  );
}
