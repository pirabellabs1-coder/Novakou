import Link from "next/link";
import { productImageSrc } from "@/lib/utils/image-url";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  ShoppingCart,
  CreditCard,
  LockOpen,
  PlayCircle,
  Package,
  User,
  ListVideo,
  Download,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

function formatFcfa(n: number) {
  return Math.round(n).toLocaleString("fr-FR") + " FCFA";
}
function formatDateFr(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function formatDateTimeFr(d: Date) {
  return (
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) +
    " à " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

interface RealOrder {
  reference: string;
  title: string;
  typeLabel: string;
  instructor: string | null;
  lessons: number | null;
  thumbnail: string | null;
  amountFcfa: number;
  createdAt: Date;
  completedAt: Date | null;
  statusLabel: string;
  contentHref: string | null;
}

/** Récupère la VRAIE commande de l'apprenant (formation, produit, pack ou
 *  abonnement) par id + userId. Retourne null si introuvable / pas la sienne. */
async function getOrder(id: string, userId: string): Promise<RealOrder | null> {
  // 1. Formation (Enrollment)
  const enrollment = await prisma.enrollment
    .findFirst({
      where: { id, userId },
      include: {
        formation: {
          select: {
            title: true,
            thumbnail: true,
            instructeur: { select: { user: { select: { name: true } } } },
            sections: { select: { _count: { select: { lessons: true } } } },
          },
        },
      },
    })
    .catch(() => null);
  if (enrollment) {
    const lessons = enrollment.formation?.sections.reduce((s, sec) => s + sec._count.lessons, 0) ?? 0;
    return {
      reference: `NK-${enrollment.createdAt.getFullYear()}-${id.slice(-8).toUpperCase()}`,
      title: enrollment.formation?.title ?? "Formation",
      typeLabel: "Formation vidéo",
      instructor: enrollment.formation?.instructeur?.user?.name ?? null,
      lessons: lessons || null,
      thumbnail: enrollment.formation?.thumbnail ?? null,
      amountFcfa: enrollment.paidAmount,
      createdAt: enrollment.createdAt,
      completedAt: enrollment.completedAt ?? null,
      statusLabel: enrollment.completedAt ? "Terminé" : "En cours",
      contentHref: `/apprenant/formation/${id}`,
    };
  }

  // 2. Produit digital
  const purchase = await prisma.digitalProductPurchase
    .findFirst({
      where: { id, userId },
      include: {
        product: {
          select: {
            title: true,
            productType: true,
            banner: true,
            thumbnail: true,
            instructeur: { select: { user: { select: { name: true } } } },
          },
        },
      },
    })
    .catch(() => null);
  if (purchase) {
    return {
      reference: `NK-${purchase.createdAt.getFullYear()}-${id.slice(-8).toUpperCase()}`,
      title: purchase.product?.title ?? "Produit",
      typeLabel: purchase.product?.productType ?? "Produit digital",
      instructor: purchase.product?.instructeur?.user?.name ?? null,
      lessons: null,
      thumbnail: purchase.product?.thumbnail ?? purchase.product?.banner ?? null,
      amountFcfa: purchase.paidAmount,
      createdAt: purchase.createdAt,
      completedAt: purchase.createdAt,
      statusLabel: "Terminé",
      contentHref: `/apprenant/mes-produits`,
    };
  }

  // 3. Pack (ProductBundlePurchase)
  const bundle = await prisma.productBundlePurchase
    .findFirst({
      where: { id, userId },
      include: { bundle: { select: { title: true, thumbnail: true, banner: true } } },
    })
    .catch(() => null);
  if (bundle) {
    return {
      reference: `NK-${bundle.createdAt.getFullYear()}-${id.slice(-8).toUpperCase()}`,
      title: bundle.bundle?.title ?? "Pack",
      typeLabel: "Pack",
      instructor: null,
      lessons: null,
      thumbnail: bundle.bundle?.thumbnail ?? bundle.bundle?.banner ?? null,
      amountFcfa: bundle.paidAmount,
      createdAt: bundle.createdAt,
      completedAt: bundle.createdAt,
      statusLabel: "Terminé",
      contentHref: `/apprenant/bundles`,
    };
  }

  // 4. Abonnement (Subscription)
  const sub = await prisma.subscription
    .findFirst({
      where: { id, userId },
      include: { plan: { select: { name: true, imageUrl: true, bannerUrl: true, interval: true } } },
    })
    .catch(() => null);
  if (sub) {
    return {
      reference: `NK-${sub.createdAt.getFullYear()}-${id.slice(-8).toUpperCase()}`,
      title: sub.plan?.name ?? "Abonnement",
      typeLabel: sub.plan?.interval === "yearly" ? "Abonnement annuel" : "Abonnement mensuel",
      instructor: null,
      lessons: null,
      thumbnail: sub.plan?.imageUrl ?? sub.plan?.bannerUrl ?? null,
      amountFcfa: sub.totalPaid,
      createdAt: sub.createdAt,
      completedAt: null,
      statusLabel: sub.status === "active" || sub.status === "trialing" ? "Actif" : "Inactif",
      contentHref: `/apprenant/abonnements`,
    };
  }

  return null;
}

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const order = userId ? await getOrder(id, userId) : null;

  // Commande introuvable / pas la sienne / non connecté
  if (!order) {
    return (
      <div className="p-5 md:p-8 max-w-3xl mx-auto">
        <Link
          href="/apprenant/commandes"
          className="inline-flex items-center gap-1.5 text-sm text-[#5d7166] hover:text-[#006e2f] font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Retour aux commandes
        </Link>
        <div className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-10 text-center">
          <Package size={40} className="mx-auto text-[#8aa092] mb-3" />
          <h1 className="text-lg font-extrabold text-[#13241b]">Commande introuvable</h1>
          <p className="text-sm text-[#5d7166] mt-1">
            Cette commande n'existe pas ou n'est pas associée à votre compte.
          </p>
        </div>
      </div>
    );
  }

  const timeline: { label: string; date: string; icon: LucideIcon }[] = [
    { label: "Commandé", date: formatDateTimeFr(order.createdAt), icon: ShoppingCart },
    { label: "Paiement confirmé", date: formatDateTimeFr(order.createdAt), icon: CreditCard },
    { label: "Accès accordé", date: formatDateTimeFr(order.createdAt), icon: LockOpen },
  ];

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      <Link
        href="/apprenant/commandes"
        className="inline-flex items-center gap-1.5 text-sm text-[#5d7166] hover:text-[#006e2f] font-semibold mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        Retour aux commandes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#13241b]">
            Commande {order.reference}
          </h1>
          <p className="text-sm text-[#5d7166] mt-1 flex items-center gap-1.5">
            <CalendarDays size={14} />
            Passée le {formatDateFr(order.createdAt)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-[#006e2f]/10 text-[#006e2f] text-xs font-bold px-3 py-1.5 rounded-full self-start">
          <CheckCircle2 size={14} />
          {order.statusLabel}
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-5 md:p-6 mb-5">
        <h2 className="text-sm font-bold text-[#13241b] mb-5">Suivi de la commande</h2>
        <div className="relative">
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#006e2f]/20" />
          <div className="space-y-5">
            {timeline.map((step, i) => (
              <div key={i} className="flex items-start gap-4 relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 bg-[#006e2f] border-[#006e2f]">
                  <Check size={16} className="text-white" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0 pt-1.5">
                  <p className="text-sm font-semibold text-[#13241b]">{step.label}</p>
                  <p className="text-xs text-[#5d7166] mt-0.5 flex items-center gap-1">
                    <Clock size={11} />
                    {step.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product card */}
      <div className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-5 md:p-6 mb-5">
        <h2 className="text-sm font-bold text-[#13241b] mb-4">Produit commandé</h2>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e]">
            {order.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={productImageSrc(order.thumbnail, 160) ?? order.thumbnail} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <PlayCircle size={26} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#5d7166] font-medium mb-0.5">{order.typeLabel}</p>
            <h3 className="font-bold text-[#13241b] text-sm leading-snug mb-1">{order.title}</h3>
            <div className="flex items-center gap-3 text-xs text-[#5d7166] flex-wrap">
              {order.instructor && (
                <span className="flex items-center gap-1">
                  <User size={13} />
                  {order.instructor}
                </span>
              )}
              {order.lessons != null && (
                <span className="flex items-center gap-1">
                  <ListVideo size={13} />
                  {order.lessons} leçons
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-extrabold text-[#13241b] text-base">{formatFcfa(order.amountFcfa)}</p>
          </div>
        </div>
      </div>

      {/* Payment details */}
      <div className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-5 md:p-6 mb-6">
        <h2 className="text-sm font-bold text-[#13241b] mb-4">Détails du paiement</h2>
        <div className="space-y-3">
          {[
            { label: "Référence", value: order.reference },
            { label: "Date d'accès", value: formatDateFr(order.createdAt) },
            { label: "Sous-total", value: formatFcfa(order.amountFcfa) },
            { label: "Frais", value: "0 FCFA" },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center py-1.5">
              <span className="text-sm text-[#5d7166]">{row.label}</span>
              <span className="text-sm font-semibold text-[#13241b]">{row.value}</span>
            </div>
          ))}
          <div className="border-t border-[#eef2ef] pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-[#13241b]">Total payé</span>
            <div className="text-right">
              <p className="text-base font-extrabold text-[#006e2f]">{formatFcfa(order.amountFcfa)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {order.contentHref && (
          <Link
            href={order.contentHref}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <PlayCircle size={18} />
            Accéder au contenu
          </Link>
        )}
        <a
          href={`/api/formations/apprenant/commandes/${id}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border border-[#e4eae6] text-sm font-semibold text-[#13241b] hover:bg-gray-50 transition-colors bg-white"
        >
          <Download size={18} className="text-[#5d7166]" />
          Télécharger la facture
        </a>
      </div>
    </div>
  );
}
