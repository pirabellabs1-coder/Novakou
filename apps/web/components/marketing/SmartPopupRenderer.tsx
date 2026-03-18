"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Copy, Check, Timer, ArrowRight } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type PopupType = "DISCOUNT" | "EMAIL_CAPTURE" | "ANNOUNCEMENT" | "UPSELL" | "COUNTDOWN";
type PopupTrigger = "EXIT_INTENT" | "TIME_DELAY" | "SCROLL_PERCENT" | "PAGE_VIEW_COUNT" | "MANUAL";

interface ActivePopup {
  id: string;
  type: PopupType;
  trigger: PopupTrigger;
  triggerValue: number | null;
  headlineFr: string;
  headlineEn: string;
  bodyFr: string;
  bodyEn: string;
  ctaTextFr: string;
  ctaTextEn: string;
  imageBannerUrl: string | null;
  discountCode: string | null;
  emailCaptureTag: string | null;
  countdownEndsAt: string | null;
  upsellProductId: string | null;
  upsellOriginalPrice: number | null;
  upsellDiscountedPrice: number | null;
  ctaUrl: string | null;
  showOnPages: string[];
  excludePages: string[];
  newVisitorsOnly: boolean;
  maxShowsPerUser: number;
}

// ── LocalStorage helpers ───────────────────────────────────────────────────

const STORAGE_PREFIX = "fh_popup_";
const VISITOR_ID_KEY = "fh_visitor_id";
const PAGE_VIEWS_KEY = "fh_page_views";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

function getShowCount(popupId: string): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(`${STORAGE_PREFIX}${popupId}_count`) || "0", 10);
}

function incrementShowCount(popupId: string): void {
  if (typeof window === "undefined") return;
  const current = getShowCount(popupId);
  localStorage.setItem(`${STORAGE_PREFIX}${popupId}_count`, (current + 1).toString());
}

function isDismissed(popupId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${STORAGE_PREFIX}${popupId}_dismissed`) === "true";
}

function dismissPopup(popupId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${popupId}_dismissed`, "true");
}

function isNewVisitor(): boolean {
  if (typeof window === "undefined") return true;
  const views = parseInt(localStorage.getItem(PAGE_VIEWS_KEY) || "0", 10);
  return views <= 1;
}

function getPageViews(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(PAGE_VIEWS_KEY) || "0", 10);
}

function incrementPageViews(): void {
  if (typeof window === "undefined") return;
  const current = getPageViews();
  localStorage.setItem(PAGE_VIEWS_KEY, (current + 1).toString());
}

// ── Impression tracker (fire-and-forget) ───────────────────────────────────

function trackImpression(popupId: string, action: "view" | "click" | "close" | "convert") {
  const visitorId = getVisitorId();
  fetch("/api/marketing/popups/impression", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ popupId, action, visitorId }),
  }).catch(() => {
    // Fire-and-forget: silently ignore errors
  });
}

// ── Countdown Hook ─────────────────────────────────────────────────────────

