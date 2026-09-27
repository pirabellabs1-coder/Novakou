"use client";

/**
 * Programme d'affiliation — espace vendeur. Design system « Stitch ».
 *
 * Trois corrections de fond héritées de la version précédente :
 *   - le lien copié pour un affilié pointait sur /ref/{code}, une route qui
 *     n'existe pas : tout lien partagé menait à une 404, donc zéro vente
 *     attribuée. La vitrine publique d'un affilié est /a/{code}.
 *   - « Versement à 20 affiliés validés » était écrit en dur, quel que soit le
 *     nombre réel d'affiliés.
 *   - le seuil de retrait proposé par défaut valait 20 (un reliquat en dollars)
 *     alors que la plateforme compte en FCFA.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { safeFetch } from "@/lib/safe-fetch";
import {
  type LucideIcon,
  Plus,
  UserPlus,
  MousePointerClick,
  ShoppingCart,
  Banknote,
  Users,
  Percent,
  Cookie,
  Wallet,
  UserCheck,
  Check,
  Copy,
} from "lucide-react";
import { ST, StCard, StPageHeader, StButton, StChip, StKpiCompact, StSectionTitle } from "@/components/stitch";
import {
  StSwitch,
  StModal,
  StErreur,
  StVide,
  StRetourMarketing,
} from "@/components/formations/dashboard/MarketingKit";

type Affilie = {
  id: string;
  affiliateCode: string;
  status: string;
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
  user: { name: string | null; email: string };
};

type Programme = {
  id: string;
  name: string;
  description: string | null;
  commissionPct: number;
  cookieDays: number;
  isActive: boolean;
  minPayoutAmount: number;
  autoApprove: boolean;
  applyToAll: boolean;
  affiliates: Affilie[];
  createdAt: string;
};

type Donnees = {
  programs: Programme[];
  stats: {
    totalAffiliates: number;
    activeAffiliates: number;
    totalClicks: number;
    totalConversions: number;
    totalEarned: number;
    pendingEarnings: number;
  };
};

function fcfa(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

const STATUTS: Record<string, { libelle: string; tone: "green" | "amber" | "rose" | "neutral" }> = {
  ACTIVE: { libelle: "Actif", tone: "green" },
  PENDING: { libelle: "En attente", tone: "amber" },
  SUSPENDED: { libelle: "Suspendu", tone: "rose" },
  BANNED: { libelle: "Banni", tone: "neutral" },
};

const DEGRADES = [
  "linear-gradient(135deg,#006e2f,#22c55e)",
  "linear-gradient(135deg,#0f766e,#22c55e)",
  "linear-gradient(135deg,#1d4ed8,#3e8998)",
  "linear-gradient(135deg,#b45309,#f59e0b)",
  "linear-gradient(135deg,#7c64b4,#a78bfa)",
];

function initiales(a: Affilie) {
  const base = a.user.name ?? a.user.email;
  return base
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((m) => m[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AffiliationPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "Programme d'affiliation",
    description: "",
    commissionPct: "20",
    cookieDays: "30",
    // FCFA : le minimum accepté côté serveur est 1 000 FCFA.
    minPayoutAmount: "13120",
    autoApprove: true,
  });

  const { data: reponse, isLoading, isError, refetch } = useQuery<{ data: Donnees }>({
    queryKey: ["vendeur-affiliation"],
    queryFn: async () => {
      const { data, error } = await safeFetch<{ data: Donnees }>("/api/formations/vendeur/marketing/affiliation");
      if (error || !data?.data) throw new Error(error ?? "Chargement impossible");
      return data;
    },
    staleTime: 30_000,
  });

  const donnees = reponse?.data;
  const programmes = donnees?.programs ?? [];
  const stats = donnees?.stats;
  const programme = programmes[0] ?? null;

  const creation = useMutation({
    mutationFn: async (corps: typeof form) => {
      const { data, error } = await safeFetch<{ data: Programme }>("/api/formations/vendeur/marketing/affiliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-affiliation"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Programme créé.");
      setShowCreate(false);
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const bascule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await safeFetch(`/api/formations/vendeur/marketing/affiliation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-affiliation"] }),
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  /** Vitrine publique d'un affilié : /a/{code} (compte le clic, pose le cookie). */
  function lienAffilie(code: string) {
    const origine =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "https://novakou.com");
    return `${origine}/a/${code}`;
  }

  async function copierLien(code: string) {
    try {
      await navigator.clipboard.writeText(lienAffilie(code));
      setCopie(code);
      setTimeout(() => setCopie(null), 2000);
    } catch {
      useToastStore.getState().addToast("error", "Copie impossible : sélectionnez le lien à la main.");
    }
  }

  const lienRecrutement =
    (process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "https://novakou.com")) +
    "/apprenant/affiliation";

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StRetourMarketing />

        <StPageHeader
          title="Programme d'affiliation"
          subtitle="Des ambassadeurs vendent pour vous, et ne sont payés qu'à la vente."
          actions={
            !programme && !isLoading && !isError ? (
              <StButton icon={Plus} onClick={() => setShowCreate(true)}>
                Créer mon programme
              </StButton>
            ) : undefined
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <StKpiCompact label="Affiliés actifs" value={isLoading ? "…" : stats?.activeAffiliates ?? 0} icon={UserPlus} tone="green" />
          <StKpiCompact label="Clics apportés" value={isLoading ? "…" : fcfa(stats?.totalClicks ?? 0)} icon={MousePointerClick} tone="blue" />
          <StKpiCompact label="Ventes générées" value={isLoading ? "…" : stats?.totalConversions ?? 0} icon={ShoppingCart} tone="green" />
          <StKpiCompact
            label="Commissions dues"
            value={isLoading ? "…" : fcfa(stats?.totalEarned ?? 0)}
            unit="FCFA"
            icon={Banknote}
            tone="amber"
          />
        </div>

        {isError ? (
          <StErreur onRetry={() => refetch()} />
        ) : isLoading ? (
          <StCard>
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-48 rounded" style={{ background: "#eef2ef" }} />
              <div className="h-24 w-full rounded" style={{ background: "#eef2ef" }} />
            </div>
          </StCard>
        ) : !programme ? (
          <StVide
            icon={Users}
            titre="Lancez votre programme d'affiliation"
            message="Vos apprenants satisfaits sont vos meilleurs vendeurs. Fixez une commission, ils partagent votre boutique, et vous ne payez que lorsqu'une vente est confirmée."
            action={
              <StButton icon={Plus} onClick={() => setShowCreate(true)}>
                Créer mon programme
              </StButton>
            }
          />
        ) : (
          <>
            <div className="mb-3.5 grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {/* Réglages */}
              <StCard>
                <StSectionTitle
                  action={
                    <StSwitch
                      checked={programme.isActive}
                      onChange={(v) => bascule.mutate({ id: programme.id, isActive: v })}
                      label={`${programme.isActive ? "Mettre en pause" : "Activer"} le programme d'affiliation`}
                    />
                  }
                >
                  Mon programme
                </StSectionTitle>
                <div>
                  {(
                    [
                      { label: "Commission", valeur: `${programme.commissionPct} % par vente`, icon: Percent },
                      { label: "Attribution", valeur: `${programme.cookieDays} jours`, icon: Cookie },
                      { label: "Seuil de retrait", valeur: `${fcfa(programme.minPayoutAmount)} FCFA`, icon: Wallet },
                      { label: "Approbation", valeur: programme.autoApprove ? "Automatique" : "Manuelle", icon: UserCheck },
                    ] as { label: string; valeur: string; icon: LucideIcon }[]
                  ).map((l, i) => {
                    const Icone = l.icon;
                    return (
                      <div
                        key={l.label}
                        className="flex items-center justify-between py-2.5"
                        style={i ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                      >
                        <span className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: ST.textSecondary }}>
                          <Icone size={15} style={{ color: ST.textSecondary }} />
                          {l.label}
                        </span>
                        <span className="text-[12.5px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                          {l.valeur}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {!programme.isActive && (
                  <p
                    className="mt-3 rounded-[10px] p-2.5 text-[11.5px] font-semibold"
                    style={{ background: ST.amberSoft, color: ST.amberText }}
                  >
                    Programme en pause : les liens de vos affiliés n&apos;ouvrent plus de commission.
                  </p>
                )}
              </StCard>

              {/* Commissions en attente */}
              <StCard className="lg:col-span-2 flex flex-col justify-between">
                <div>
                  <p className="text-[11.5px] font-extrabold uppercase tracking-[.06em]" style={{ color: ST.textSecondary }}>
                    Commissions en attente de versement
                  </p>
                  <p className="mt-1 text-[30px] font-extrabold tabular-nums leading-none" style={{ color: ST.green }}>
                    {fcfa(stats?.pendingEarnings ?? 0)}
                    <span className="ml-1.5 text-[15px]">FCFA</span>
                  </p>
                  <p className="mt-1.5 text-[12px] font-bold" style={{ color: ST.textSecondary }}>
                    {(stats?.activeAffiliates ?? 0) === 0
                      ? "Aucun affilié actif pour l'instant."
                      : `Réparties sur ${stats?.activeAffiliates} affilié${(stats?.activeAffiliates ?? 0) > 1 ? "s" : ""} actif${(stats?.activeAffiliates ?? 0) > 1 ? "s" : ""} · versées après confirmation du paiement.`}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Total affiliés", valeur: String(stats?.totalAffiliates ?? 0), couleur: ST.text },
                    { label: "Actifs", valeur: String(stats?.activeAffiliates ?? 0), couleur: ST.green },
                    {
                      label: "Taux de conversion",
                      valeur:
                        (stats?.totalClicks ?? 0) > 0
                          ? `${Math.round(((stats?.totalConversions ?? 0) / (stats?.totalClicks ?? 1)) * 1000) / 10} %`
                          : "—",
                      couleur: ST.text,
                    },
                  ].map((b) => (
                    <div
                      key={b.label}
                      className="rounded-[14px] p-3 text-center"
                      style={{ background: "#f4f7f5", border: `1px solid ${ST.divider}` }}
                    >
                      <p className="text-[17px] font-extrabold tabular-nums" style={{ color: b.couleur }}>
                        {b.valeur}
                      </p>
                      <p className="text-[10.5px] font-bold" style={{ color: ST.textSecondary }}>
                        {b.label}
                      </p>
                    </div>
                  ))}
                </div>
              </StCard>
            </div>

            {/* Liste des affiliés */}
            {programme.affiliates.length === 0 ? (
              <StVide
                icon={UserPlus}
                titre="Aucun affilié inscrit"
                message={`Vos apprenants deviennent affiliés depuis leur espace, page « Affiliation ». Partagez-leur ce lien : ${lienRecrutement}`}
                action={
                  <StButton
                    variant="secondary"
                    icon={Copy}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(lienRecrutement);
                        useToastStore.getState().addToast("success", "Lien d'inscription copié.");
                      } catch {
                        useToastStore.getState().addToast("error", "Copie impossible.");
                      }
                    }}
                  >
                    Copier le lien d&apos;inscription
                  </StButton>
                }
              />
            ) : (
              <StCard noPadding>
                <div
                  className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5"
                  style={{ borderBottom: `1px solid ${ST.divider}` }}
                >
                  {["Affilié", "Clics", "Ventes", "Gagné", "Statut", "Lien"].map((h) => (
                    <span key={h} className="text-[10.5px] font-extrabold uppercase tracking-[.06em]" style={{ color: ST.textSecondary }}>
                      {h}
                    </span>
                  ))}
                </div>
                <div>
                  {programme.affiliates.map((a, i) => {
                    const st = STATUTS[a.status] ?? { libelle: a.status, tone: "neutral" as const };
                    return (
                      <div
                        key={a.id}
                        className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 md:px-6 py-4 items-center"
                        style={i ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                            style={{ background: DEGRADES[i % DEGRADES.length] }}
                            aria-hidden="true"
                          >
                            {initiales(a)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-extrabold" style={{ color: ST.text }}>
                              {a.user.name ?? "Sans nom"}
                            </p>
                            <p className="truncate text-[10.5px] font-semibold" style={{ color: ST.textSecondary }}>
                              {a.user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                            {fcfa(a.totalClicks)}
                          </span>
                          <span className="text-[10.5px] font-bold md:hidden" style={{ color: ST.textSecondary }}>
                            clics
                          </span>
                        </div>

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                            {a.totalConversions}
                          </span>
                          <span className="text-[10.5px] font-bold md:hidden" style={{ color: ST.textSecondary }}>
                            ventes
                          </span>
                        </div>

                        <div>
                          <span className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.green }}>
                            {fcfa(a.totalEarned)}
                          </span>
                          <span className="ml-1 text-[10.5px] font-bold" style={{ color: ST.textSecondary }}>
                            FCFA
                          </span>
                        </div>

                        <div>
                          <StChip tone={st.tone}>{st.libelle}</StChip>
                        </div>

                        <div>
                          <StButton
                            size="sm"
                            variant={copie === a.affiliateCode ? "ghost-green" : "secondary"}
                            icon={copie === a.affiliateCode ? Check : Copy}
                            onClick={() => copierLien(a.affiliateCode)}
                          >
                            <span translate="no">{copie === a.affiliateCode ? "Copié !" : a.affiliateCode}</span>
                          </StButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </StCard>
            )}
          </>
        )}

        {showCreate && (
          <StModal
            titre="Créer mon programme d'affiliation"
            onClose={() => setShowCreate(false)}
            pied={
              <>
                <StButton variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
                  Annuler
                </StButton>
                <StButton
                  className="flex-1"
                  disabled={form.name.trim().length < 2 || creation.isPending}
                  onClick={() => creation.mutate(form)}
                >
                  {creation.isPending ? "Création…" : "Créer le programme"}
                </StButton>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="aff-nom" className="mb-[7px] block text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                  Nom du programme <span style={{ color: ST.roseText }}>*</span>
                </label>
                <input
                  id="aff-nom"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="aff-commission" className="mb-[7px] block text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                    Commission (%)
                  </label>
                  <input
                    id="aff-commission"
                    type="number"
                    min={1}
                    max={80}
                    value={form.commissionPct}
                    onChange={(e) => setForm((f) => ({ ...f, commissionPct: e.target.value }))}
                    className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold tabular-nums focus:outline-none"
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  />
                  <p className="mt-1.5 text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                    Entre 1 et 80 %. Prélevée sur chaque vente apportée.
                  </p>
                </div>
                <div>
                  <label htmlFor="aff-cookie" className="mb-[7px] block text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                    Attribution (jours)
                  </label>
                  <input
                    id="aff-cookie"
                    type="number"
                    min={1}
                    max={365}
                    value={form.cookieDays}
                    onChange={(e) => setForm((f) => ({ ...f, cookieDays: e.target.value }))}
                    className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold tabular-nums focus:outline-none"
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  />
                  <p className="mt-1.5 text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                    Durée pendant laquelle une visite reste créditée à l&apos;affilié.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="aff-seuil" className="mb-[7px] block text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                  Seuil de retrait (FCFA)
                </label>
                <input
                  id="aff-seuil"
                  type="number"
                  min={1000}
                  step={500}
                  value={form.minPayoutAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minPayoutAmount: e.target.value }))}
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold tabular-nums focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                />
                <p className="mt-1.5 text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                  Montant minimum avant qu&apos;un affilié puisse demander son versement (1 000 FCFA minimum).
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-[14px] px-4 py-3" style={{ background: "#f4f7f5" }}>
                <div>
                  <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                    Approbation automatique
                  </p>
                  <p className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>
                    Les nouveaux affiliés démarrent sans validation de votre part.
                  </p>
                </div>
                <StSwitch
                  checked={form.autoApprove}
                  onChange={(v) => setForm((f) => ({ ...f, autoApprove: v }))}
                  label="Approuver automatiquement les nouveaux affiliés"
                />
              </div>
            </div>
          </StModal>
        )}
      </main>
    </div>
  );
}
