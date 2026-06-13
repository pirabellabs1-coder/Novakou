"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StButton,
  StChip,
  StAvatar,
  ST,
} from "@/components/stitch";
import {
  Users,
  Search,
  GraduationCap,
  UserCheck,
  Trash2,
  Ban,
  PauseCircle,
  PlayCircle,
  Download,
} from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  status?: string;
  createdAt: string;
  isInstructor: boolean;
  instructorStatus: string | null;
  productsCount: number;
  totalEarned: number;
  enrollmentsCount: number;
  purchasesCount: number;
  totalSpent: number;
};

type Summary = {
  totalUsers: number;
  totalInstructors: number;
  totalLearners: number;
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export default function AdminUtilisateursPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "instructeurs" | "apprenants">(
    "all"
  );
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery<{
    data: User[];
    summary: Summary;
  }>({
    queryKey: ["admin-utilisateurs", filter, search],
    queryFn: () =>
      fetch(
        `/api/formations/admin/utilisateurs?filter=${filter}&search=${encodeURIComponent(search)}`
      ).then((r) => r.json()),
    staleTime: 15_000,
  });

  const userActionMutation = useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: string;
      reason?: string;
    }) =>
      fetch(`/api/formations/admin/utilisateurs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-utilisateurs"] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/formations/admin/utilisateurs/${id}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-utilisateurs"] }),
  });

  const users = response?.data ?? [];
  const summary = response?.summary;

  const tabs: { value: typeof filter; label: string; count: number }[] = [
    { value: "all", label: "Tous", count: summary?.totalUsers ?? 0 },
    {
      value: "instructeurs",
      label: "Instructeurs",
      count: summary?.totalInstructors ?? 0,
    },
    {
      value: "apprenants",
      label: "Apprenants",
      count: summary?.totalLearners ?? 0,
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-5">
        <StPageHeader
          title="Utilisateurs"
          subtitle={
            isLoading
              ? "Chargement..."
              : `${summary?.totalUsers ?? 0} comptes au total · ${summary?.totalInstructors ?? 0} instructeurs · ${summary?.totalLearners ?? 0} apprenants`
          }
          actions={
            <StButton variant="secondary" icon={Download}>
              Exporter CSV
            </StButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <StKpiCompact
            label="Comptes totaux"
            value={summary?.totalUsers ?? 0}
            icon={Users}
            tone="green"
          />
          <StKpiCompact
            label="Instructeurs"
            value={summary?.totalInstructors ?? 0}
            icon={GraduationCap}
            tone="green"
          />
          <StKpiCompact
            label="Apprenants"
            value={summary?.totalLearners ?? 0}
            icon={UserCheck}
            tone="blue"
          />
        </div>

        {/* Filtres */}
        <StCard>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: ST.textMuted }}
              />
              <input
                type="text"
                placeholder="Rechercher par nom ou email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-[13.5px] font-semibold focus:outline-none transition-all"
                style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
              />
            </div>
            <div className="flex gap-1 p-1 rounded-[13px]" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
              {tabs.map((tab) => {
                const on = filter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors whitespace-nowrap"
                    style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
                  >
                    {tab.label}
                    <span className="text-[10px] tabular-nums">· {tab.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </StCard>

        {/* Table */}
        <StCard noPadding>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl"
                  style={{ background: ST.divider }}
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center">
              <Users size={36} style={{ color: "#d6e0da" }} />
              <p className="text-[13.5px] font-extrabold mt-3" style={{ color: ST.text }}>Aucun utilisateur</p>
              <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                Aucun compte ne correspond à votre recherche.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {[
                      { h: "Compte", align: "text-left" },
                      { h: "Rôle", align: "text-left" },
                      { h: "Produits", align: "text-right" },
                      { h: "Gagné", align: "text-right" },
                      { h: "Dépensé", align: "text-right" },
                      { h: "Actions", align: "text-right" },
                    ].map((c) => (
                      <th
                        key={c.h}
                        className={`text-[10.5px] uppercase font-extrabold px-5 py-3 ${c.align}`}
                        style={{ color: ST.textMuted, letterSpacing: ".06em" }}
                      >
                        {c.h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const createdDate = new Date(u.createdAt).toLocaleDateString(
                      "fr-FR",
                      { day: "numeric", month: "short", year: "numeric" }
                    );
                    const isBlocked =
                      u.status === "SUSPENDU" || u.status === "BANNI";
                    return (
                      <tr key={u.id} className="transition-colors hover:bg-[#f7faf8]">
                        <td className="px-5 py-4" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <div className="flex items-center gap-3 min-w-0">
                            <StAvatar name={u.name ?? u.email} src={u.image} size={40} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-extrabold truncate" style={{ color: ST.text }}>
                                {u.name ?? "—"}
                              </p>
                              <p className="text-[11.5px] truncate" style={{ color: ST.textSecondary }}>
                                {u.email}
                              </p>
                              <p className="text-[10px] tabular-nums mt-0.5" style={{ color: ST.textFaint }}>
                                Inscrit le {createdDate}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          {u.isInstructor ? (
                            <StChip tone="green" icon={GraduationCap}>
                              Instructeur
                            </StChip>
                          ) : (
                            <StChip tone="neutral" icon={UserCheck}>
                              Apprenant
                            </StChip>
                          )}
                          {isBlocked && (
                            <div className="mt-1">
                              <StChip tone="rose">{u.status}</StChip>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <p className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                            {u.productsCount}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <p className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.green }}>
                            {formatFCFA(u.totalEarned)}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest" style={{ color: ST.textFaint }}>
                            FCFA
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <p className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                            {formatFCFA(u.totalSpent)}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest" style={{ color: ST.textFaint }}>
                            {u.enrollmentsCount + u.purchasesCount} achats
                          </p>
                        </td>
                        <td className="px-5 py-4" style={{ borderTop: `1px solid ${ST.divider}` }}>
                          <div className="flex gap-1.5 justify-end">
                            {isBlocked ? (
                              <StButton
                                variant="primary"
                                size="sm"
                                icon={PlayCircle}
                                onClick={() =>
                                  userActionMutation.mutate({
                                    id: u.id,
                                    action: "activate",
                                  })
                                }
                                disabled={userActionMutation.isPending}
                              >
                                Activer
                              </StButton>
                            ) : (
                              <>
                                <StButton
                                  variant="secondary"
                                  size="sm"
                                  icon={PauseCircle}
                                  onClick={() => {
                                    const reason = prompt(
                                      "Raison de la suspension :"
                                    );
                                    if (reason !== null)
                                      userActionMutation.mutate({
                                        id: u.id,
                                        action: "suspend",
                                        reason,
                                      });
                                  }}
                                  disabled={userActionMutation.isPending}
                                >
                                  Suspendre
                                </StButton>
                                <StButton
                                  variant="secondary"
                                  size="sm"
                                  icon={Ban}
                                  className="!text-[#993556]"
                                  onClick={async () => {
                                    const ok = await confirmAction({
                                      title:
                                        "Bannir définitivement ce compte ?",
                                      message:
                                        "Toutes ses données seront conservées mais il ne pourra plus se connecter.",
                                      confirmLabel: "Bannir",
                                      confirmVariant: "danger",
                                      icon: "block",
                                    });
                                    if (ok) {
                                      userActionMutation.mutate({
                                        id: u.id,
                                        action: "ban",
                                      });
                                    }
                                  }}
                                  disabled={userActionMutation.isPending}
                                >
                                  Bannir
                                </StButton>
                              </>
                            )}
                            <StButton
                              variant="secondary"
                              size="sm"
                              icon={Trash2}
                              onClick={async () => {
                                const ok = await confirmAction({
                                  title: "Supprimer ce compte ?",
                                  message: `Cette action est irréversible. Le compte ${u.email} et toutes ses données associées seront définitivement supprimés.`,
                                  confirmLabel: "Supprimer",
                                  confirmVariant: "danger",
                                  icon: "delete_forever",
                                });
                                if (ok) deleteUserMutation.mutate(u.id);
                              }}
                              disabled={deleteUserMutation.isPending}
                            >
                              Supprimer
                            </StButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </StCard>
      </main>
    </div>
  );
}
