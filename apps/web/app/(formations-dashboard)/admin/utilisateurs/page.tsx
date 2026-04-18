"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";

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

type Summary = { totalUsers: number; totalInstructors: number; totalLearners: number };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export default function AdminUtilisateursPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "instructeurs" | "apprenants">("all");
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery<{ data: User[]; summary: Summary }>({
    queryKey: ["admin-utilisateurs", filter, search],
    queryFn: () =>
      fetch(`/api/formations/admin/utilisateurs?filter=${filter}&search=${encodeURIComponent(search)}`).then((r) => r.json()),
    staleTime: 15_000,
  });

  const userActionMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: string; reason?: string }) =>
      fetch(`/api/formations/admin/utilisateurs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-utilisateurs"] }),
  });

  const users = response?.data ?? [];
  const summary = response?.summary;

  const tabs: { value: typeof filter; label: string; count: number }[] = [
    { value: "all", label: "Tous", count: summary?.totalUsers ?? 0 },
    { value: "instructeurs", label: "Instructeurs", count: summary?.totalInstructors ?? 0 },
    { value: "apprenants", label: "Apprenants", count: summary?.totalLearners ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1920px] mx-auto">
        <header className="mb-12">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
            Community Directory
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">Utilisateurs</h1>
          <p className="text-sm text-zinc-500 mt-3">
            {isLoading
              ? "Chargement…"
              : `${summary?.totalUsers ?? 0} comptes · ${summary?.totalInstructors ?? 0} instructeurs · ${summary?.totalLearners ?? 0} apprenants`}
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400">search</span>
            <input
              type="text"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-zinc-100 focus:border-[#22c55e] py-4 pl-12 pr-6 text-sm placeholder:text-zinc-400 outline-none transition-colors"
            />
          </div>
          <div className="flex gap-0 border border-zinc-100 bg-white">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-2 px-5 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === tab.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {tab.label}
                <span className={`text-[9px] tabular-nums ${filter === tab.value ? "text-[#22c55e]" : "text-zinc-400"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-6 px-8 py-4 border-b border-zinc-100">
            {["Compte", "Rôle", "Produits", "Gagné", "Dépensé", "Actions"].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div className="p-8 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-[#f3f3f4] animate-pulse" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Aucun résultat</p>
              <p className="text-sm text-zinc-500">Aucun utilisateur ne correspond à la recherche.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {users.map((u) => {
                const initials = (u.name ?? u.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                const createdDate = new Date(u.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                return (
                  <div key={u.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-6 px-8 py-5 items-center hover:bg-[#f3f3f4] transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt="" className="w-11 h-11 object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 bg-zinc-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">{u.name ?? "—"}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{u.email}</p>
                        <p className="text-[9px] tabular-nums text-zinc-400 uppercase tracking-widest mt-0.5">Depuis {createdDate}</p>
                      </div>
                    </div>
                    <div>
                      {u.isInstructor ? (
                        <span className="inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest bg-[#22c55e] text-[#004b1e]">
                          Instructeur
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest bg-zinc-200 text-zinc-700">
                          Apprenant
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold tabular-nums text-zinc-900">{u.productsCount}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">produits</p>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold tabular-nums text-[#006e2f]">{formatFCFA(u.totalEarned)}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">FCFA</p>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold tabular-nums text-zinc-900">{formatFCFA(u.totalSpent)}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{u.enrollmentsCount + u.purchasesCount} achats</p>
                    </div>
                    <div className="flex gap-0">
                      {u.status === "SUSPENDU" || u.status === "BANNI" ? (
                        <button
                          onClick={() => userActionMutation.mutate({ id: u.id, action: "activate" })}
                          disabled={userActionMutation.isPending}
                          className="px-3 py-2 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors disabled:opacity-50"
                        >
                          Activer
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              const reason = prompt("Raison de la suspension :");
                              if (reason !== null) userActionMutation.mutate({ id: u.id, action: "suspend", reason });
                            }}
                            disabled={userActionMutation.isPending}
                            className="px-3 py-2 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-200 transition-colors disabled:opacity-50"
                            title="Suspendre le compte"
                          >
                            Suspendre
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await confirmAction({
                                title: "Bannir définitivement ce compte ?",
                                message: "Toutes ses données seront conservées mais il ne pourra plus se connecter.",
                                confirmLabel: "Bannir",
                                confirmVariant: "danger",
                                icon: "block",
                              });
                              if (ok) {
                                userActionMutation.mutate({ id: u.id, action: "ban" });
                              }
                            }}
                            disabled={userActionMutation.isPending}
                            className="px-3 py-2 bg-[#ffdad6] text-[#93000a] text-[10px] font-bold uppercase tracking-widest hover:bg-[#ffb4a9] transition-colors disabled:opacity-50"
                            title="Bannir définitivement"
                          >
                            Bannir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
