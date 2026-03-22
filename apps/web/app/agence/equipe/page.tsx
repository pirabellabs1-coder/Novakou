"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAgencyStore, type AgencyMember } from "@/store/agency";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

// ── Role config ──

const ROLE_MAP: Record<AgencyMember["role"], { label: string; cls: string }> = {
  proprietaire: { label: "Propriétaire", cls: "bg-red-500/20 text-red-400" },
  manager: { label: "Manager", cls: "bg-purple-500/20 text-purple-400" },
  freelance: { label: "Freelance", cls: "bg-blue-500/20 text-blue-400" },
  commercial: { label: "Commercial", cls: "bg-amber-500/20 text-amber-400" },
};

const STATUS_INDICATOR: Record<AgencyMember["status"], { label: string; dotCls: string; textCls: string }> = {
  actif: { label: "Actif", dotCls: "bg-emerald-400", textCls: "text-emerald-400" },
  inactif: { label: "Inactif", dotCls: "bg-slate-500", textCls: "text-slate-500" },
  invite: { label: "Invité", dotCls: "bg-amber-400", textCls: "text-amber-400" },
};

// ── Role filter tabs ──

const ROLE_TABS: { key: string; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "proprietaire", label: "Propriétaire" },
  { key: "manager", label: "Manager" },
  { key: "freelance", label: "Freelance" },
  { key: "commercial", label: "Commercial" },
];

// ── Helpers ──

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── Component ──

