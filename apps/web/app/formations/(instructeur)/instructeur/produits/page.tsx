"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Plus, Eye, Archive, ShoppingBag, Star, Copy, BarChart2,
  BookOpen, FileText, Palette, Key, Headphones, Video, Package,
} from "lucide-react";
import { useInstructorProducts, useInstructorMutation, instructorKeys } from "@/lib/formations/hooks";

import EmptyState from "@/components/formations/EmptyState";

interface Product {
  id: string;
  slug: string;
  title: string;
  productType: string;
  categoryId: string;
  price: number;
  salesCount: number;
  viewsCount: number;
  rating: number;
  reviewsCount: number;
  maxBuyers: number | null;
  currentBuyers: number;
  status: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; labelEn: string; color: string }> = {
  ACTIF: { label: "Actif", labelEn: "Active", color: "bg-green-100 text-green-700" },
  EN_ATTENTE: { label: "En attente", labelEn: "Pending", color: "bg-amber-100 text-amber-700" },
  BROUILLON: { label: "Brouillon", labelEn: "Draft", color: "bg-slate-100 dark:bg-slate-800 text-slate-600" },
  ARCHIVE: { label: "Archivé", labelEn: "Archived", color: "bg-red-100 text-red-600" },
  REFUSE: { label: "Refusé", labelEn: "Rejected", color: "bg-red-100 text-red-700" },
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  EBOOK: { icon: BookOpen, label: "Ebook", color: "text-blue-600", bg: "bg-blue-50" },
  PDF: { icon: FileText, label: "PDF", color: "text-red-600", bg: "bg-red-50" },
  TEMPLATE: { icon: Palette, label: "Template", color: "text-purple-600", bg: "bg-purple-50" },
  LICENCE: { icon: Key, label: "Licence", color: "text-amber-600", bg: "bg-amber-50" },
  AUDIO: { icon: Headphones, label: "Audio", color: "text-cyan-600", bg: "bg-cyan-50" },
  VIDEO: { icon: Video, label: "Vidéo", color: "text-pink-600", bg: "bg-pink-50" },
  AUTRE: { icon: Package, label: "Autre", color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-800/50" },
};

export default function InstructeurProduitsPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const { data: productsData, isLoading: loading, error: queryError, refetch } = useInstructorProducts();
  const products: Product[] = (productsData as { products?: Product[] } | null)?.products ?? [];
  const error = queryError ? (fr ? "Erreur lors du chargement" : "Loading error") : "";
  const [filter, setFilter] = useState<string>("all");

  const archiveMutation = useInstructorMutation(
    async (id: string) => {
      const res = await fetch(`/api/instructeur/produits?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      return res.json();
    },
    [instructorKeys.products()]
  );

  const duplicateMutation = useInstructorMutation(
    async (product: Product) => {
      const res = await fetch("/api/instructeur/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${product.title} - Copie`,
          type: product.productType,
          categoryId: product.categoryId,
          price: product.price,
        }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    [instructorKeys.products()]
  );

  function handleArchive(id: string) {
    if (!confirm(fr ? "Archiver ce produit ?" : "Archive this product?")) return;
    archiveMutation.mutate(id, {
      onError: () => alert(fr ? "Erreur lors de l'archivage" : "Error archiving"),
    });
  }

  function handleDuplicate(product: Product) {
    duplicateMutation.mutate(product, {
      onError: () => alert(fr ? "Erreur lors de la duplication" : "Error duplicating"),
    });
  }

  const productTypes = ["all", ...new Set(products.map((p) => p.productType))];
  const filtered = filter === "all" ? products : products.filter((p) => p.productType === filter);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {fr ? "Mes produits numériques" : "My digital products"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} {fr ? "produit(s)" : "product(s)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/formations/instructeur/produits/dashboard"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary border border-slate-200 dark:border-slate-700 hover:border-primary/50 px-4 py-2 rounded-xl transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            {fr ? "Statistiques" : "Stats"}
          </Link>
          <Link
            href="/formations/instructeur/produits/creer"
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            {fr ? "Nouveau produit" : "New product"}
          </Link>
        </div>
      </div>

      {/* Filters */}
      {products.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {productTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === type
                  ? "bg-primary text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type === "all" ? (fr ? "Tous" : "All") : (TYPE_CONFIG[type]?.label || type)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => refetch()}
            className="ml-4 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      )}

      {/* Products grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-10 h-10 text-slate-300" />}
          title={fr ? "Aucun produit" : "No products"}
          description={fr ? "Créez votre premier produit numérique (ebook, template, audio...)" : "Create your first digital product (ebook, template, audio...)"}
          ctaLabel={fr ? "Créer un produit" : "Create a product"}
          ctaHref="/formations/instructeur/produits/creer"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const title = product.title;
            const status = STATUS_MAP[product.status] || STATUS_MAP.BROUILLON;
            const typeConfig = TYPE_CONFIG[product.productType] || TYPE_CONFIG.AUTRE;
            const TypeIcon = typeConfig.icon;
            const revenue = product.price * product.salesCount * 0.7;

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                {/* Card header with type icon */}
                <div className={`${typeConfig.bg} p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                      <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.color}`}>
                      {fr ? status.label : status.labelEn}
                    </span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">{product.price}€</span>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate mb-3">{title}</h3>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{product.salesCount}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{fr ? "Ventes" : "Sales"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{product.viewsCount}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{fr ? "Vues" : "Views"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{revenue.toFixed(0)}€</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{fr ? "Revenus" : "Revenue"}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= Math.round(product.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                        />
                      ))}
                      <span className="text-xs text-slate-500 ml-1">{product.rating.toFixed(1)} ({product.reviewsCount})</span>
                    </div>
                  )}

                  {/* Stock indicator */}
                  {product.maxBuyers && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{fr ? "Stock" : "Stock"}</span>
                        <span className="text-slate-700 font-medium">{product.currentBuyers}/{product.maxBuyers}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(product.currentBuyers / product.maxBuyers) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
                    <Link
                      href={`/formations/produits/${product.slug}`}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-primary py-1.5 rounded-lg hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> {fr ? "Voir" : "View"}
                    </Link>
                    <button
                      onClick={() => handleDuplicate(product)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 py-1.5 rounded-lg hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> {fr ? "Dupliquer" : "Duplicate"}
                    </button>
                    {product.status !== "ARCHIVE" && (
                      <button
                        onClick={() => handleArchive(product.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-red-500 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" /> {fr ? "Archiver" : "Archive"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
