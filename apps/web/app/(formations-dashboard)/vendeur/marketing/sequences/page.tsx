"use client";

/**
 * Séquences email — espace vendeur. Design system « Stitch ».
 *
 * Une séquence créée ici démarre INACTIVE et sans étape : tant qu'aucun email
 * n'y est ajouté, rien ne part. L'écran le dit explicitement plutôt que
 * d'afficher « 0 abonné » comme si la séquence tournait à vide.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { safeFetch } from "@/lib/safe-fetch";
import {
  type LucideIcon,
  ShoppingCart,
  GraduationCap,
  ShoppingBag,
  Clock,
  BadgeCheck,
  UserPlus,
  MousePointerClick,
  Tag,
  Plus,
  MailCheck,
  Users,
  Zap,
  Mail,
  RefreshCw,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { ST, StCard, StPageHeader, StButton, StChip, StKpiCompact, StSectionTitle } from "@/components/stitch";
import { StModal, StErreur, StVide, StRetourMarketing } from "@/components/formations/dashboard/MarketingKit";

type Declencheur =
  | "PURCHASE"
  | "ENROLLMENT"
  | "ABANDONED_CART"
  | "USER_INACTIVITY"
  | "COURSE_COMPLETION"
  | "SIGNUP"
  | "MANUAL"
  | "TAG_ADDED";

type Sequence = {
  id: string;
  name: string;
  description: string | null;
  trigger: Declencheur;
  isActive: boolean;
  totalEnrolled: number;
  totalCompleted: number;
  createdAt: string;
  _count: { steps: number; enrollments: number };
};

const DECLENCHEURS: Record<Declencheur, { label: string; icon: LucideIcon; aide: string }> = {
  PURCHASE: { label: "Après un achat", icon: ShoppingCart, aide: "Dès qu'un paiement est confirmé." },
  ENROLLMENT: { label: "Inscription à une formation", icon: GraduationCap, aide: "À l'entrée dans une formation." },
  ABANDONED_CART: { label: "Panier abandonné", icon: ShoppingBag, aide: "Quand un panier reste en plan." },
  USER_INACTIVITY: { label: "Inactivité", icon: Clock, aide: "Quand l'apprenant ne revient plus." },
  COURSE_COMPLETION: { label: "Formation terminée", icon: BadgeCheck, aide: "À la dernière leçon validée." },
  SIGNUP: { label: "Nouvelle inscription", icon: UserPlus, aide: "À la création du compte." },
  MANUAL: { label: "Déclenchement manuel", icon: MousePointerClick, aide: "Vous décidez du moment." },
  TAG_ADDED: { label: "Étiquette ajoutée", icon: Tag, aide: "Quand une étiquette est posée sur un contact." },
};

const ETAPES_EXPLICATION = [
  { n: "1", label: "Déclencheur", desc: "Achat, inscription, inactivité…", icon: Zap },
  { n: "2", label: "Délai", desc: "Par exemple : attendre 1 jour", icon: Clock },
  { n: "3", label: "Email", desc: "Votre message, personnalisé", icon: Mail },
  { n: "4", label: "Répéter", desc: "Autant d'étapes que nécessaire", icon: RefreshCw },
];

function nombre(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export default function SequencesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", trigger: "PURCHASE" as Declencheur });

  const { data: reponse, isLoading, isError, refetch } = useQuery<{ data: { sequences: Sequence[] } }>({
    queryKey: ["vendeur-automatisations"],
    queryFn: async () => {
      const { data, error } = await safeFetch<{ data: { sequences: Sequence[] } }>(
        "/api/formations/vendeur/automatisations",
      );
      if (error || !data) throw new Error(error ?? "Chargement impossible");
      return data;
    },
    staleTime: 30_000,
  });

  const sequences = reponse?.data?.sequences ?? [];

  const creation = useMutation({
    mutationFn: async (corps: typeof form) => {
      const { error } = await safeFetch("/api/formations/vendeur/marketing/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-automatisations"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Séquence créée. Ajoutez-y vos emails pour la lancer.");
      setShowForm(false);
      setForm({ name: "", description: "", trigger: "PURCHASE" });
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const actives = sequences.filter((s) => s.isActive).length;
  const inscrits = sequences.reduce((s, q) => s + q.totalEnrolled, 0);
  const terminees = sequences.reduce((s, q) => s + q.totalCompleted, 0);

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1000px] mx-auto">
        <StRetourMarketing />

        <StPageHeader
          title="Séquences email"
          subtitle="Les emails qui partent tout seuls, au bon moment, sans vous."
          actions={
            <StButton icon={Plus} onClick={() => setShowForm(true)}>
              Créer une séquence
            </StButton>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
          <StKpiCompact label="Séquences actives" value={isLoading ? "…" : actives} icon={MailCheck} tone="green" />
          <StKpiCompact label="Contacts inscrits" value={isLoading ? "…" : nombre(inscrits)} icon={Users} tone="blue" />
          <StKpiCompact label="Séquences terminées" value={isLoading ? "…" : nombre(terminees)} icon={BadgeCheck} tone="amber" />
        </div>

        <StCard className="mb-4">
          <StSectionTitle>Comment ça marche</StSectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {ETAPES_EXPLICATION.map((e) => {
              const Icone = e.icon;
              return (
                <div key={e.n} className="flex items-start gap-2.5">
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                    style={{ background: ST.gradient }}
                    aria-hidden="true"
                  >
                    {e.n}
                  </span>
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1 text-[12.5px] font-extrabold" style={{ color: ST.text }}>
                      <Icone size={13} style={{ color: ST.green }} />
                      {e.label}
                    </p>
                    <p className="text-[11px] font-semibold leading-snug" style={{ color: ST.textSecondary }}>
                      {e.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </StCard>

        {isError ? (
          <StErreur onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-3.5">
            {[0, 1].map((i) => (
              <StCard key={i}>
                <div className="flex animate-pulse items-center gap-3">
                  <div className="h-10 w-10 rounded-[12px]" style={{ background: "#eef2ef" }} />
                  <div className="flex-1">
                    <div className="h-3.5 w-40 rounded" style={{ background: "#eef2ef" }} />
                    <div className="mt-1.5 h-3 w-24 rounded" style={{ background: "#eef2ef" }} />
                  </div>
                </div>
              </StCard>
            ))}
          </div>
        ) : sequences.length === 0 ? (
          <StVide
            icon={MailCheck}
            titre="Aucune séquence email"
            message="Une séquence « après achat » rassure l'acheteur, réduit les demandes de remboursement et prépare la vente suivante. Trois emails suffisent pour commencer."
            action={
              <StButton icon={Plus} onClick={() => setShowForm(true)}>
                Créer ma première séquence
              </StButton>
            }
          />
        ) : (
          <div className="space-y-3.5">
            {sequences.map((s) => {
              const d = DECLENCHEURS[s.trigger] ?? { label: s.trigger, icon: Zap, aide: "" };
              const Icone = d.icon;
              const taux = s.totalEnrolled > 0 ? Math.round((s.totalCompleted / s.totalEnrolled) * 1000) / 10 : 0;
              const sansEtape = s._count.steps === 0;
              return (
                <StCard key={s.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                        style={{ background: ST.greenSoft, color: ST.green }}
                      >
                        <Icone size={19} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-extrabold" style={{ color: ST.text }}>
                          {s.name}
                        </p>
                        <p className="text-[11px] font-bold" style={{ color: ST.textSecondary }}>
                          {d.label} · {s._count.steps} étape{s._count.steps !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {s.isActive ? <StChip tone="green">Active</StChip> : <StChip tone="neutral">Inactive</StChip>}
                      <Link
                        href={`/vendeur/marketing/sequences/${s.id}`}
                        aria-label={`Modifier la séquence ${s.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[.05]"
                        style={{ color: ST.textSecondary }}
                      >
                        <Pencil size={16} />
                      </Link>
                    </div>
                  </div>

                  {sansEtape && (
                    <p
                      className="mt-3 flex items-start gap-2 rounded-[10px] p-2.5 text-[11.5px] font-semibold"
                      style={{ background: ST.amberSoft, color: ST.amberText }}
                    >
                      <AlertTriangle size={14} className="mt-px flex-shrink-0" aria-hidden="true" />
                      Cette séquence n&apos;a encore aucun email : rien ne partira tant que vous n&apos;en aurez pas
                      ajouté.
                    </p>
                  )}

                  <div className="mt-3.5 grid grid-cols-3 gap-3 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                    {[
                      { label: "Inscrits", valeur: nombre(s.totalEnrolled) },
                      { label: "Terminées", valeur: nombre(s.totalCompleted) },
                      { label: "Achèvement", valeur: s.totalEnrolled > 0 ? `${taux} %` : "—" },
                    ].map((k) => (
                      <div key={k.label}>
                        <p className="text-[14px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                          {k.valeur}
                        </p>
                        <p className="text-[10.5px] font-bold" style={{ color: ST.textSecondary }}>
                          {k.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </StCard>
              );
            })}
          </div>
        )}

        {showForm && (
          <StModal
            titre="Nouvelle séquence"
            onClose={() => setShowForm(false)}
            pied={
              <>
                <StButton variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
                  Annuler
                </StButton>
                <StButton
                  className="flex-1"
                  disabled={form.name.trim().length < 2 || creation.isPending}
                  onClick={() => creation.mutate(form)}
                >
                  {creation.isPending ? "Création…" : "Créer la séquence"}
                </StButton>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="seq-nom" className="mb-[7px] block text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                  Nom de la séquence <span style={{ color: ST.roseText }}>*</span>
                </label>
                <input
                  id="seq-nom"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex. Bienvenue après achat"
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                />
              </div>

              <div>
                <label htmlFor="seq-declencheur" className="mb-[7px] block text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                  Déclencheur <span style={{ color: ST.roseText }}>*</span>
                </label>
                <select
                  id="seq-declencheur"
                  value={form.trigger}
                  onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value as Declencheur }))}
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                >
                  {(Object.keys(DECLENCHEURS) as Declencheur[]).map((k) => (
                    <option key={k} value={k}>
                      {DECLENCHEURS[k].label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                  {DECLENCHEURS[form.trigger].aide}
                </p>
              </div>

              <div>
                <label htmlFor="seq-desc" className="mb-[7px] block text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                  Description
                </label>
                <textarea
                  id="seq-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="À quoi sert cette séquence ? (note interne)"
                  className="w-full resize-none rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-medium leading-relaxed focus:outline-none"
                  style={{ color: "#33453b", border: "1px solid #dde6e0" }}
                />
              </div>

              <p className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>
                La séquence est créée en pause : vous ajouterez ses emails à l&apos;étape suivante, puis vous
                l&apos;activerez.
              </p>
            </div>
          </StModal>
        )}
      </main>
    </div>
  );
}