function useCountdown(endsAt: string | null): { hours: string; minutes: string; seconds: string; expired: boolean } {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!endsAt) return { hours: "00", minutes: "00", seconds: "00", expired: true };

  const end = new Date(endsAt).getTime();
  const diff = Math.max(0, end - now);
  const expired = diff <= 0;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
    expired,
  };
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SmartPopupRenderer() {
  const pathname = usePathname();
  const [popups, setPopups] = useState<ActivePopup[]>([]);
  const [visiblePopup, setVisiblePopup] = useState<ActivePopup | null>(null);
  const [animating, setAnimating] = useState(false);
  const triggeredRef = useRef<Set<string>>(new Set());
  const hasLoaded = useRef(false);

  // ── Load popups ──

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    incrementPageViews();

    fetch("/api/marketing/popups?scope=public")
      .then((r) => r.json())
      .then((data) => {
        if (data.popups) setPopups(data.popups);
      })
      .catch(() => {
        // Silently fail
      });
  }, []);

  // ── Filter popups applicable to current page ──

  const getApplicablePopups = useCallback((): ActivePopup[] => {
    return popups.filter((popup) => {
      // Check if dismissed
      if (isDismissed(popup.id)) return false;

      // Check max shows
      if (getShowCount(popup.id) >= popup.maxShowsPerUser) return false;

      // Check new visitors only
      if (popup.newVisitorsOnly && !isNewVisitor()) return false;

      // Check page targeting
      if (popup.showOnPages.length > 0) {
        const matches = popup.showOnPages.some((page) => pathname.startsWith(page));
        if (!matches) return false;
      }

      if (popup.excludePages.length > 0) {
        const excluded = popup.excludePages.some((page) => pathname.startsWith(page));
        if (excluded) return false;
      }

      // Already triggered in this session
      if (triggeredRef.current.has(popup.id)) return false;

      return true;
    });
  }, [popups, pathname]);

  // ── Show popup with animation ──

  const showPopup = useCallback((popup: ActivePopup) => {
    if (visiblePopup) return; // Only one at a time
    triggeredRef.current.add(popup.id);
    incrementShowCount(popup.id);
    setVisiblePopup(popup);
    setAnimating(true);
    trackImpression(popup.id, "view");

    // Small delay for enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimating(false);
      });
    });
  }, [visiblePopup]);

  // ── EXIT_INTENT trigger ──

  useEffect(() => {
    const applicable = getApplicablePopups().filter((p) => p.trigger === "EXIT_INTENT");
    if (applicable.length === 0) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && applicable.length > 0) {
        showPopup(applicable[0]);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [getApplicablePopups, showPopup]);

  // ── TIME_DELAY trigger ──

  useEffect(() => {
    const applicable = getApplicablePopups().filter((p) => p.trigger === "TIME_DELAY");
    if (applicable.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const popup of applicable) {
      const delay = (popup.triggerValue || 10) * 1000;
      const timer = setTimeout(() => {
        showPopup(popup);
      }, delay);
      timers.push(timer);
    }

    return () => timers.forEach(clearTimeout);
  }, [getApplicablePopups, showPopup]);

  // ── SCROLL_PERCENT trigger ──

  useEffect(() => {
    const applicable = getApplicablePopups().filter((p) => p.trigger === "SCROLL_PERCENT");
    if (applicable.length === 0) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = (scrollTop / docHeight) * 100;

      for (const popup of applicable) {
        const threshold = popup.triggerValue || 50;
        if (scrollPercent >= threshold && !triggeredRef.current.has(popup.id)) {
          showPopup(popup);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [getApplicablePopups, showPopup]);

  // ── PAGE_VIEW_COUNT trigger ──

  useEffect(() => {
    const applicable = getApplicablePopups().filter((p) => p.trigger === "PAGE_VIEW_COUNT");
    if (applicable.length === 0) return;

    const currentViews = getPageViews();

    for (const popup of applicable) {
      const threshold = popup.triggerValue || 3;
      if (currentViews >= threshold) {
        // Slight delay so it doesn't feel jarring
        const timer = setTimeout(() => showPopup(popup), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [getApplicablePopups, showPopup]);

  // ── Close handler ──

  const handleClose = useCallback(() => {
    if (visiblePopup) {
      trackImpression(visiblePopup.id, "close");
    }
    setAnimating(true);
    setTimeout(() => {
      setVisiblePopup(null);
      setAnimating(false);
    }, 200);
  }, [visiblePopup]);

  const handleDismissForever = useCallback(() => {
    if (visiblePopup) {
      dismissPopup(visiblePopup.id);
      trackImpression(visiblePopup.id, "close");
    }
    setAnimating(true);
    setTimeout(() => {
      setVisiblePopup(null);
      setAnimating(false);
    }, 200);
  }, [visiblePopup]);

  const handleCtaClick = useCallback(() => {
    if (visiblePopup) {
      trackImpression(visiblePopup.id, "click");
    }
  }, [visiblePopup]);

  // ── Render nothing if no visible popup ──

  if (!visiblePopup) return null;

  return (
    <PopupOverlay
      popup={visiblePopup}
      animating={animating}
      onClose={handleClose}
      onDismiss={handleDismissForever}
      onCtaClick={handleCtaClick}
    />
  );
}

// ── Popup Overlay ──────────────────────────────────────────────────────────

function PopupOverlay({
  popup,
  animating,
  onClose,
  onDismiss,
  onCtaClick,
}: {
  popup: ActivePopup;
  animating: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onCtaClick: () => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center transition-opacity duration-200 ${
        animating ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Popup container */}
      <div
        className={`relative w-full sm:w-auto sm:max-w-md mx-auto transition-transform duration-300 ease-out ${
          animating
            ? "translate-y-full sm:translate-y-0 sm:scale-95"
            : "translate-y-0 sm:scale-100"
        }`}
      >
        <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-600 transition-all shadow-sm"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Banner image */}
          {popup.imageBannerUrl && (
            <div className="w-full h-36 bg-slate-100 dark:bg-slate-700">
              <img
                src={popup.imageBannerUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 sm:p-7">
            {/* Type badge */}
            <PopupTypeBadge type={popup.type} />

            {/* Headline */}
            <h3 className="text-xl sm:text-2xl font-bold mt-3 pr-6 leading-tight">
              {popup.headlineFr}
            </h3>

            {/* Body */}
            {popup.bodyFr && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {popup.bodyFr}
              </p>
            )}

            {/* Type-specific content */}
            <div className="mt-5">
              {popup.type === "DISCOUNT" && <DiscountContent popup={popup} onCtaClick={onCtaClick} />}
              {popup.type === "EMAIL_CAPTURE" && <EmailCaptureContent popup={popup} onCtaClick={onCtaClick} />}
              {popup.type === "ANNOUNCEMENT" && <AnnouncementContent popup={popup} onCtaClick={onCtaClick} />}
              {popup.type === "UPSELL" && <UpsellContent popup={popup} onCtaClick={onCtaClick} />}
              {popup.type === "COUNTDOWN" && <CountdownContent popup={popup} onCtaClick={onCtaClick} />}
            </div>

            {/* Don't show again */}
            <button
              onClick={onDismiss}
              className="block w-full text-center text-[11px] text-slate-400 mt-4 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Ne plus afficher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Type Badge ─────────────────────────────────────────────────────────────

function PopupTypeBadge({ type }: { type: PopupType }) {
  const configs: Record<PopupType, { label: string; color: string }> = {
    DISCOUNT: { label: "Offre speciale", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    EMAIL_CAPTURE: { label: "Newsletter", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    ANNOUNCEMENT: { label: "Annonce", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    UPSELL: { label: "Offre exclusive", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    COUNTDOWN: { label: "Offre limitee", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  };

  const cfg = configs[type];
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── DISCOUNT content ───────────────────────────────────────────────────────

function DiscountContent({ popup, onCtaClick }: { popup: ActivePopup; onCtaClick: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (popup.discountCode) {
      navigator.clipboard.writeText(popup.discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {popup.discountCode && (
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-dashed border-slate-300 dark:border-slate-600">
          <span className="flex-1 text-center text-lg font-mono font-bold tracking-[0.15em] text-slate-800 dark:text-white">
            {popup.discountCode}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 p-2 rounded-lg bg-white dark:bg-slate-600 shadow-sm hover:shadow transition-all border border-slate-200 dark:border-slate-500"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      )}

      {popup.ctaUrl ? (
        <a
          href={popup.ctaUrl}
          onClick={onCtaClick}
          className="block w-full py-3 bg-primary text-white rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors shadow-sm"
        >
          {popup.ctaTextFr}
        </a>
      ) : (
        <button
          onClick={() => {
            handleCopy();
            onCtaClick();
          }}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          {popup.ctaTextFr}
        </button>
      )}
    </div>
  );
}

// ── EMAIL_CAPTURE content ──────────────────────────────────────────────────

function EmailCaptureContent({ popup, onCtaClick }: { popup: ActivePopup; onCtaClick: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Track the conversion
      trackImpression(popup.id, "convert");
      onCtaClick();

      // Submit email capture
      await fetch("/api/marketing/popups/impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          popupId: popup.id,
          action: "convert",
          visitorId: getVisitorId(),
        }),
      });

      setSubmitted(true);
    } catch {
      setError("Erreur lors de l'inscription. Reessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-3">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-sm font-bold text-green-700 dark:text-green-400">
          Merci pour votre inscription !
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Verifiez votre boite mail pour confirmer.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="votre@email.com"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          disabled={submitting}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
      >
        {submitting ? "Envoi..." : popup.ctaTextFr}
      </button>
    </form>
  );
}

// ── ANNOUNCEMENT content ───────────────────────────────────────────────────

function AnnouncementContent({ popup, onCtaClick }: { popup: ActivePopup; onCtaClick: () => void }) {
  return (
    <div>
      {popup.ctaUrl ? (
        <a
          href={popup.ctaUrl}
          onClick={onCtaClick}
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          {popup.ctaTextFr}
          <ArrowRight className="w-4 h-4" />
        </a>
      ) : (
        <button
          onClick={onCtaClick}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          {popup.ctaTextFr}
        </button>
      )}
    </div>
  );
}

// ── UPSELL content ─────────────────────────────────────────────────────────

function UpsellContent({ popup, onCtaClick }: { popup: ActivePopup; onCtaClick: () => void }) {
  const savings = (popup.upsellOriginalPrice || 0) - (popup.upsellDiscountedPrice || 0);
  const savingsPct = popup.upsellOriginalPrice
    ? Math.round((savings / popup.upsellOriginalPrice) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Price display */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center justify-between">
        <div>
          {popup.upsellOriginalPrice != null && (
            <span className="text-slate-400 line-through text-base mr-2">
              {popup.upsellOriginalPrice.toFixed(2)} EUR
            </span>
          )}
          <span className="text-2xl font-bold text-green-600">
            {popup.upsellDiscountedPrice != null ? `${popup.upsellDiscountedPrice.toFixed(2)} EUR` : "---"}
          </span>
        </div>
        {savingsPct > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            -{savingsPct}%
          </span>
        )}
      </div>

      {popup.ctaUrl ? (
        <a
          href={popup.ctaUrl}
          onClick={onCtaClick}
          className="block w-full py-3 bg-primary text-white rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors shadow-sm"
        >
          {popup.ctaTextFr}
        </a>
      ) : (
        <button
          onClick={onCtaClick}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          {popup.ctaTextFr}
        </button>
      )}
    </div>
  );
}

// ── COUNTDOWN content ──────────────────────────────────────────────────────

function CountdownContent({ popup, onCtaClick }: { popup: ActivePopup; onCtaClick: () => void }) {
  const { hours, minutes, seconds, expired } = useCountdown(popup.countdownEndsAt);

  if (expired) {
    return (
      <div className="text-center py-4">
        <p className="text-sm font-bold text-slate-500">Cette offre a expire.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Countdown timer */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <CountdownUnit value={hours} label="heures" />
        <span className="text-2xl font-bold text-slate-400 -mt-4">:</span>
        <CountdownUnit value={minutes} label="minutes" />
        <span className="text-2xl font-bold text-slate-400 -mt-4">:</span>
        <CountdownUnit value={seconds} label="secondes" />
      </div>

      {/* Price if available */}
      {popup.upsellOriginalPrice != null && popup.upsellDiscountedPrice != null && (
        <div className="text-center">
          <span className="text-slate-400 line-through text-sm mr-2">
            {popup.upsellOriginalPrice.toFixed(2)} EUR
          </span>
          <span className="text-xl font-bold text-green-600">
            {popup.upsellDiscountedPrice.toFixed(2)} EUR
          </span>
        </div>
      )}

      {/* Discount code if applicable */}
      {popup.discountCode && (
        <DiscountCodeBadge code={popup.discountCode} />
      )}

      {popup.ctaUrl ? (
        <a
          href={popup.ctaUrl}
          onClick={onCtaClick}
          className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
        >
          <Timer className="w-4 h-4" />
          {popup.ctaTextFr}
        </a>
      ) : (
        <button
          onClick={onCtaClick}
          className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
        >
          <Timer className="w-4 h-4" />
          {popup.ctaTextFr}
        </button>
      )}
    </div>
  );
}

// ── Countdown Unit ─────────────────────────────────────────────────────────

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-slate-900 dark:bg-slate-700 text-white text-2xl font-mono font-bold w-14 h-14 rounded-xl flex items-center justify-center shadow-md">
        {value}
      </div>
      <span className="text-[10px] text-slate-400 mt-1.5 font-medium">{label}</span>
    </div>
  );
}

// ── Discount Code Badge ────────────────────────────────────────────────────

function DiscountCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 mx-auto bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <span className="text-xs font-mono font-bold tracking-wider">{code}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );
}