export default function AgenceEquipe() {
  const { members, syncAll, isLoading } = useAgencyStore();
  const { addToast } = useToastStore();

  const [roleFilter, setRoleFilter] = useState("tous");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AgencyMember["role"]>("freelance");
  const [confirmRemove, setConfirmRemove] = useState<AgencyMember | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Sync on mount
  useEffect(() => {
    syncAll();
  }, [syncAll]);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openMenuId]);

  // ── Computed values ──

  const filteredMembers = useMemo(() => {
    if (roleFilter === "tous") return members;
    return members.filter((m) => m.role === roleFilter);
  }, [members, roleFilter]);

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "actif").length;
  const totalRevenue = members.reduce((sum, m) => sum + m.revenue, 0);
  const totalActiveOrders = members.reduce((sum, m) => sum + m.activeOrders, 0);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { tous: members.length };
    for (const m of members) {
      counts[m.role] = (counts[m.role] || 0) + 1;
    }
    return counts;
  }, [members]);

  // ── Handlers ──

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      addToast("warning", "Veuillez entrer une adresse email.");
      return;
    }
    try {
      const res = await fetch("/api/agence/equipe/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Erreur lors de l'envoi");
        return;
      }
      addToast("success", `Invitation envoyée à ${inviteEmail} en tant que ${ROLE_MAP[inviteRole].label}.`);
      setInviteEmail("");
      setInviteRole("freelance");
      setShowInvite(false);
    } catch {
      addToast("error", "Erreur réseau. Veuillez réessayer.");
    }
  }

  function handleRemoveMember(member: AgencyMember) {
    // In production this would call an API to remove the member
    addToast("success", `${member.name} a été retiré de l'agence.`);
    setConfirmRemove(null);
  }

  function handleChangeRole(member: AgencyMember) {
    // In production this would open a role change modal / call API
    addToast("info", `Modification du rôle de ${member.name}...`);
    setOpenMenuId(null);
  }

  // ── Stats cards ──

  const STATS_CARDS = [
    { label: "Total membres", value: totalMembers.toString(), icon: "groups", color: "text-primary" },
    { label: "Membres actifs", value: activeMembers.toString(), icon: "person_check", color: "text-emerald-400" },
    { label: "CA total équipe", value: formatCurrency(totalRevenue), icon: "trending_up", color: "text-blue-400" },
    { label: "Commandes en cours", value: totalActiveOrders.toString(), icon: "shopping_cart", color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Équipe</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez les membres de votre agence et leurs accès.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Inviter un membre
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS_CARDS.map((s) => (
          <div
            key={s.label}
            className="bg-neutral-dark rounded-xl border border-border-dark p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn("material-symbols-outlined text-xl", s.color)}>
                {s.icon}
              </span>
            </div>
            <p className="text-xl font-black text-white">
              {isLoading && members.length === 0 ? "..." : s.value}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              roleFilter === tab.key
                ? "bg-primary text-background-dark"
                : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}
          >
            {tab.label}
            {(tabCounts[tab.key] ?? 0) > 0 && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  roleFilter === tab.key
                    ? "bg-background-dark/20 text-background-dark"
                    : "bg-border-dark text-slate-400"
                )}
              >
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && members.length === 0 && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-12 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-slate-400 text-sm">Chargement de l&apos;équipe...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && members.length === 0 && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-12 flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-5xl text-slate-600">
            group_off
          </span>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">
              Vous êtes le seul membre
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Invitez votre équipe pour collaborer sur vos projets.
            </p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Inviter votre équipe
          </button>
        </div>
      )}

      {/* Filtered empty state */}
      {!isLoading && members.length > 0 && filteredMembers.length === 0 && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-12 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-5xl text-slate-600">
            filter_list_off
          </span>
          <p className="text-slate-400 text-sm">
            Aucun membre avec le rôle &quot;{ROLE_TABS.find((t) => t.key === roleFilter)?.label}&quot;.
          </p>
          <button
            onClick={() => setRoleFilter("tous")}
            className="text-primary text-sm font-semibold hover:underline"
          >
            Afficher tous les membres
          </button>
        </div>
      )}

      {/* Member cards grid */}
      {!isLoading && filteredMembers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const role = ROLE_MAP[member.role];
            const status = STATUS_INDICATOR[member.status];

            return (
              <div
                key={member.id}
                className="bg-neutral-dark rounded-xl border border-border-dark p-5 flex flex-col gap-4 hover:border-border-dark/80 transition-colors"
              >
                {/* Top: avatar + name + role + actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">{member.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[160px]">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {/* Actions dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === member.id ? null : member.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-background-dark transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>

                    {openMenuId === member.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-48 bg-background-dark rounded-xl border border-border-dark shadow-xl z-20 py-1 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleChangeRole(member)}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-neutral-dark hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                          Modifier rôle
                        </button>
                        <Link
                          href={`/agence/commandes?member=${member.id}`}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-neutral-dark hover:text-white transition-colors"
                          onClick={() => setOpenMenuId(null)}
                        >
                          <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                          Voir commandes
                        </Link>
                        <div className="border-t border-border-dark my-1" />
                        <button
                          onClick={() => {
                            setConfirmRemove(member);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                          Retirer de l&apos;agence
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Role badge + Status */}
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", role.cls)}>
                    {role.label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", status.dotCls)} />
                    <span className={cn("text-xs font-medium", status.textCls)}>
                      {status.label}
                    </span>
                  </span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border-dark/50">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Commandes</p>
                    <p className="text-sm font-bold text-white">{member.activeOrders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">CA généré</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(member.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Depuis le</p>
                    <p className="text-sm font-bold text-white">{formatDate(member.joinedAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Invite modal ── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInvite(false)}
          />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Inviter un membre</h3>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-background-dark transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@email.com"
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInvite();
                  }}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Rôle
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AgencyMember["role"])}
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="proprietaire">Propriétaire</option>
                  <option value="manager">Manager</option>
                  <option value="freelance">Freelance</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowInvite(false)}
                  className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors rounded-xl border border-border-dark"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInvite}
                  className="flex-1 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                  Envoyer l&apos;invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation dialog for removing a member ── */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmRemove(null)}
          />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-sm">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-400">
                  person_remove
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Retirer ce membre ?</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Êtes-vous sûr de vouloir retirer <span className="text-white font-semibold">{confirmRemove.name}</span> de
                  l&apos;agence ? Cette action est irréversible.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={() => setConfirmRemove(null)}
                  className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors rounded-xl border border-border-dark"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleRemoveMember(confirmRemove)}
                  className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors"
                >
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
