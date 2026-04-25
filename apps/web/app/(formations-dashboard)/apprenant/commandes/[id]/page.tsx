import Link from "next/link";

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

const timeline = [
  { label: "Commandé", date: "12 avr. 2026 à 10:23", done: true, icon: "shopping_cart" },
  { label: "Paiement confirmé", date: "12 avr. 2026 à 10:24", done: true, icon: "payments" },
  { label: "Accès accordé", date: "12 avr. 2026 à 10:24", done: true, icon: "lock_open" },
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
        className="inline-flex items-center gap-1.5 text-sm text-[#5c647a] hover:text-[#006e2f] font-medium mb-6 transition-colors group"
      >
        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
          arrow_back
        </span>
        Retour aux commandes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#191c1e]">
            Commande #{orderId}
          </h1>
          <p className="text-sm text-[#5c647a] mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            Passée le {orderData.purchaseDate}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-[#006e2f]/10 text-[#006e2f] text-xs font-bold px-3 py-1.5 rounded-full self-start">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          Terminé
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-5">
        <h2 className="text-sm font-bold text-[#191c1e] mb-5">Suivi de la commande</h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#006e2f]/20" />

          <div className="space-y-5">
            {timeline.map((step, i) => (
              <div key={i} className="flex items-start gap-4 relative">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${
                    step.done
                      ? "bg-[#006e2f] border-[#006e2f]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${step.done ? "text-white" : "text-[#5c647a]"}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {step.done ? "check" : step.icon}
                  </span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pt-1.5">
                  <p className={`text-sm font-semibold ${step.done ? "text-[#191c1e]" : "text-[#5c647a]"}`}>
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-xs text-[#5c647a] mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px]">schedule</span>
                      {step.date}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-5">
        <h2 className="text-sm font-bold text-[#191c1e] mb-4">Produit commandé</h2>
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${orderData.product.gradientFrom} 0%, ${orderData.product.gradientTo} 100%)`,
            }}
          >
            <span
              className="material-symbols-outlined text-white text-[26px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_circle
            </span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#5c647a] font-medium mb-0.5">{orderData.product.type}</p>
            <h3 className="font-bold text-[#191c1e] text-sm leading-snug mb-1">
              {orderData.product.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-[#5c647a]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">person</span>
                {orderData.product.instructor}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">play_lesson</span>
                {orderData.product.totalLessons} leçons
              </span>
            </div>
          </div>
          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="font-extrabold text-[#191c1e] text-base">{formatFcfa(orderData.priceFcfa)}</p>
            <p className="text-xs text-[#5c647a]">≈ {toEur(orderData.priceFcfa)} €</p>
          </div>
        </div>
      </div>

      {/* Payment details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-6">
        <h2 className="text-sm font-bold text-[#191c1e] mb-4">Détails du paiement</h2>
        <div className="space-y-3">
          {[
            { label: "Méthode", value: orderData.paymentMethod },
            { label: "Référence transaction", value: orderData.transactionRef },
            { label: "Date d'accès", value: orderData.accessDate },
            { label: "Sous-total", value: formatFcfa(orderData.priceFcfa) },
            { label: "Frais", value: "0 FCFA" },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center py-1.5">
              <span className="text-sm text-[#5c647a]">{row.label}</span>
              <span className="text-sm font-semibold text-[#191c1e]">{row.value}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-[#191c1e]">Total payé</span>
            <div className="text-right">
              <p className="text-base font-extrabold text-[#006e2f]">{formatFcfa(orderData.priceFcfa)}</p>
              <p className="text-[11px] text-[#5c647a]">≈ {toEur(orderData.priceFcfa)} €</p>
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
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            play_circle
          </span>
          Accéder au contenu
        </Link>
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors bg-white">
          <span className="material-symbols-outlined text-[18px] text-[#5c647a]">download</span>
          Télécharger la facture
        </button>
      </div>
    </div>
  );
}
