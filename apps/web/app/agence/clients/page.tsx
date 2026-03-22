"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAgencyStore, type AgencyClient } from "@/store/agency";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

// ── Sort options ──

type SortKey = "name" | "totalRevenue" | "totalOrders" | "lastOrderAt";

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: "name", label: "Nom", icon: "sort_by_alpha" },
  { key: "totalRevenue", label: "CA", icon: "payments" },
  { key: "totalOrders", label: "Commandes", icon: "shopping_cart" },
  { key: "lastOrderAt", label: "Dernière activité", icon: "schedule" },
];

// ── Helpers ──

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

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Client Detail Panel ──

function ClientDetailPanel({
  client,
  onClose,
}: {
  client: AgencyClient;
  onClose: () => void;
}) {
  const { addToast } = useToastStore();
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const [localNotes, setLocalNotes] = useState(client.notes);
  const [saving, setSaving] = useState(false);

  // Reset local notes when client changes
  useEffect(() => {
    setLocalNotes(client.notes);
  }, [client.id, client.notes]);

  const handleNotesBlur = useCallback(() => {
    if (localNotes === client.notes) return;
    setSaving(true);
    // Simulate save — in production this would call an API
    const timer = setTimeout(() => {
      setSaving(false);
      addToast("success", "Notes sauvegardées");
    }, 400);
    return () => clearTimeout(timer);
  }, [localNotes, client.notes, addToast]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-neutral-dark rounded-2xl border border-border-dark w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-dark border-b border-border-dark rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {client.avatar ? (
              <Image
                src={client.avatar}
                alt={client.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                {getInitials(client.name)}
              </div>
            )}
            <div>
              <h3 className="font-bold text-white">{client.name}</h3>
              <p className="text-xs text-slate-500">{client.email || "Pas d'email"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info row */}
          <div className="flex items-center gap-3 flex-wrap">
            {client.country && (
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <span className="material-symbols-outlined text-base">location_on</span>
                {client.country}
              </div>
            )}
            <div
              className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                client.status === "actif"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-slate-500/15 text-slate-400"
              )}
            >
              {client.status === "actif" ? "Actif" : "Inactif"}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background-dark rounded-xl p-4 border border-border-dark">
              <p className="text-xl font-black text-white">
                {formatAmount(client.totalRevenue)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">
                CA Total
              </p>
            </div>
            <div className="bg-background-dark rounded-xl p-4 border border-border-dark">
              <p className="text-xl font-black text-white">{client.totalOrders}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">
                Commandes
              </p>
            </div>
          </div>

          {/* Order history summary */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
              Historique des commandes
            </p>
            <div className="bg-background-dark rounded-xl p-4 border border-border-dark space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Première commande</span>
                <span className="text-white font-medium">
                  {client.firstOrderAt ? formatDate(client.firstOrderAt) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Dernière commande</span>
                <span className="text-white font-medium">
                  {client.lastOrderAt ? formatDate(client.lastOrderAt) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Commandes totales</span>
                <span className="text-white font-medium">{client.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Panier moyen</span>
                <span className="text-white font-medium">
                  {client.totalOrders > 0
                    ? formatAmount(client.totalRevenue / client.totalOrders)
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Internal notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Notes internes
              </p>
              {saving && (
                <span className="text-[10px] text-primary animate-pulse">
                  Sauvegarde...
                </span>
              )}
            </div>
            <textarea
              ref={notesRef}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              rows={4}
              placeholder="Ajoutez des notes internes sur ce client..."
              className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-600 outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/agence/messages"
              className="flex-1 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              Contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function AgenceClients() {
  const { clients, syncAll, isLoading } = useAgencyStore();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastOrderAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync on mount
  useEffect(() => {
    syncAll();
  }, [syncAll]);

  // Filtered + sorted clients
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();

    let result = clients;

    if (q) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name, "fr");
          break;
        case "totalRevenue":
          cmp = a.totalRevenue - b.totalRevenue;
          break;
        case "totalOrders":
          cmp = a.totalOrders - b.totalOrders;
          break;
        case "lastOrderAt":
          cmp =
            new Date(a.lastOrderAt).getTime() -
            new Date(b.lastOrderAt).getTime();
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [clients, search, sortKey, sortAsc]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedId) ?? null,
    [clients, selectedId]
  );

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortAsc((prev) => !prev);
      } else {
        setSortKey(key);
        setSortAsc(false);
      }
    },
    [sortKey]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Clients</h1>
        <p className="text-slate-400 text-sm mt-1">
          Retrouvez tous vos clients et leur historique.
        </p>
      </div>

      {/* Search + sort bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-slate-500 font-semibold mr-1">Trier :</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                sortKey === opt.key
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <span className="material-symbols-outlined text-sm">{opt.icon}</span>
              {opt.label}
              {sortKey === opt.key && (
                <span className="material-symbols-outlined text-xs">
                  {sortAsc ? "arrow_upward" : "arrow_downward"}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-500 text-sm mt-4">Chargement des clients...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-slate-600">
              people
            </span>
          </div>
          <p className="text-white font-semibold text-lg mb-1">Aucun client</p>
          <p className="text-slate-500 text-sm max-w-sm">
            Vos clients apparaîtront ici après vos premières commandes.
          </p>
        </div>
      )}

      {/* No search results */}
      {!isLoading && clients.length > 0 && filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">
            search_off
          </span>
          <p className="text-slate-400 font-medium">Aucun résultat</p>
          <p className="text-slate-500 text-sm mt-1">
            Aucun client ne correspond à &quot;{search}&quot;
          </p>
        </div>
      )}

      {/* Clients table */}
      {filteredClients.length > 0 && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_0.7fr_0.8fr_0.8fr_0.6fr_0.6fr_0.5fr] gap-3 px-5 py-3 border-b border-border-dark">
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
              Client
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
              Email
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
              Pays
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
              1ère commande
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
              Dernière commande

            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider text-right">
              Commandes
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider text-right">
              CA
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider text-center">
              Statut
            </p>
          </div>

          {/* Rows */}
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedId(client.id)}
              className={cn(
                "w-full text-left transition-all",
                "md:grid md:grid-cols-[1fr_1fr_0.7fr_0.8fr_0.8fr_0.6fr_0.6fr_0.5fr] md:gap-3 md:items-center",
                "flex flex-col gap-2 p-4 md:px-5 md:py-3.5",
                "border-b border-border-dark last:border-b-0",
                "hover:bg-white/[0.02]",
                selectedId === client.id && "bg-primary/5"
              )}
            >
              {/* Client name + avatar */}
              <div className="flex items-center gap-3">
                {client.avatar ? (
                  <Image
                    src={client.avatar}
                    alt={client.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {getInitials(client.name)}
                  </div>
                )}
                <p className="text-sm font-semibold text-white truncate">
                  {client.name}
                </p>
              </div>

              {/* Email */}
              <p className="text-sm text-slate-400 truncate">
                {client.email || "—"}
              </p>

              {/* Country */}
              <p className="text-sm text-slate-400 truncate">
                {client.country || "—"}
              </p>

              {/* First order date */}
              <p className="text-sm text-slate-400">
                {client.firstOrderAt ? formatDate(client.firstOrderAt) : "—"}
              </p>

              {/* Last order date */}
              <p className="text-sm text-slate-400">
                {client.lastOrderAt ? formatDate(client.lastOrderAt) : "—"}
              </p>

              {/* Total orders */}
              <p className="text-sm text-white font-medium text-right">
                {client.totalOrders}
              </p>

              {/* Total revenue */}
              <p className="text-sm text-white font-bold text-right">
                {formatAmount(client.totalRevenue)}
              </p>

              {/* Status badge */}
              <div className="flex justify-center">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                    client.status === "actif"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-slate-500/15 text-slate-400"
                  )}
                >
                  {client.status === "actif" ? "Actif" : "Inactif"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && clients.length > 0 && (
        <p className="text-xs text-slate-600 text-right">
          {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""}
          {search && ` sur ${clients.length}`}
        </p>
      )}

      {/* Detail modal */}
      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
