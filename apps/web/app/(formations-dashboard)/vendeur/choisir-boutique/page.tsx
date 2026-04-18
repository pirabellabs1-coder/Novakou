"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Shop {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
  themeColor: string | null;
  logoUrl: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
}

export default function ChoisirBoutiquePage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/formations/vendeur/shops/active");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur");
        setShops(json.data?.shops ?? []);
        setActiveShopId(json.data?.activeShop?.id ?? null);
        // If only 1 shop → auto-go to dashboard (server already auto-selected it)
        if ((json.data?.shops ?? []).length === 1 && !json.data?.needsChooser) {
          router.replace("/vendeur/dashboard");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function pick(shopId: string) {
    setSwitching(shopId);
    try {
      const res = await fetch("/api/formations/vendeur/shops/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });
      if (!res.ok) {
        setSwitching(null);
        return;
      }
      router.push("/vendeur/dashboard");
      router.refresh();
    } catch {
      setSwitching(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (newName.trim().length < 2 || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/formations/vendeur/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "Création impossible");
        return;
      }
      // Auto-select the new (blank) shop
      const newShop = json.data?.shop;
      if (newShop?.id) {
        await fetch("/api/formations/vendeur/shops/active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId: newShop.id }),
        });
        router.push("/vendeur/dashboard");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <div className="w-full max-w-3xl">
        {/* Branding */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center"
            style={{ background: "#006e2f" }}
          >
            <span className="text-white font-extrabold text-sm">NK</span>
          </div>
          <span className="font-bold text-[#191c1e] text-lg">Novakou</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">
            Choisissez votre boutique
          </h1>
          <p className="text-sm md:text-base text-[#5c647a] mt-3 max-w-lg mx-auto">
            Vous avez {shops.length} boutiques. Sélectionnez celle dans laquelle vous voulez travailler. Vous pourrez en
            changer à tout moment depuis le menu en haut.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            <div className="h-36 bg-white rounded-2xl border border-gray-100" />
            <div className="h-36 bg-white rounded-2xl border border-gray-100" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shops.map((s) => {
                const isCurrent = s.id === activeShopId;
                const busy = switching === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => pick(s.id)}
                    disabled={!!switching}
                    className={`group text-left bg-white rounded-2xl border p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 ${
                      isCurrent ? "border-[#006e2f] ring-2 ring-[#006e2f]/20" : "border-gray-100 hover:border-[#006e2f]/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-base flex-shrink-0"
                        style={{ background: s.themeColor || "linear-gradient(135deg, #006e2f, #22c55e)" }}
                      >
                        {s.name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-extrabold text-[#191c1e] truncate">{s.name}</p>
                          {s.isPrimary && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
                              Principale
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5c647a] truncate mt-0.5">
                          {s.customDomain && s.customDomainVerified
                            ? s.customDomain
                            : `novakou.com/boutique/${s.slug}`}
                        </p>
                      </div>
                      {busy ? (
                        <span className="material-symbols-outlined text-[18px] text-[#006e2f] animate-spin flex-shrink-0">
                          progress_activity
                        </span>
                      ) : isCurrent ? (
                        <span className="material-symbols-outlined text-[20px] text-[#006e2f] flex-shrink-0">
                          radio_button_checked
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[20px] text-gray-300 group-hover:text-[#006e2f] flex-shrink-0">
                          arrow_forward
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create new shop */}
            {shops.length < 5 && (
              <div className="mt-5">
                {!showCreate ? (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 hover:border-[#006e2f]/40 transition-colors text-[#5c647a] hover:text-[#191c1e] inline-flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span className="text-sm font-bold">Créer une nouvelle boutique vierge</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleCreate}
                    className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col md:flex-row gap-3 items-stretch md:items-end"
                  >
                    <div className="flex-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
                        Nom de la nouvelle boutique
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ex: Tools IA Pro"
                        maxLength={80}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
                      />
                      <p className="text-[11px] text-[#5c647a] mt-1.5">
                        Cette boutique démarre <strong>vierge</strong> : aucun produit, ni marketing, ni paramètres préremplis.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreate(false);
                          setNewName("");
                        }}
                        className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#5c647a] hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={creating || newName.trim().length < 2}
                        className="px-6 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
                        style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        {creating ? "Création…" : "Créer & ouvrir"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="text-center mt-8">
              <Link
                href="/vendeur/boutiques"
                className="text-xs text-[#5c647a] hover:text-[#191c1e] font-semibold inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">settings</span>
                Gérer mes boutiques
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
