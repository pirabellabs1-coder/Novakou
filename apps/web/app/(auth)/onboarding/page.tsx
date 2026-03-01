"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, ArrowRight, ArrowLeft, Check, Plus, X,
  Camera, MapPin, Globe, DollarSign,
  Users, Shield, Briefcase, Star, Sparkles,
  Building2, UserCircle, Target, Search,
  Mail, ChevronDown, Trash2, Moon, Sun,
  TrendingUp, Clock, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "freelance" | "client" | "agence";

// ─── Step metadata ─────────────────────────────────────────────────────
const STEPS: Record<Role, { title: string; subtitle: string; icon: React.ElementType }[]> = {
  freelance: [
    { title: "Votre identité pro", subtitle: "Créez votre vitrine professionnelle", icon: UserCircle },
    { title: "Tarif & disponibilité", subtitle: "Définissez vos conditions de travail", icon: Star },
  ],
  client: [
    { title: "Votre entreprise", subtitle: "Présentez votre structure", icon: Building2 },
    { title: "Vos besoins", subtitle: "Ce que vous cherchez sur la plateforme", icon: Target },
  ],
  agence: [
    { title: "Votre agence", subtitle: "Identité et positionnement", icon: Sparkles },
    { title: "Votre équipe", subtitle: "Invitez vos premiers collaborateurs", icon: Users },
  ],
};

// ─── Left panel content per role ────────────────────────────────────────
const LEFT_PANEL = {
  freelance: {
    title: "Transformez vos compétences en revenus",
    bullets: [
      { icon: TrendingUp, text: "Profil visible par 12 000+ clients actifs" },
      { icon: Shield, text: "Paiements sécurisés via escrow garanti" },
      { icon: Award, text: "Commissions réduites dès le plan Pro" },
    ],
    testimonial: {
      text: "J'ai généré €3 200 en 3 semaines. La plateforme est vraiment fluide et sécurisée.",
      author: "Aminata D.",
      role: "Développeuse React · Dakar",
      initials: "AD",
      color: "from-purple-400 to-pink-500",
    },
  },
  client: {
    title: "Trouvez le talent parfait en 24h",
    bullets: [
      { icon: Search, text: "12 000+ freelances vérifiés et notés" },
      { icon: Shield, text: "Fonds bloqués et libérés uniquement à la validation" },
      { icon: Clock, text: "Délai garanti ou remboursement intégral" },
    ],
    testimonial: {
      text: "Notre application a été livrée en 2 semaines. Qualité impeccable, équipe vraiment réactive.",
      author: "Marie K.",
      role: "Directrice Marketing · Dakar",
      initials: "MK",
      color: "from-blue-400 to-cyan-500",
    },
  },
  agence: {
    title: "Gérez votre équipe comme un pro",
    bullets: [
      { icon: Users, text: "Dashboard équipe centralisé en temps réel" },
      { icon: Briefcase, text: "Projets, devis et contrats en un seul endroit" },
      { icon: TrendingUp, text: "Commission réduite à 8% pour les agences" },
    ],
    testimonial: {
      text: "On a doublé notre chiffre d'affaires en 6 mois grâce à l'espace agence.",
      author: "Studio Krea",
      role: "Agence digitale · Abidjan",
      initials: "SK",
      color: "from-orange-400 to-red-500",
    },
  },
};

// ─── Form data ─────────────────────────────────────────────────────────
const SKILL_SUGGESTIONS = [
  "React", "Next.js", "TypeScript", "Vue.js", "Node.js", "Python", "Django",
  "Flutter", "React Native", "Swift", "Kotlin", "UI/UX Design", "Figma",
  "Photoshop", "Illustrator", "Motion Design", "Rédaction Web", "SEO",
  "Community Management", "WordPress", "Shopify", "Traduction FR/EN",
];

