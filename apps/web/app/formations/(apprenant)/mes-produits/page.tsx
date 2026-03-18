"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Download, Key, ShoppingBag, BookOpen, FileText, Headphones, Video, Package } from "lucide-react";
import Link from "next/link";

interface Purchase {
  id: string;
  paidAmount: number;
  licenseKey: string | null;
  downloadCount: number;
  maxDownloads: number;
  createdAt: string;
  product: {
    id: string;
    slug: string;
    titleFr: string;
    titleEn: string;
    productType: string;
    banner: string | null;
    fileMimeType: string | null;
  };
}

function ProductTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "EBOOK": return <BookOpen className="w-6 h-6 text-primary" />;
    case "PDF": return <FileText className="w-6 h-6 text-primary" />;
    case "TEMPLATE": return <Package className="w-6 h-6 text-primary" />;
    case "LICENCE": return <Key className="w-6 h-6 text-primary" />;
    case "AUDIO": return <Headphones className="w-6 h-6 text-primary" />;
    case "VIDEO": return <Video className="w-6 h-6 text-primary" />;
    default: return <Package className="w-6 h-6 text-primary" />;
  }
}

export default function MesProduitsPage() {
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (status !== "authenticated") return;

    fetch("/api/apprenant/produits")
      .then((r) => r.json())
      .then((data) => setPurchases(data.purchases || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, router]);

  function copyLicenseKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        {fr ? "Mes produits numériques" : "My Digital Products"}
      </h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">
            {fr ? "Aucun produit acheté" : "No products purchased"}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {fr ? "Explorez nos produits numériques" : "Explore our digital products"}
          </p>
          <Link
            href="/formations/produits"
            className="inline-flex items-center gap-2 mt-4 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90"
          >
            {fr ? "Voir les produits" : "Browse products"}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => {
            const product = purchase.product;
            const title = fr ? product.titleFr : (product.titleEn || product.titleFr);
            const remainingDownloads = purchase.maxDownloads - purchase.downloadCount;

            return (
              <div
                key={purchase.id}
                className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                {/* Icon/Banner */}
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {product.banner ? (
                    <img src={product.banner} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <ProductTypeIcon type={product.productType} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/formations/produits/${product.slug}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-primary transition-colors">
                    {title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{product.productType}</span>
                    <span>
                      {fr ? "Acheté le" : "Purchased on"}{" "}
                      {new Date(purchase.createdAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                    </span>
                    {purchase.paidAmount > 0 && <span>{purchase.paidAmount.toFixed(2)}\u20AC</span>}
                    {purchase.paidAmount === 0 && (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {fr ? "Gratuit" : "Free"}
                      </span>
                    )}
                  </div>

                  {/* License key */}
                  {purchase.licenseKey && (
                    <div className="flex items-center gap-2 mt-2">
                      <Key className="w-4 h-4 text-amber-500" />
                      <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                        {purchase.licenseKey}
                      </code>
                      <button
                        onClick={() => copyLicenseKey(purchase.licenseKey!)}
                        className="text-xs text-primary hover:underline"
                      >
                        {copiedKey === purchase.licenseKey
                          ? (fr ? "Copié !" : "Copied!")
                          : (fr ? "Copier" : "Copy")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Download button */}
                <div className="flex flex-col items-end gap-1">
                  <a
                    href={remainingDownloads > 0 ? `/api/produits/${product.id}/download` : undefined}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      remainingDownloads > 0
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    {fr ? "Télécharger" : "Download"}
                  </a>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {remainingDownloads} / {purchase.maxDownloads} {fr ? "téléchargement(s)" : "download(s)"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
