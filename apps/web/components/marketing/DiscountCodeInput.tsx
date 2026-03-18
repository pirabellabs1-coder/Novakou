"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Tag, Loader2, Check, AlertCircle, X, Zap, Percent, DollarSign,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  discountAmount: number;
  finalPrice: number;
  discountId?: string;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  code?: string;
  error?: string;
}

interface DiscountCodeInputProps {
  /** Current order amount before discount */
  orderAmount: number;
  /** Type of order: "formation" or "product" */
  orderType?: string;
  /** ID of the specific item being purchased */
  itemId?: string;
  /** User ID (for per-user limits) */
  userId?: string;
  /** Callback when a valid discount is applied */
  onDiscountApplied?: (result: ValidationResult) => void;
  /** Callback when discount is removed */
  onDiscountRemoved?: () => void;
  /** Flash offer to auto-apply (skips manual input) */
  flashOffer?: {
    discountPct: number;
    endsAt: string;
  } | null;
  /** Custom CSS class for the container */
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DiscountCodeInput({
  orderAmount,
  orderType,
  itemId,
  userId,
  onDiscountApplied,
  onDiscountRemoved,
  flashOffer,
  className = "",
}: DiscountCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [applied, setApplied] = useState(false);

  // Auto-apply flash offer
  useEffect(() => {
    if (flashOffer && !applied) {
      const discountAmount = Math.round((orderAmount * flashOffer.discountPct) / 100 * 100) / 100;
      const finalPrice = Math.max(0, Math.round((orderAmount - discountAmount) * 100) / 100);

      const flashResult: ValidationResult = {
        valid: true,
        discountAmount,
        finalPrice,
        discountType: "PERCENTAGE",
        discountValue: flashOffer.discountPct,
        code: "FLASH",
      };

      setResult(flashResult);
      setApplied(true);
      onDiscountApplied?.(flashResult);
    }
  }, [flashOffer, orderAmount, applied, onDiscountApplied]);

  // ── Validate code ──

  const handleValidate = useCallback(async () => {
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/marketing/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          userId: userId || undefined,
          orderAmount,
          orderType: orderType || undefined,
          itemId: itemId || undefined,
        }),
      });

      const data: ValidationResult = await res.json();
      setResult(data);

      if (data.valid) {
        setApplied(true);
        onDiscountApplied?.(data);
      }
    } catch {
      setResult({
        valid: false,
        discountAmount: 0,
        finalPrice: orderAmount,
        error: "Erreur de connexion. Veuillez reessayer.",
      });
    } finally {
      setLoading(false);
    }
  }, [code, orderAmount, orderType, itemId, userId, onDiscountApplied]);

  // ── Remove discount ──

  const handleRemove = useCallback(() => {
    setCode("");
    setResult(null);
    setApplied(false);
    onDiscountRemoved?.();
  }, [onDiscountRemoved]);

  // ── Handle enter key ──

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleValidate();
    }
  };

  // ── Flash offer auto-applied state ──

  if (flashOffer && applied && result?.valid) {
    return (
      <div className={`${className}`}>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Offre flash appliquee
              </span>
            </div>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              -{flashOffer.discountPct}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Reduction :</span>
            <span className="font-bold text-green-600">
              -{result.discountAmount.toFixed(2)} EUR
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-500">Nouveau prix :</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {result.finalPrice.toFixed(2)} EUR
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Applied discount state ──

  if (applied && result?.valid) {
    return (
      <div className={`${className}`}>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-green-700 dark:text-green-400">
                Code applique
              </span>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-green-500"
              title="Retirer le code"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <code className="font-mono text-sm font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-lg">
              {result.code}
            </code>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
              {result.discountType === "PERCENTAGE" ? (
                <><Percent className="w-3 h-3" /> {result.discountValue}%</>
              ) : (
                <><DollarSign className="w-3 h-3" /> {result.discountValue} EUR</>
              )}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Prix original :</span>
              <span className="text-slate-400 line-through">{orderAmount.toFixed(2)} EUR</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Reduction :</span>
              <span className="font-bold text-green-600">-{result.discountAmount.toFixed(2)} EUR</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1 border-t border-green-200 dark:border-green-800/50">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Nouveau prix :</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {result.finalPrice.toFixed(2)} EUR
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Default input state ──

  return (
    <div className={`${className}`}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          Code de reduction
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                // Clear previous error when typing
                if (result && !result.valid) setResult(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Entrez un code promo"
              maxLength={20}
              disabled={loading}
              className={`w-full font-mono text-sm font-bold uppercase border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 ${
                result && !result.valid
                  ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                  : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700"
              }`}
            />
          </div>
          <button
            type="button"
            onClick={handleValidate}
            disabled={loading || !code.trim()}
            className="flex items-center gap-2 bg-primary text-white font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Appliquer"
            )}
          </button>
        </div>

        {/* Error feedback */}
        {result && !result.valid && result.error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-600 dark:text-red-400">{result.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