const SERVICE_TYPES = [
  "Développement Web", "Application Mobile", "Design UI/UX", "Identité Visuelle",
  "Rédaction & SEO", "Community Management", "Vidéo & Montage", "Motion Design",
  "Conseil Stratégique", "Traduction", "Support IT", "E-commerce",
];

const COUNTRIES = [
  "Sénégal", "Côte d'Ivoire", "Cameroun", "Mali", "Burkina Faso",
  "Bénin", "Togo", "Niger", "Guinée", "Madagascar",
  "France", "Belgique", "Canada", "Maroc", "Tunisie", "Autre",
];

const SECTORS = [
  "Technologie & Digital", "Finance & Banque", "Commerce & Distribution",
  "Éducation & Formation", "Santé & Bien-être", "Médias & Communication",
  "Agriculture", "Industrie & BTP", "Tourisme & Hôtellerie", "ONG & Secteur public", "Autre",
];

const BUDGETS = [
  { label: "< 500 €", value: "lt500" },
  { label: "500 – 2k €", value: "500-2k" },
  { label: "2k – 5k €", value: "2k-5k" },
  { label: "5k – 15k €", value: "5k-15k" },
  { label: "15k € +", value: "gt15k" },
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const TEAM_SIZES = ["Solo (1)", "2–5", "6–15", "16–50", "50+"];

const AGENCY_ROLES = [
  { id: "admin", label: "Admin agence", desc: "Accès complet, gère les membres et finances", icon: Shield, color: "#6C2BD9" },
  { id: "manager", label: "Manager", desc: "Gère les projets et assigne les tâches", icon: Briefcase, color: "#0ea5e9" },
  { id: "membre", label: "Freelance membre", desc: "Exécute les commandes assignées", icon: UserCircle, color: "#10b981" },
  { id: "commercial", label: "Commercial", desc: "Prospecte et gère la relation client", icon: Search, color: "#f59e0b" },
];

// ─── Shared input classes ──────────────────────────────────────────────
const INPUT = "w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm text-gray-800 placeholder:text-gray-400 transition-all duration-200";
const INPUT_PLAIN = "w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm text-gray-800 placeholder:text-gray-400 transition-all duration-200";

function FieldIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
      <Icon className="w-4 h-4 text-gray-400" />
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {children}
    </label>
  );
}

// ─── Platform mockup illustrations ────────────────────────────────────
function FreelanceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        {/* Profile row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-2.5 w-28 bg-white/70 rounded-full" />
            <div className="h-2 w-20 bg-white/40 rounded-full mt-1.5" />
          </div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-300 text-yellow-300" />
            ))}
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Revenus", value: "€3.2k" },
            { label: "Commandes", value: "47" },
            { label: "Note", value: "4.9" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-white/60 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {/* Mini chart */}
        <div className="h-14 rounded-xl overflow-hidden">
          <svg viewBox="0 0 220 56" className="w-full h-full">
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.25" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,44 C30,40 50,48 80,32 C110,16 130,28 160,14 C180,6 200,10 220,4"
              fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.7"
            />
            <path
              d="M0,44 C30,40 50,48 80,32 C110,16 130,28 160,14 C180,6 200,10 220,4 L220,56 L0,56 Z"
              fill="url(#grad1)"
            />
          </svg>
        </div>
      </div>
      {/* Floating badge */}
      <div className="absolute -top-2 -right-2 bg-green-400 text-green-900 text-xs font-black px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
        +€847 ce mois
      </div>
      {/* New message notification */}
      <div className="absolute -bottom-2 -left-2 bg-white/15 backdrop-blur border border-white/30 rounded-xl px-3 py-1.5 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center">
          <Mail className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-white text-xs font-semibold">Nouvelle commande</span>
      </div>
    </div>
  );
}

