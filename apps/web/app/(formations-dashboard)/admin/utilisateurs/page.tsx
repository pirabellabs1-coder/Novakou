"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
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
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1600px] mx-auto space-y-8">
        <KazaHero
          badge="Admin"
          badgeColor="orange"
          icon={Users}
          title="Utilisateurs"
          subtitle={
            isLoading
              ? "Chargement..."
              : `${summary?.totalUsers ?? 0} comptes au total · ${summary?.totalInstructors ?? 0} instructeurs · ${summary?.totalLearners ?? 0} apprenants`
          }
          actions={
            <KazaButton variant="secondary" icon={Download}>
              Exporter CSV
            </KazaButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KazaKpiCard
            label="Comptes totaux"
            value={summary?.totalUsers ?? 0}
            icon={Users}
            iconColor="navy"
          />
          <KazaKpiCard
            label="Instructeurs"
            value={summary?.totalInstructors ?? 0}
            icon={GraduationCap}
            iconColor="emerald"
          />
          <KazaKpiCard
            label="Apprenants"
            value={summary?.totalLearners ?? 0}
            icon={UserCheck}
            iconColor="sky"
          />
        </div>

        {/* Filtres */}
        <KazaCard>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Rechercher par nom ou email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filter === tab.value
                      ? "bg-[#0b2540] text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${
                      filter === tab.value
                        ? "bg-white/15 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </KazaCard>

        {/* Table */}
        <KazaCard noPadding>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-5">
              <KazaEmpty
                icon={Users}
                title="Aucun utilisateur"
                description="Aucun compte ne correspond à votre recherche."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-5 py-3 text-left font-semibold">
                      Compte
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">Rôle</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Produits
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Gagné
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Dépensé
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const initials = (u.name ?? u.email)
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const createdDate = new Date(u.createdAt).toLocaleDateString(
                      "fr-FR",
                      { day: "numeric", month: "short", year: "numeric" }
                    );
                    const isBlocked =
                      u.status === "SUSPENDU" || u.status === "BANNI";
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {u.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.image}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0b2540] to-[#1a4a7d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {u.name ?? "—"}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {u.email}
                              </p>
                              <p className="text-[10px] tabular-nums text-slate-400 mt-0.5">
                                Inscrit le {createdDate}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {u.isInstructor ? (
                            <KazaBadge variant="green" icon={GraduationCap}>
                              Instructeur
                            </KazaBadge>
                          ) : (
                            <KazaBadge variant="slate" icon={UserCheck}>
                              Apprenant
                            </KazaBadge>
                          )}
                          {isBlocked && (
                            <div className="mt-1">
                              <KazaBadge variant="rose">{u.status}</KazaBadge>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-extrabold tabular-nums text-slate-900">
                            {u.productsCount}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-extrabold tabular-nums text-emerald-700">
                            {formatFCFA(u.totalEarned)}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            FCFA
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-extrabold tabular-nums text-slate-900">
                            {formatFCFA(u.totalSpent)}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            {u.enrollmentsCount + u.purchasesCount} achats
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 justify-end">
                            {isBlocked ? (
                              <KazaButton
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
                              </KazaButton>
                            ) : (
                              <>
                                <KazaButton
                                  variant="ghost"
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
                                </KazaButton>
                                <KazaButton
                                  variant="danger"
                                  size="sm"
                                  icon={Ban}
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
                                </KazaButton>
                              </>
                            )}
                            <KazaButton
                              variant="ghost"
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
                            </KazaButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </KazaCard>
      </main>
    </div>
  );
}
