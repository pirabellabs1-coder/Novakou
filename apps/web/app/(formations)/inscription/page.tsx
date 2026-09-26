"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { redirigerVersOrigineAuth } from "@/lib/auth/oauth-origin";
import { signIn } from "next-auth/react";
import {
  Check,
  ChevronDown,
  Globe,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  Mic,
  Search,
  Share2,
  Store,
  type LucideIcon,
} from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard, AuthHead } from "@/components/auth/AuthCard";
import { AuthField, PasswordField } from "@/components/auth/AuthField";
import { AuthButton, GoogleIcon } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";

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
   Thème par rôle : couleur de la carte, lueur du panneau, contenus (accroche,
   bénéfices) et libellés du formulaire.
──────────────────────────────────────────────────────────────────────────── */

interface RoleTheme {
  id: TabType;
  icon: LucideIcon;
  /** Couleur de la carte de rôle (pastille, liseré, coche). */
  color: string;
  /** Lueur du panneau gauche, teintée par le rôle (rgba). */
  glow: string;
  cardTitle: string;
  cardDesc: string;
  heroTitle: string[];
  heroBenefits: string[];
  formTitle: string;
  formSubtitle: string;
  submitLabel: string;
}

const ROLES: Record<TabType, RoleTheme> = {
  vendeur: {
    id: "vendeur",
    icon: Store,
    color: "#006e2f",
    glow: "rgba(0,110,47,.55)",
    cardTitle: "Je vends",
    cardDesc: "Formations, ebooks, produits digitaux",
    heroTitle: ["Vendez vos formations", "et produits numériques."],
    heroBenefits: [
      "Votre boutique en ligne prête en 5 minutes",
      "Paiement Mobile Money intégré : Orange, Wave, MTN",
      "Vos fonds disponibles sous 48 h",
    ],
    formTitle: "Créez votre boutique gratuitement",
    formSubtitle: "Votre espace de vente prêt en quelques minutes.",
    submitLabel: "Créer ma boutique",
  },
  apprenant: {
    id: "apprenant",
    icon: GraduationCap,
    color: "#2563eb",
    glow: "rgba(37,99,235,.42)",
    cardTitle: "J’apprends",
    cardDesc: "Accès à tout le catalogue",
    heroTitle: ["Apprenez auprès", "des meilleurs experts."],
    heroBenefits: [
      "Un catalogue de formations créées par des experts",
      "Accès à vie à toutes vos formations achetées",
      "Paiement local : Mobile Money et carte bancaire",
    ],
    formTitle: "Apprenez sans limites",
    formSubtitle: "Accédez au catalogue et progressez à votre rythme.",
    submitLabel: "Commencer à apprendre",
  },
  mentor: {
    id: "mentor",
    icon: Mic,
    color: "#d97706",
    glow: "rgba(217,119,6,.4)",
    cardTitle: "Je coache",
    cardDesc: "Sessions de mentorat 1:1",
    heroTitle: ["Partagez votre expertise,", "monétisez votre temps."],
    heroBenefits: [
      "Sessions de mentorat 1:1 en visioconférence",
      "Agenda intégré : vous choisissez vos disponibilités",
      "Paiements sécurisés, versés sous 48 h",
    ],
    formTitle: "Devenez mentor rémunéré",
    formSubtitle: "Transformez votre expérience en revenus réguliers.",
    submitLabel: "Devenir mentor",
  },
  affilie: {
    id: "affilie",
    icon: Share2,
    color: "#7c3aed",
    glow: "rgba(124,58,237,.42)",
    cardTitle: "J’affilie",
    cardDesc: "40 % de commission par vente",
    heroTitle: ["Recommandez, partagez,", "gagnez 40 % par vente."],
    heroBenefits: [
      "40 % de commission sur chaque vente apportée",
      "Votre lien d’affiliation unique, prêt en 1 minute",
      "Statistiques en direct : clics, ventes, gains",
    ],
    formTitle: "Gagnez 40 % de commission",
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

/* ─────────────────────────────────────────────────────────────────────────────
   Sélecteur de pays : dropdown custom recherchable (clavier, clic extérieur).
──────────────────────────────────────────────────────────────────────────── */

function CountrySelect({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: string;
  onChange: (country: string) => void;
  invalid: boolean;
  describedBy?: string;
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
    <div ref={rootRef} className="nkauth-control">
      <Globe className="ico" aria-hidden="true" />
      <button
        type="button"
        id="pays"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        className={`nkauth-input nkauth-select has-ico${invalid ? " is-invalid" : ""}`}
      >
        <span className={`val${value ? "" : " ph"}`}>{value || "Sélectionnez votre pays"}</span>
        <ChevronDown className="chev" aria-hidden="true" />
      </button>

      {open && (
        <div className="nkauth-menu">
          <div className="search">
            <div className="nkauth-control">
              <Search className="ico" aria-hidden="true" style={{ left: 12, width: 15, height: 15 }} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Rechercher un pays…"
                aria-label="Rechercher un pays"
                className="nkauth-input has-ico"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="empty">Aucun pays trouvé</p>
          ) : (
            <ul ref={listRef} role="listbox" aria-label="Pays">
              {filtered.map((c, i) => {
                const selected = c === value;
                return (
                  <li key={c} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => select(c)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`${i === highlight ? "hl" : ""} ${selected ? "sel" : ""}`}
                    >
                      <span className="truncate">{c}</span>
                      {selected && <Check size={15} strokeWidth={3} aria-hidden="true" />}
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
      className="nkauth-role"
      style={{ "--role": role.color } as React.CSSProperties}
    >
      <span className="coche" aria-hidden="true">
        <Check strokeWidth={4} />
      </span>
      <span className="pastille" aria-hidden="true">
        <Icon />
      </span>
      <span className="t">{role.cardTitle}</span>
      <span className="d">{role.cardDesc}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page d'inscription
──────────────────────────────────────────────────────────────────────────── */

type ChampErreur = "prenom" | "pays" | "email" | "password" | "confirm" | "terms";

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
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Champ visé par l'erreur affichée : relié par aria-describedby, reçoit le focus.
  const [champErreur, setChampErreur] = useState<ChampErreur | null>(null);

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

  /** Erreur de saisie : message global + champ ciblé, qui reprend le focus. */
  function signaler(champ: ChampErreur, message: string) {
    setError(message);
    setChampErreur(champ);
    document.getElementById(champ)?.focus();
  }

  async function handleGoogle() {
    if (redirigerVersOrigineAuth()) return;
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
    setChampErreur(null);

    if (!firstName.trim()) { signaler("prenom", "Le prénom est requis."); return; }
    if (!country) { setCountryError(true); signaler("pays", "Veuillez sélectionner votre pays."); return; }
    if (!email) { signaler("email", "L’adresse e-mail est requise."); return; }
    if (!passwordValid) { signaler("password", "Le mot de passe ne respecte pas encore tous les critères de sécurité."); return; }
    if (password !== confirm) { signaler("confirm", "Les mots de passe ne correspondent pas."); return; }
    if (!accepted) { signaler("terms", "Veuillez accepter les conditions générales d’utilisation."); return; }

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

  const decrit = (champ: ChampErreur) => (error && champErreur === champ ? "inscription-erreur" : undefined);
  const invalide = (champ: ChampErreur) => (error && champErreur === champ ? true : undefined);

  return (
    <AuthShell
      portail="vendeur"
      largeur={560}
      cleBascule={activeTab}
      clePanneau={activeTab}
      panneau={{
        eyebrow: "Créer un compte",
        headline: role.heroTitle,
        subtext: role.formSubtitle,
        benefits: role.heroBenefits,
        glow: role.glow,
        trust: "Paiements sécurisés · Données protégées · Plateforme 100 % africaine",
      }}
      trust="Inscription gratuite · Aucune carte bancaire requise · Résiliable à tout moment"
    >
      <AuthCard>
        <AuthHead id="inscription-titre" titre={role.formTitle} sousTitre={role.formSubtitle} swap />

        {/* Sélecteur de rôles */}
        <div data-reveal style={{ "--d": 200 } as React.CSSProperties}>
          <p className="nkauth-kicker" id="inscription-profil">
            Votre profil
          </p>
          <div className="nkauth-roles" role="group" aria-labelledby="inscription-profil">
            {ROLE_ORDER.map((id) => (
              <RoleCard key={id} role={ROLES[id]} active={activeTab === id} onSelect={() => setActiveTab(id)} />
            ))}
          </div>
        </div>

        {/* Google OAuth */}
        <AuthButton type="button" variante="light" onClick={handleGoogle} disabled={loading} icone={<GoogleIcon />} delai={250}>
          Continuer avec Google
        </AuthButton>

        <div className="nkauth-sep" aria-hidden="true">
          ou
        </div>

        {/* Erreur */}
        {error && (
          <AuthAlert type="error" id="inscription-erreur">
            {error}
          </AuthAlert>
        )}

        <form onSubmit={handleSubmit} className="nkauth-form" aria-labelledby="inscription-titre">
          <div className="nkauth-grid-2">
            <AuthField
              id="prenom"
              name="prenom"
              label="Prénom"
              requis
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Aminata"
              autoComplete="given-name"
              aria-invalid={invalide("prenom")}
              describedBy={decrit("prenom")}
              delai={300}
            />
            <AuthField
              id="nom"
              name="nom"
              label="Nom"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Diallo"
              autoComplete="family-name"
              delai={300}
            />
          </div>

          <div className="nkauth-field" data-reveal style={{ "--d": 350 } as React.CSSProperties}>
            <label htmlFor="pays" className="nkauth-label">
              <span>
                Pays
                <span className="req" aria-hidden="true">
                  *
                </span>
              </span>
            </label>
            <CountrySelect
              value={country}
              invalid={countryError}
              describedBy={countryError && !country ? "pays-erreur" : decrit("pays")}
              onChange={(c) => {
                setCountry(c);
                setCountryError(false);
                if (error === "Veuillez sélectionner votre pays.") setError(null);
              }}
            />
            {countryError && !country && (
              <p id="pays-erreur" className="nkauth-error">
                Veuillez sélectionner votre pays.
              </p>
            )}
          </div>

          <AuthField
            id="email"
            name="email"
            label="Adresse e-mail"
            requis
            icone={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            autoComplete="email"
            aria-invalid={invalide("email")}
            describedBy={decrit("email")}
            delai={400}
          />

          <div className="nkauth-field" data-reveal style={{ "--d": 450 } as React.CSSProperties}>
            <PasswordField
              id="password"
              name="password"
              label="Mot de passe"
              requis
              icone={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="10 caractères minimum"
              autoComplete="new-password"
              aria-invalid={invalide("password")}
              describedBy={[decrit("password"), "password-criteres"].filter(Boolean).join(" ")}
            />
            {/* Checklist live — alignée sur les exigences de l'API */}
            <ul id="password-criteres" className="nkauth-rules" aria-label="Critères du mot de passe">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                  <li key={rule.id} className={ok ? "ok" : undefined}>
                    <span className="tick" aria-hidden="true">
                      <Check strokeWidth={4} />
                    </span>
                    <span>
                      {rule.label}
                      <span className="sr-only">{ok ? " — respecté" : " — à respecter"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <PasswordField
            id="confirm"
            name="confirm"
            label="Confirmer le mot de passe"
            requis
            icone={KeyRound}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Répétez votre mot de passe"
            autoComplete="new-password"
            erreur={confirm && confirm !== password ? "Les mots de passe ne correspondent pas." : null}
            aria-invalid={invalide("confirm")}
            describedBy={decrit("confirm")}
            delai={500}
          />

          <div data-reveal style={{ "--d": 550 } as React.CSSProperties}>
            <label htmlFor="terms" className="nkauth-check">
              <input
                id="terms"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                aria-invalid={invalide("terms")}
                aria-describedby={decrit("terms")}
              />
              <span>
                J’accepte les{" "}
                <Link href="/cgu" className="nkauth-link">
                  conditions générales
                </Link>{" "}
                et la{" "}
                <Link href="/confidentialite" className="nkauth-link">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>
          </div>

          <AuthButton
            type="submit"
            disabled={loading || !accepted}
            chargement={loading}
            texteChargement="Création du compte…"
            delai={600}
          >
            <span key={activeTab} className="swap-label">
              {role.submitLabel}
            </span>
          </AuthButton>
        </form>

        <p className="nkauth-foot" data-reveal="fade" style={{ "--d": 650 } as React.CSSProperties}>
          Déjà un compte&nbsp;?{" "}
          <Link href="/connexion" className="nkauth-link">
            Se connecter
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#f7f9fb]" />}>
      <InscriptionInner />
    </Suspense>
  );
}