function ClientMockup() {
  const freelancers = [
    { initials: "AD", name: "Aminata D.", skill: "Dev React", rate: "€45/h", rating: "5.0", color: "from-purple-400 to-pink-400", highlight: false },
    { initials: "KM", name: "Kofi M.", skill: "UI/UX Design", rate: "€38/h", rating: "4.9", color: "from-blue-400 to-cyan-400", highlight: true },
    { initials: "SL", name: "Sarah L.", skill: "Motion Design", rate: "€55/h", rating: "4.8", color: "from-orange-400 to-yellow-400", highlight: false },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[280px] space-y-2">
      {freelancers.map((f) => (
        <div
          key={f.initials}
          className={cn(
            "bg-white/10 backdrop-blur-sm rounded-xl p-3 border flex items-center gap-3 transition-all",
            f.highlight ? "border-white/50 bg-white/20" : "border-white/20"
          )}
        >
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${f.color} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
            {f.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold">{f.name}</p>
            <p className="text-white/60 text-xs">{f.skill}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white text-sm font-bold">{f.rate}</p>
            <p className="text-yellow-300 text-xs font-semibold">★ {f.rating}</p>
          </div>
        </div>
      ))}
      <div className="absolute -top-2 -right-2 bg-blue-400 text-blue-900 text-xs font-black px-2.5 py-1 rounded-full shadow-lg">
        12 000+ talents
      </div>
    </div>
  );
}

function AgenceMockup() {
  const members = [
    { initials: "AK", name: "Adjoua K.", role: "Designer", status: "En mission", dot: "bg-green-400" },
    { initials: "MT", name: "Moussa T.", role: "Dev Senior", status: "Disponible", dot: "bg-blue-400" },
    { initials: "LM", name: "Laura M.", role: "Manager", status: "En réunion", dot: "bg-yellow-400" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-3">Mon équipe</p>
        <div className="space-y-2.5">
          {members.map((m) => (
            <div key={m.initials} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                {m.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">{m.name}</p>
                <p className="text-white/50 text-[10px]">{m.role}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                <span className="text-white/70 text-[10px] font-semibold">{m.status}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2">
          {[
            { value: "€28k", label: "CA ce mois" },
            { value: "14", label: "Projets actifs" },
            { value: "4.9", label: "Note moy." },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-white/50 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -top-2 -right-2 bg-orange-400 text-orange-900 text-xs font-black px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
        3 devis en attente
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────
export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rp = (searchParams.get("role") ?? "freelance") as Role;
  const role: Role = ["freelance", "client", "agence"].includes(rp) ? rp : "freelance";
  const steps = STEPS[role];
  const panel = LEFT_PANEL[role];

  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const totalSteps = steps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  // ── File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Freelance state
  const [fl, setFl] = useState({
    photoUrl: "", photoError: "",
    titre: "", pays: "", ville: "",
    skills: [] as string[], skillInput: "",
    tarifHoraire: "", currency: "EUR",
    days: [] as string[],
  });

  // ── Client state
  const [cl, setCl] = useState({
    nomEntreprise: "", secteur: "", besoin: "",
    budget: "", services: [] as string[], serviceInput: "", siteWeb: "",
  });

  // ── Agence state
  const [ag, setAg] = useState({
    nomAgence: "", secteur: "", taille: "",
    description: "", pays: "", siteWeb: "",
    invites: [] as { email: string; role: string }[],
    inputEmail: "", inputRole: "membre",
  });

  // ── Photo upload
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFl((p) => ({ ...p, photoError: "Format non supporté. Utilisez JPG, PNG ou WEBP." }));
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFl((p) => ({ ...p, photoError: "Image trop lourde (max 5 Mo)" }));
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFl((p) => ({ ...p, photoUrl: ev.target?.result as string, photoError: "" }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ── Skills
  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = fl.skillInput.replace(/,/g, "").trim();
      if (val && !fl.skills.includes(val)) {
        setFl((p) => ({ ...p, skills: [...p.skills, val], skillInput: "" }));
      } else {
        setFl((p) => ({ ...p, skillInput: "" }));
      }
    }
    if (e.key === "Backspace" && fl.skillInput === "" && fl.skills.length > 0) {
      setFl((p) => ({ ...p, skills: p.skills.slice(0, -1) }));
    }
  }

  function addSkillSuggestion(skill: string) {
    if (!fl.skills.includes(skill)) setFl((p) => ({ ...p, skills: [...p.skills, skill] }));
  }

  function removeSkill(skill: string) {
    setFl((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  }

  // ── Services (client)
  function addService(s: string) {
    const val = s.trim();
    if (val && !cl.services.includes(val)) {
      setCl((p) => ({ ...p, services: [...p.services, val], serviceInput: "" }));
    }
  }

  function removeService(s: string) {
    setCl((p) => ({ ...p, services: p.services.filter((x) => x !== s) }));
  }

  function handleServiceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = cl.serviceInput.replace(/,/g, "").trim();
      if (val && !cl.services.includes(val)) {
        setCl((p) => ({ ...p, services: [...p.services, val], serviceInput: "" }));
      } else {
        setCl((p) => ({ ...p, serviceInput: "" }));
      }
    }
    if (e.key === "Backspace" && cl.serviceInput === "" && cl.services.length > 0) {
      setCl((p) => ({ ...p, services: p.services.slice(0, -1) }));
    }
  }

  function toggleDay(d: string) {
    setFl((p) => ({ ...p, days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d] }));
  }

  function addInvite() {
    if (ag.inputEmail && !ag.invites.find((i) => i.email === ag.inputEmail)) {
      setAg((p) => ({ ...p, invites: [...p.invites, { email: p.inputEmail, role: p.inputRole }], inputEmail: "" }));
    }
  }

  function removeInvite(email: string) {
    setAg((p) => ({ ...p, invites: p.invites.filter((i) => i.email !== email) }));
  }

  // ── Navigation with fade transition
  function animateStep(fn: () => void) {
    setVisible(false);
    setTimeout(() => {
      fn();
      setTimeout(() => setVisible(true), 20);
    }, 180);
  }

  function goNext() {
    animateStep(() => {
      if (step < totalSteps - 1) setStep((s) => s + 1);
      else finish();
    });
  }

  function goBack() {
    if (step === 0) return;
    animateStep(() => setStep((s) => s - 1));
  }

  function finish() {
    if (role === "freelance") router.push("/dashboard");
    else if (role === "client") router.push("/client/dashboard");
    else router.push("/agence/dashboard");
  }

  const curStep = steps[step];
  const StepIcon = curStep.icon;

  return (
    <div className="min-h-screen lg:flex">

      {/* ══════════════════════════════════════════
          LEFT PANEL — decorative, sticky
      ══════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex lg:w-1/2 sticky top-0 h-screen flex-col overflow-hidden"
        style={{ background: "linear-gradient(160deg, #4C1D95 0%, #6C2BD9 100%)" }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-purple-400/10" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-900/30" />
          {/* Subtle grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
            <defs>
              <pattern id="left-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#left-grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="bg-white/15 p-2 rounded-xl">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">FreelanceHigh</span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center gap-6">
            {/* Platform mockup illustration */}
            <div className="transition-all duration-500">
              {role === "freelance" && <FreelanceMockup />}
              {role === "client" && <ClientMockup />}
              {role === "agence" && <AgenceMockup />}
            </div>

            {/* Title + bullets */}
            <div>
              <h2 className="text-white text-2xl font-black leading-tight mb-6">
                {panel.title}
              </h2>
              <ul className="space-y-3.5">
                {panel.bullets.map(({ icon: BIcon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <BIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white/80 text-sm leading-snug">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Testimonial */}
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-yellow-300" fill="currentColor" />
              ))}
            </div>
            <p className="text-white/90 text-sm leading-relaxed italic mb-4">
              &ldquo;{panel.testimonial.text}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${panel.testimonial.color} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
                {panel.testimonial.initials}
              </div>
              <div>
                <p className="text-white text-sm font-bold">{panel.testimonial.author}</p>
                <p className="text-white/60 text-xs">{panel.testimonial.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — form
      ══════════════════════════════════════════ */}
      <main className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white">

        {/* Thin progress bar at very top */}
        <div className="h-1 bg-gray-100 flex-shrink-0">
          <div
            className="h-full bg-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Mobile header */}
        <div className="lg:hidden px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600 fill-purple-600" />
            <span className="font-extrabold text-gray-900 text-base">FreelanceHigh</span>
          </Link>
          <button onClick={finish} className="text-xs text-gray-400 hover:text-gray-600 font-semibold">
            Passer →
          </button>
        </div>

        {/* Form area — centered vertically */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-10 overflow-y-auto">
          <div className="w-full max-w-md mx-auto">

            {/* Step dots + skip */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === step
                        ? "w-7 h-2.5 bg-purple-600"
                        : i < step
                        ? "w-2.5 h-2.5 bg-purple-400"
                        : "w-2.5 h-2.5 bg-gray-200"
                    )}
                  />
                ))}
                <span className="ml-1.5 text-xs text-gray-400 font-semibold">
                  {step + 1} / {totalSteps}
                </span>
              </div>
              <button
                onClick={finish}
                className="hidden lg:block text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors"
              >
                Passer →
              </button>
            </div>

            {/* Step header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <StepIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                {curStep.title}
              </h1>
              <p className="text-gray-500 mt-1.5 text-sm">{curStep.subtitle}</p>
            </div>

            {/* ─── Animated form content ─── */}
            <div
              className="transition-all duration-200"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(14px)",
              }}
            >

              {/* ════ FREELANCE STEP 0 ════ */}
              {role === "freelance" && step === 0 && (
                <div className="space-y-5">

                  {/* Photo de profil */}
                  <div>
                    <Label>Photo de profil</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                      tabIndex={-1}
                    />
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "relative w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden cursor-pointer border-2 border-dashed transition-all group focus:outline-none focus:ring-4 focus:ring-purple-100",
                          fl.photoUrl
                            ? "border-purple-400 hover:border-purple-600"
                            : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50"
                        )}
                      >
                        {fl.photoUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={fl.photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <Camera className="w-4 h-4 text-white" />
                              <span className="text-[9px] text-white font-bold">Changer</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            <Camera className="w-6 h-6 text-gray-400 group-hover:text-purple-500 transition-colors" />
                            <span className="text-[9px] font-semibold text-gray-400 group-hover:text-purple-500 transition-colors text-center leading-tight px-1">
                              Cliquer pour choisir
                            </span>
                          </div>
                        )}
                      </button>

                      <div className="flex flex-col gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-purple-500 hover:text-purple-600 transition-all"
                        >
                          {fl.photoUrl ? "Changer la photo" : "Choisir une photo"}
                        </button>
                        {fl.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setFl((p) => ({ ...p, photoUrl: "", photoError: "" }))}
                            className="px-3.5 py-2 border-2 border-red-100 rounded-xl text-sm font-semibold text-red-400 hover:border-red-300 hover:bg-red-50 transition-all flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer
                          </button>
                        )}
                        <p className="text-xs text-gray-400">JPG, PNG, WEBP · Max 5 Mo</p>
                        {fl.photoError && (
                          <p className="text-xs text-red-500 font-semibold">{fl.photoError}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Titre professionnel */}
                  <div>
                    <Label>Titre professionnel <span className="text-purple-500">*</span></Label>
                    <div className="relative">
                      <FieldIcon icon={Star} />
                      <input
                        value={fl.titre}
                        onChange={(e) => setFl((p) => ({ ...p, titre: e.target.value }))}
                        placeholder="Ex : Développeur Fullstack React / Node.js"
                        className={INPUT}
                      />
                    </div>
                  </div>

                  {/* Compétences */}
                  <div>
                    <Label>Compétences principales</Label>
                    {fl.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {fl.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 border-2 border-purple-200 text-purple-700 rounded-xl text-xs font-semibold"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="text-purple-400 hover:text-purple-700 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      value={fl.skillInput}
                      onChange={(e) => setFl((p) => ({ ...p, skillInput: e.target.value }))}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Ex: React, Design UI, Rédaction..."
                      className={INPUT_PLAIN}
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      Appuyez sur{" "}
                      <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">
                        Entrée
                      </kbd>{" "}
                      ou virgule pour ajouter
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {SKILL_SUGGESTIONS.filter((s) => !fl.skills.includes(s))
                        .slice(0, 12)
                        .map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => addSkillSuggestion(s)}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/40 transition-all"
                          >
                            + {s}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Pays + Ville */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Pays</Label>
                      <div className="relative">
                        <FieldIcon icon={MapPin} />
                        <select
                          value={fl.pays}
                          onChange={(e) => setFl((p) => ({ ...p, pays: e.target.value }))}
                          className={cn(INPUT, "appearance-none pr-8")}
                        >
                          <option value="">Choisir</option>
                          {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <Label>Ville</Label>
                      <div className="relative">
                        <FieldIcon icon={MapPin} />
                        <input
                          value={fl.ville}
                          onChange={(e) => setFl((p) => ({ ...p, ville: e.target.value }))}
                          placeholder="Dakar, Paris…"
                          className={INPUT}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ FREELANCE STEP 1 ════ */}
              {role === "freelance" && step === 1 && (
                <div className="space-y-5">

                  {/* Tarif horaire */}
                  <div>
                    <Label>Tarif horaire</Label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <FieldIcon icon={DollarSign} />
                        <input
                          type="number"
                          min="1"
                          value={fl.tarifHoraire}
                          onChange={(e) => setFl((p) => ({ ...p, tarifHoraire: e.target.value }))}
                          placeholder="35"
                          className={INPUT}
                        />
                      </div>
                      <div className="relative w-28">
                        <FieldIcon icon={Globe} />
                        <select
                          value={fl.currency}
                          onChange={(e) => setFl((p) => ({ ...p, currency: e.target.value }))}
                          className={cn(INPUT, "appearance-none pr-6")}
                        >
                          {["EUR", "FCFA", "USD", "GBP", "MAD"].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Affiché à titre indicatif · Vous négociez librement avec chaque client
                    </p>
                  </div>

                  {/* Jours disponibles */}
                  <div>
                    <Label>Jours disponibles</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          className={cn(
                            "w-11 h-11 rounded-xl text-sm font-bold border-2 transition-all duration-150",
                            fl.days.includes(d)
                              ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm shadow-purple-100"
                              : "border-gray-200 bg-white text-gray-500 hover:border-purple-300"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Créneaux */}
                  <div>
                    <Label>Créneaux de travail</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Matin", desc: "8h – 12h", icon: Sun },
                        { label: "Après-midi", desc: "12h – 18h", icon: Sun },
                        { label: "Soir", desc: "18h – 22h", icon: Moon },
                      ].map(({ label, desc, icon: SlotIcon }) => (
                        <button
                          key={label}
                          type="button"
                          className="flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all text-center"
                        >
                          <SlotIcon className="w-4.5 h-4.5 text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">{label}</span>
                          <span className="text-xs text-gray-400">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ════ CLIENT STEP 0 ════ */}
              {role === "client" && step === 0 && (
                <div className="space-y-5">
                  <div>
                    <Label>Nom de l&apos;entreprise ou projet <span className="text-purple-500">*</span></Label>
                    <div className="relative">
                      <FieldIcon icon={Building2} />
                      <input
                        value={cl.nomEntreprise}
                        onChange={(e) => setCl((p) => ({ ...p, nomEntreprise: e.target.value }))}
                        placeholder="Ex : Startup Fintech Abidjan"
                        className={INPUT}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Secteur d&apos;activité</Label>
                    <div className="relative">
                      <FieldIcon icon={Briefcase} />
                      <select
                        value={cl.secteur}
                        onChange={(e) => setCl((p) => ({ ...p, secteur: e.target.value }))}
                        className={cn(INPUT, "appearance-none pr-8")}
                      >
                        <option value="">Sélectionnez un secteur</option>
                        {SECTORS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <Label>Décrivez votre besoin principal</Label>
                    <textarea
                      value={cl.besoin}
                      onChange={(e) => setCl((p) => ({ ...p, besoin: e.target.value }))}
                      rows={4}
                      placeholder="Ex : Je cherche un développeur mobile pour créer une application de livraison sur iOS et Android…"
                      className={cn(INPUT_PLAIN, "resize-none")}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{cl.besoin.length}/500</p>
                  </div>

                  <div>
                    <Label>
                      Site web{" "}
                      <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                    </Label>
                    <div className="relative">
                      <FieldIcon icon={Globe} />
                      <input
                        type="url"
                        value={cl.siteWeb}
                        onChange={(e) => setCl((p) => ({ ...p, siteWeb: e.target.value }))}
                        placeholder="https://monentreprise.com"
                        className={INPUT}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ════ CLIENT STEP 1 ════ */}
              {role === "client" && step === 1 && (
                <div className="space-y-5">
                  <div>
                    <Label>Budget habituel par projet</Label>
                    <div className="flex flex-wrap gap-2">
                      {BUDGETS.map(({ label, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setCl((p) => ({ ...p, budget: value }))}
                          className={cn(
                            "px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                            cl.budget === value
                              ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm shadow-purple-100"
                              : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>
                      Compétences recherchées
                      {cl.services.length > 0 && (
                        <span className="text-xs text-gray-400 font-normal ml-2">
                          {cl.services.length} ajouté{cl.services.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </Label>

                    {/* Selected tags + text input */}
                    <div className="flex flex-wrap items-center gap-2 min-h-[46px] w-full px-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100 transition-all duration-200">
                      {cl.services.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => removeService(s)}
                            className="text-purple-400 hover:text-purple-700 transition-colors"
                          >
                            <X className="w-3 h-3" strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                      <input
                        value={cl.serviceInput}
                        onChange={(e) => setCl((p) => ({ ...p, serviceInput: e.target.value }))}
                        onKeyDown={handleServiceKeyDown}
                        placeholder={cl.services.length === 0 ? "Ex : Vue.js, Figma, Rédaction Web…" : "Ajouter…"}
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Appuyez sur Entrée ou virgule pour ajouter</p>

                    {/* Suggestions */}
                    {SERVICE_TYPES.filter((s) => !cl.services.includes(s)).length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 font-medium mb-2">Suggestions rapides</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SERVICE_TYPES.filter((s) => !cl.services.includes(s)).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => addService(s)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold hover:border-purple-300 hover:bg-purple-50/60 hover:text-purple-700 transition-all duration-150"
                            >
                              <Plus className="w-2.5 h-2.5" strokeWidth={2.5} />
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ════ AGENCE STEP 0 ════ */}
              {role === "agence" && step === 0 && (
                <div className="space-y-5">
                  <div>
                    <Label>Nom de l&apos;agence <span className="text-purple-500">*</span></Label>
                    <div className="relative">
                      <FieldIcon icon={Sparkles} />
                      <input
                        value={ag.nomAgence}
                        onChange={(e) => setAg((p) => ({ ...p, nomAgence: e.target.value }))}
                        placeholder="Studio Digital Dakar"
                        className={INPUT}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Secteur d&apos;activité</Label>
                      <div className="relative">
                        <FieldIcon icon={Briefcase} />
                        <select
                          value={ag.secteur}
                          onChange={(e) => setAg((p) => ({ ...p, secteur: e.target.value }))}
                          className={cn(INPUT, "appearance-none pr-8")}
                        >
                          <option value="">Choisir</option>
                          {SECTORS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <Label>Taille de l&apos;équipe</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {TEAM_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setAg((p) => ({ ...p, taille: size }))}
                            className={cn(
                              "px-2.5 py-2 rounded-xl border-2 text-xs font-semibold transition-all",
                              ag.taille === size
                                ? "border-purple-600 bg-purple-50 text-purple-700"
                                : "border-gray-200 text-gray-500 hover:border-purple-300"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Description de l&apos;agence</Label>
                    <textarea
                      value={ag.description}
                      onChange={(e) => setAg((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                      placeholder="Décrivez votre expertise, vos valeurs et ce qui vous différencie…"
                      className={cn(INPUT_PLAIN, "resize-none")}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{ag.description.length}/600</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Pays</Label>
                      <div className="relative">
                        <FieldIcon icon={MapPin} />
                        <select
                          value={ag.pays}
                          onChange={(e) => setAg((p) => ({ ...p, pays: e.target.value }))}
                          className={cn(INPUT, "appearance-none pr-8")}
                        >
                          <option value="">Choisir</option>
                          {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <Label>
                        Site web{" "}
                        <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                      </Label>
                      <div className="relative">
                        <FieldIcon icon={Globe} />
                        <input
                          type="url"
                          value={ag.siteWeb}
                          onChange={(e) => setAg((p) => ({ ...p, siteWeb: e.target.value }))}
                          placeholder="https://…"
                          className={INPUT}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ AGENCE STEP 1 ════ */}
              {role === "agence" && step === 1 && (
                <div className="space-y-5">
                  <div>
                    <Label>Rôles disponibles dans votre agence</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {AGENCY_ROLES.map(({ id, label, desc, icon: RIcon, color }) => (
                        <div
                          key={id}
                          className="flex items-start gap-3 p-3 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:border-gray-200 transition-all"
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${color}18` }}
                          >
                            <RIcon className="w-4 h-4" style={{ color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{label}</p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>
                      Inviter un collaborateur{" "}
                      <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FieldIcon icon={Mail} />
                        <input
                          type="email"
                          value={ag.inputEmail}
                          onChange={(e) => setAg((p) => ({ ...p, inputEmail: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInvite())}
                          placeholder="collaborateur@agence.com"
                          className={INPUT}
                        />
                      </div>
                      <div className="relative">
                        <select
                          value={ag.inputRole}
                          onChange={(e) => setAg((p) => ({ ...p, inputRole: e.target.value }))}
                          className="h-full px-3 pr-7 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:border-purple-500 outline-none appearance-none"
                        >
                          {AGENCY_ROLES.map((r) => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                      <button
                        type="button"
                        onClick={addInvite}
                        className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Inviter
                      </button>
                    </div>

                    {ag.invites.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {ag.invites.map(({ email, role: r }) => {
                          const roleInfo = AGENCY_ROLES.find((ar) => ar.id === r);
                          return (
                            <div
                              key={email}
                              className="flex items-center justify-between px-3.5 py-2.5 bg-purple-50 border border-purple-100 rounded-xl"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                                  <Mail className="w-3.5 h-3.5 text-purple-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{email}</p>
                                  <p className="text-xs text-purple-500">{roleInfo?.label}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeInvite(email)}
                                className="text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 leading-relaxed">
                    Chaque personne invitée recevra un email pour rejoindre votre espace agence.
                    Les rôles sont modifiables depuis le tableau de bord.
                  </p>
                </div>
              )}

            </div>
            {/* ─── end animated content ─── */}

            {/* ── Navigation ── */}
            <div className="mt-8 flex items-center gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
              )}

              <button
                type="button"
                onClick={goNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all text-sm"
              >
                {step === totalSteps - 1 ? (
                  <>
                    Accéder à mon espace
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
