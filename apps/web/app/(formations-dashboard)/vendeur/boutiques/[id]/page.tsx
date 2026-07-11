"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ShopDomainPanel from "@/components/formations/ShopDomainPanel";
import { ImageUploader } from "@/components/formations/ImageUploader";
import { useToastStore } from "@/store/toast";
import { Store, ArrowLeft, ExternalLink, Check, Pipette, Save } from "lucide-react";
import { SHOP_FONTS, shopFontStack, shopFontHref } from "@/lib/formations/shop-fonts";

interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  themeColor: string | null;
  isPrimary: boolean;
  customDomain: string | null;
  customDomainVerified: boolean;
  legalName: string | null;
  legalAddress: string | null;
  legalPhone: string | null;
  legalEmail: string | null;
  legalCountry: string | null;
  font: string | null;
}

export default function VendorShopDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("");
  const [legalName, setLegalName] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [legalPhone, setLegalPhone] = useState("");
  const [legalEmail, setLegalEmail] = useState("");
  const [legalCountry, setLegalCountry] = useState("");
  const [font, setFont] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToastStore.getState().addToast;

  async function load() {
    try {
      const res = await fetch(`/api/formations/vendeur/shops/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setShop(json.data);
      setName(json.data.name ?? "");
      setDescription(json.data.description ?? "");
      setThemeColor(json.data.themeColor ?? "");
      setLegalName(json.data.legalName ?? "");
      setLegalAddress(json.data.legalAddress ?? "");
      setLegalPhone(json.data.legalPhone ?? "");
      setLegalEmail(json.data.legalEmail ?? "");
      setLegalCountry(json.data.legalCountry ?? "");
      setFont(json.data.font ?? "");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Charge la police sélectionnée pour un aperçu fidèle dans les réglages.
  useEffect(() => {
    const href = shopFontHref(font);
    if (!href) return;
    const linkId = `shopfont-${font}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [font]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/formations/vendeur/shops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          themeColor: themeColor || null,
          font: font || null,
          legalName: legalName || null,
          legalAddress: legalAddress || null,
          legalPhone: legalPhone || null,
          legalEmail: legalEmail || null,
          legalCountry: legalCountry || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast("error", json.error ?? "Erreur");
        return;
      }
      toast("success", "Boutique mise à jour");
      setShop(json.data);
    } finally {
      setSaving(false);
    }
  }

  // Auto-save image (logo OU cover) — pas besoin de cliquer Enregistrer
  async function patchMedia(field: "logoUrl" | "coverUrl", url: string | null) {
    try {
      const res = await fetch(`/api/formations/vendeur/shops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: url }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast("error", json.error ?? "Échec de la mise à jour");
        return;
      }
      setShop(json.data);
      toast("success", field === "logoUrl" ? "Logo mis à jour" : "Couverture mise à jour");
    } catch {
      toast("error", "Échec réseau");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-8">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-zinc-200 rounded" />
          <div className="h-48 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Store className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-base font-bold text-[#191c1e] mt-3">Boutique introuvable</p>
          <Link
            href="/vendeur/boutiques"
            className="inline-block mt-4 text-sm font-semibold text-[#006e2f]"
          >
            ← Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/vendeur/boutiques" className="text-sm font-semibold text-[#5c647a] hover:text-[#191c1e] inline-flex items-center gap-1.5">
            <ArrowLeft className="w-[18px] h-[18px]" />
            Mes boutiques
          </Link>
          <a
            href={shop.customDomain && shop.customDomainVerified ? `https://${shop.customDomain}` : `https://novakou.com/boutique/${shop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#006e2f] hover:underline inline-flex items-center gap-1.5"
          >
            Voir la boutique
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Branding : Logo + Photo de couverture */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-[#191c1e]">Identité visuelle</h2>
            <p className="text-xs text-[#5c647a] mt-1">
              Logo et photo de couverture spécifiques à <span className="font-semibold">cette boutique</span>.
              Apparaissent en haut de votre page publique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo (carré) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a]">
                Logo
              </label>
              <p className="text-[11px] text-[#5c647a] mb-2">
                Carré · idéal 400×400 · PNG transparent recommandé
              </p>
              <ImageUploader
                value={shop?.logoUrl ?? ""}
                onChange={(url) => patchMedia("logoUrl", url || null)}
                folder="portfolio"
                aspectClass="aspect-square"
                helper="JPG, PNG ou SVG · max 5 MB"
              />
            </div>

            {/* Cover (panoramique) */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a]">
                Photo de couverture
              </label>
              <p className="text-[11px] text-[#5c647a] mb-2">
                Bannière hero · idéal 1920×600 · sera affichée en haut de votre page publique
              </p>
              <ImageUploader
                value={shop?.coverUrl ?? ""}
                onChange={(url) => patchMedia("coverUrl", url || null)}
                folder="portfolio"
                aspectClass="aspect-[16/5]"
                helper="JPG ou PNG · max 5 MB · panoramique"
              />
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="text-base font-extrabold text-[#191c1e]">Identité de la boutique</h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Slug (URL Novakou)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#5c647a] font-mono">novakou.com/boutique/</span>
              <code className="text-sm text-[#191c1e] font-mono px-2 py-1 bg-gray-100 rounded">{shop.slug}</code>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="Présentez votre boutique en quelques phrases…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Couleur principale
            </label>
            <p className="text-xs text-[#5c647a] mb-3">
              Choisissez une couleur prédéfinie ou personnalisez la vôtre. Utilisée pour les boutons, liens et accents sur votre boutique publique.
            </p>

            {/* Palette prédéfinie */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-3">
              {[
                { hex: "#006e2f", name: "Novakou" },
                { hex: "#22c55e", name: "Émeraude" },
                { hex: "#0ea5e9", name: "Ciel" },
                { hex: "#2563eb", name: "Bleu royal" },
                { hex: "#7c3aed", name: "Violet" },
                { hex: "#db2777", name: "Rose" },
                { hex: "#dc2626", name: "Rouge" },
                { hex: "#ea580c", name: "Orange" },
                { hex: "#ca8a04", name: "Ocre" },
                { hex: "#0f766e", name: "Sarcelle" },
                { hex: "#1e293b", name: "Ardoise" },
                { hex: "#000000", name: "Noir" },
              ].map((c) => {
                const isActive = (themeColor || "#006e2f").toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setThemeColor(c.hex)}
                    title={c.name}
                    aria-label={`Choisir la couleur ${c.name}`}
                    className={`relative w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${
                      isActive ? "border-[#191c1e] scale-110 shadow-md" : "border-transparent"
                    }`}
                    style={{ background: c.hex }}
                  >
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                        <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Color picker natif + input hex */}
            <div className="flex items-center gap-3">
              <label
                className="relative w-12 h-12 rounded-xl border border-gray-200 cursor-pointer overflow-hidden flex-shrink-0"
                style={{ background: themeColor || "#006e2f" }}
                title="Ouvrir le sélecteur de couleur"
              >
                <input
                  type="color"
                  value={themeColor || "#006e2f"}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Sélecteur de couleur personnalisée"
                />
                <span className="absolute bottom-0.5 right-0.5 bg-white/80 rounded-full p-0.5 text-[#191c1e]">
                  <Pipette className="w-2.5 h-2.5" />
                </span>
              </label>
              <input
                type="text"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                placeholder="#006e2f"
                maxLength={7}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] font-mono focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 flex-1"
              />
            </div>
          </div>

          {/* ── Police d'écriture de la boutique ── */}
          <div className="pt-6 mt-2 border-t border-gray-100">
            <label className="block text-sm font-bold text-[#191c1e] mb-1">Police d&apos;écriture</label>
            <p className="text-xs text-[#5c647a] mb-3">Appliquée à toute votre boutique et à ses pages.</p>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="w-full sm:max-w-xs px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
              style={{ fontFamily: shopFontStack(font || "Inter") }}
            >
              <option value="">Inter (par défaut)</option>
              {SHOP_FONTS.filter((f) => f !== "Inter").map((f) => (
                <option key={f} value={f} style={{ fontFamily: shopFontStack(f) }}>{f}</option>
              ))}
            </select>
            {font && (
              <p className="mt-3 text-lg text-[#191c1e]" style={{ fontFamily: shopFontStack(font) }}>
                Aperçu : {name || "Votre boutique"} — vendez en beauté.
              </p>
            )}
          </div>

          {/* ── Infos légales — alimentent les pages auto-générées ── */}
          <div className="pt-6 mt-2 border-t border-gray-100">
            <p className="text-sm font-extrabold text-[#191c1e]">Informations légales</p>
            <p className="text-xs text-[#5c647a] mt-1 mb-4">
              Servent à générer automatiquement vos pages « Mentions légales », « Contact », « À propos »… Laissez vide pour utiliser les infos de votre compte.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#5c647a] mb-1">Raison sociale</label>
                <input type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder={name || "Nom de l'entreprise"} maxLength={120}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5c647a] mb-1">Pays</label>
                <input type="text" value={legalCountry} onChange={(e) => setLegalCountry(e.target.value)} placeholder="Bénin, France…" maxLength={60}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#5c647a] mb-1">Adresse</label>
                <input type="text" value={legalAddress} onChange={(e) => setLegalAddress(e.target.value)} placeholder="Ville, quartier / rue…" maxLength={240}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5c647a] mb-1">Téléphone</label>
                <input type="tel" value={legalPhone} onChange={(e) => setLegalPhone(e.target.value)} placeholder="+229 …" maxLength={40}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5c647a] mb-1">E-mail de contact</label>
                <input type="email" value={legalEmail} onChange={(e) => setLegalEmail(e.target.value)} placeholder="contact@…" maxLength={120}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <Save className="w-4 h-4" />
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Domain panel (per-shop) */}
        <ShopDomainPanel shopId={shop.id} />
      </div>
    </div>
  );
}
