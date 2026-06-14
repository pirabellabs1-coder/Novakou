import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Check,
  Clock,
  ShoppingCart,
  CreditCard,
  LockOpen,
  PlayCircle,
  User,
  ListVideo,
  Download,
  type LucideIcon,
} from "lucide-react";

const orderData = {
  id: "FH-2026-001",
  product: {
    title: "Maîtrisez les algorithmes pour doubler vos ventes",
    type: "Formation vidéo",
    instructor: "Thomas Eko",
    totalLessons: 48,
    gradientFrom: "#006e2f",
    gradientTo: "#22c55e",
  },
  status: "termine" as const,
  purchaseDate: "12 avril 2026",
  accessDate: "12 avril 2026",
  priceFcfa: 45000,
  paymentMethod: "Orange Money",
  transactionRef: "OM-20260412-7823X",
};

const timeline: { label: string; date: string; done: boolean; icon: LucideIcon }[] = [
  { label: "Commandé", date: "12 avr. 2026 à 10:23", done: true, icon: ShoppingCart },
  { label: "Paiement confirmé", date: "12 avr. 2026 à 10:24", done: true, icon: CreditCard },
  { label: "Accès accordé", date: "12 avr. 2026 à 10:24", done: true, icon: LockOpen },
];

function formatFcfa(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function toEur(fcfa: number) {
  return Math.round(fcfa / 655.957);
}

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = id || orderData.id;

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      {/* Back link */}
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
            Commande #{orderId}
          </h1>
          <p className="text-sm text-[#5d7166] mt-1 flex items-center gap-1.5">
            <CalendarDays size={14} />
            Passée le {orderData.purchaseDate}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-[#006e2f]/10 text-[#006e2f] text-xs font-bold px-3 py-1.5 rounded-full self-start">
          <CheckCircle2 size={14} />
          Terminé
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-5 md:p-6 mb-5">
        <h2 className="text-sm font-bold text-[#13241b] mb-5">Suivi de la commande</h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#006e2f]/20" />

          <div className="space-y-5">
            {timeline.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div key={i} className="flex items-start gap-4 relative">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${
                      step.done
                        ? "bg-[#006e2f] border-[#006e2f]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {step.done ? (
                      <Check size={16} className="text-white" strokeWidth={3} />
                    ) : (
                      <StepIcon size={16} className="text-[#5d7166]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <p className={`text-sm font-semibold ${step.done ? "text-[#13241b]" : "text-[#5d7166]"}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-xs text-[#5d7166] mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        {step.date}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product card */}
      <div className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-5 md:p-6 mb-5">
        <h2 className="text-sm font-bold text-[#13241b] mb-4">Produit commandé</h2>
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${orderData.product.gradientFrom} 0%, ${orderData.product.gradientTo} 100%)`,
            }}
          >
            <PlayCircle size={26} className="text-white" />
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#5d7166] font-medium mb-0.5">{orderData.product.type}</p>
            <h3 className="font-bold text-[#13241b] text-sm leading-snug mb-1">
              {orderData.product.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-[#5d7166]">
              <span className="flex items-center gap-1">
                <User size={13} />
                {orderData.product.instructor}
              </span>
              <span className="flex items-center gap-1">
                <ListVideo size={13} />
                {orderData.product.totalLessons} leçons
              </span>
            </div>
          </div>
          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="font-extrabold text-[#13241b] text-base">{formatFcfa(orderData.priceFcfa)}</p>
            <p className="text-xs text-[#5d7166]">≈ {toEur(orderData.priceFcfa)} €</p>
          </div>
        </div>
      </div>

      {/* Payment details */}
      <div className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-5 md:p-6 mb-6">
        <h2 className="text-sm font-bold text-[#13241b] mb-4">Détails du paiement</h2>
        <div className="space-y-3">
          {[
            { label: "Méthode", value: orderData.paymentMethod },
            { label: "Référence transaction", value: orderData.transactionRef },
            { label: "Date d'accès", value: orderData.accessDate },
            { label: "Sous-total", value: formatFcfa(orderData.priceFcfa) },
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
              <p className="text-base font-extrabold text-[#006e2f]">{formatFcfa(orderData.priceFcfa)}</p>
              <p className="text-[11px] text-[#5d7166]">≈ {toEur(orderData.priceFcfa)} €</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/apprenant/formation/${orderId}`}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <PlayCircle size={18} />
          Accéder au contenu
        </Link>
        <a
          href={`/api/formations/apprenant/commandes/${orderId}/invoice`}
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
