"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Loader2, ArrowRight, Check, X, ShieldCheck, Star,
  Clock, Users, Award, ChevronRight, Sparkles,
  CheckCircle, Gift, Heart, XCircle,
} from "lucide-react";

// -- Types ------------------------------------------------------------------

interface FunnelStep {
  id: string;
  type: string;
  title: string;
  headlineFr: string;
  headlineEn: string;
  descriptionFr: string;
  descriptionEn: string;
  ctaTextFr: string;
  ctaTextEn: string;
  linkedProductId: string | null;
  linkedProductTitle: string | null;
  linkedProductPrice: number | null;
  discountPct: number | null;
  order: number;
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  description: string;
  steps: FunnelStep[];
  isActive: boolean;
}

// -- Component ---------------------------------------------------------------

export default function PublicFunnelPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const locale = useLocale();

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [acceptedItems, setAcceptedItems] = useState<string[]>([]);
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const visitorId = useRef<string>("");

  // Locale helper: use EN text with FR fallback
  const l = (fr: string, en: string) => locale === "en" ? en : fr;

  // Generate persistent visitor ID
  useEffect(() => {
    let vid = localStorage.getItem("fh_visitor_id");
    if (!vid) {
      vid = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("fh_visitor_id", vid);
    }
    visitorId.current = vid;
  }, []);

  // Read step from URL
  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam !== null) {
      const idx = parseInt(stepParam);
      if (!isNaN(idx) && idx >= 0) {
        setCurrentStepIndex(idx);
      }
    }
  }, [searchParams]);

  // -- Fetch funnel --

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetch(`/api/marketing/funnels?slug=${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Funnel non trouvé");
        return r.json();
      })
      .then((data) => {
        if (data.funnel) {
          // Sort steps by order
          const f = data.funnel;
          f.steps = (f.steps || []).sort(
            (a: FunnelStep, b: FunnelStep) => a.order - b.order,
          );
          setFunnel(f);
        } else {
          setError("Funnel non trouvé");
        }
      })
      .catch(() => setError("Impossible de charger cette page"))
      .finally(() => setLoading(false));
  }, [slug]);

  // -- SEO: dynamic document title --
  useEffect(() => {
    if (funnel && funnel.steps?.[0]) {
      const firstStep = funnel.steps[0];
      document.title = firstStep.headlineFr || "Tunnel de vente - FreelanceHigh";
    }
  }, [funnel]);

  // -- Track event --

  const trackEvent = useCallback(
    async (
      eventType: "view" | "click" | "purchase" | "skip",
      stepIndex: number,
      stepType: string,
      revenue?: number,
    ) => {
      if (!funnel) return;

      try {
        await fetch(`/api/marketing/funnels/${funnel.id}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepIndex,
            stepType,
            eventType,
            visitorId: visitorId.current,
            revenue: revenue || 0,
            metadata: { slug, timestamp: new Date().toISOString() },
          }),
        });
      } catch {
        // Non-blocking - analytics should not break the user experience
      }
    },
    [funnel, slug],
  );

  // Track view on step change
  useEffect(() => {
    if (!funnel || !funnel.steps[currentStepIndex]) return;
    const step = funnel.steps[currentStepIndex];
    trackEvent("view", currentStepIndex, step.type);
  }, [funnel, currentStepIndex, trackEvent]);

  // -- Navigation --

  const goToStep = (index: number) => {
    if (!funnel || index < 0 || index >= funnel.steps.length) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentStepIndex(index);
      // Update URL without full navigation
      const newUrl = `${window.location.pathname}?step=${index}`;
      window.history.replaceState({}, "", newUrl);
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);
  };

  const handleCTA = () => {
    if (!funnel) return;
    const step = funnel.steps[currentStepIndex];
    trackEvent("click", currentStepIndex, step.type);

    // Add product to accepted items on PRODUCT/UPSELL/DOWNSELL
    // Note: "purchase" is tracked only after actual payment via Stripe checkout
    if (
      step.linkedProductId &&
      ["PRODUCT", "UPSELL", "DOWNSELL"].includes(step.type)
    ) {
      setAcceptedItems((prev) => [...prev, step.linkedProductId!]);
    }

    goToStep(currentStepIndex + 1);
  };

  // -- Stripe Checkout --
  const handleCheckout = async () => {
    if (!funnel) return;
    setCheckingOut(true);
    try {
      const res = await fetch("/api/marketing/funnels/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelId: funnel.id,
          funnelSlug: slug,
          acceptedItems: acceptedItems.map((itemId) => {
            const step = funnel.steps.find(
              (s: FunnelStep) => s.linkedProductId === itemId,
            );
            return {
              productId: itemId,
              title:
                step?.linkedProductTitle || step?.title || "Produit",
              price: step?.linkedProductPrice || 0,
              discountPct: step?.discountPct || null,
            };
          }),
          visitorId: visitorId.current,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert(
        l(
          "Erreur lors du paiement. Veuillez r\u00e9essayer.",
          "Payment error. Please try again.",
        ),
      );
    } finally {
      setCheckingOut(false);
    }
  };

  const handleSkip = () => {
    if (!funnel) return;
    const step = funnel.steps[currentStepIndex];
    trackEvent("skip", currentStepIndex, step.type);
    setSkippedSteps((prev) => [...prev, currentStepIndex]);

    // For UPSELL, skip to DOWNSELL if it's the next step, otherwise skip ahead
    const nextStep = funnel.steps[currentStepIndex + 1];
    if (step.type === "UPSELL" && nextStep?.type === "DOWNSELL") {
      goToStep(currentStepIndex + 1);
    } else if (step.type === "DOWNSELL") {
      // Skip to CONFIRMATION or THANK_YOU
      const confirmIdx = funnel.steps.findIndex(
        (s, i) => i > currentStepIndex && (s.type === "CONFIRMATION" || s.type === "THANK_YOU"),
      );
      goToStep(confirmIdx >= 0 ? confirmIdx : currentStepIndex + 1);
    } else {
      goToStep(currentStepIndex + 1);
    }
  };

  // -- Loading / Error states --

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
            Page non trouvée
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {error || "Ce funnel n'existe pas ou n'est plus disponible."}
          </p>
          <Link
            href="/formations/explorer"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Explorer les formations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // -- Handle Stripe return URL params --

  const isPaymentSuccess = searchParams.get("success") === "true";
  const isPaymentCanceled = searchParams.get("canceled") === "true";
  const sessionId = searchParams.get("session_id");

  if (isPaymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-slate-950 flex items-center">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            {l("Paiement confirm\u00e9 !", "Payment confirmed!")}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
            {l(
              "Merci pour votre achat ! Vous recevrez un email de confirmation avec les d\u00e9tails de votre commande.",
              "Thank you for your purchase! You will receive a confirmation email with the details of your order.",
            )}
          </p>
          {sessionId && (
            <p className="text-xs text-slate-400 mb-6">
              {l("R\u00e9f\u00e9rence :", "Reference:")} {sessionId.slice(0, 20)}...
            </p>
          )}
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8 max-w-md mx-auto text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {l("Prochaines \u00e9tapes", "Next steps")}
            </h3>
            <div className="space-y-3">
              {(locale === "en"
                ? [
                    "Check your email for access details",
                    "Log in to your learner dashboard",
                    "Start your first lesson",
                  ]
                : [
                    "V\u00e9rifiez votre email pour l\u2019acc\u00e8s",
                    "Connectez-vous \u00e0 votre espace apprenant",
                    "Commencez votre premi\u00e8re le\u00e7on",
                  ]
              ).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-green-600">{i + 1}</span>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/formations/explorer"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              {l("Acc\u00e9der \u00e0 ma formation", "Access my course")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              {l("Retour \u00e0 l\u2019accueil", "Back to home")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isPaymentCanceled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center">
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {l("Paiement annul\u00e9", "Payment canceled")}
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            {l(
              "Votre paiement a \u00e9t\u00e9 annul\u00e9. Vous pouvez r\u00e9essayer \u00e0 tout moment.",
              "Your payment was canceled. You can try again at any time.",
            )}
          </p>
          <Link
            href={`/formations/f/${slug}`}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            {l("Revenir au tunnel", "Back to funnel")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = funnel.steps[currentStepIndex];
  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">{l("\u00c9tape introuvable", "Step not found")}</p>
      </div>
    );
  }

  // -- Render step by type --

  return (
    <div
      className={`min-h-screen transition-opacity duration-200 ${
        transitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Step progress indicator */}
      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
          style={{
            width: `${((currentStepIndex + 1) / funnel.steps.length) * 100}%`,
          }}
        />
      </div>

      {currentStep.type === "LANDING" && (
        <LandingStep step={currentStep} onCTA={handleCTA} locale={locale} />
      )}

      {currentStep.type === "PRODUCT" && (
        <ProductStep step={currentStep} onCTA={handleCTA} onSkip={handleSkip} locale={locale} />
      )}

      {currentStep.type === "CHECKOUT" && (
        <CheckoutStep step={currentStep} onCTA={handleCTA} locale={locale} />
      )}

      {currentStep.type === "UPSELL" && (
        <UpsellStep step={currentStep} onAccept={handleCTA} onDecline={handleSkip} locale={locale} />
      )}

      {currentStep.type === "DOWNSELL" && (
        <DownsellStep step={currentStep} onAccept={handleCTA} onDecline={handleSkip} locale={locale} />
      )}

      {currentStep.type === "CONFIRMATION" && (
        <ConfirmationStep
          step={currentStep}
          acceptedItems={acceptedItems}
          allSteps={funnel.steps}
          onCheckout={handleCheckout}
          checkingOut={checkingOut}
          locale={locale}
        />
      )}

      {currentStep.type === "THANK_YOU" && (
        <ThankYouStep step={currentStep} locale={locale} />
      )}

      {/* FreelanceHigh branding footer */}
      <div className="fixed bottom-4 right-4 z-30">
        <Link
          href="/formations/explorer"
          className="text-xs text-slate-400 hover:text-primary transition-colors bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50"
        >
          FreelanceHigh
        </Link>
      </div>
    </div>
  );
}

// -- LANDING step ------------------------------------------------------------

function LandingStep({ step, onCTA, locale }: { step: FunnelStep; onCTA: () => void; locale: string }) {
  const l = (fr: string, en: string) => locale === "en" ? en : fr;
  const headline = locale === "en" ? (step.headlineEn || step.headlineFr) : step.headlineFr;
  const description = locale === "en" ? (step.descriptionEn || step.descriptionFr) : step.descriptionFr;
  const ctaText = locale === "en" ? (step.ctaTextEn || step.ctaTextFr) : step.ctaTextFr;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50 dark:from-primary/10 dark:via-slate-950 dark:to-slate-900 flex items-center">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
          <Sparkles className="w-4 h-4" />
          {l("Offre exclusive", "Exclusive offer")}
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
          {headline || step.title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            {description}
          </p>
        )}

        {/* CTA Button */}
        <button
          onClick={onCTA}
          className="inline-flex items-center gap-3 bg-primary text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 transition-all transform hover:scale-105"
        >
          {ctaText || l("D\u00e9couvrir", "Discover")}
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            {l("Paiement s\u00e9curis\u00e9", "Secure payment")}
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500" />
            {l("4.8/5 satisfaction", "4.8/5 satisfaction")}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-500" />
            {l("+2 000 apprenants", "+2,000 learners")}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-500" />
            {l("Acc\u00e8s imm\u00e9diat", "Instant access")}
          </div>
        </div>
      </div>
    </div>
  );
}

// -- PRODUCT step ------------------------------------------------------------

function ProductStep({
  step,
  onCTA,
  onSkip,
  locale,
}: {
  step: FunnelStep;
  onCTA: () => void;
  onSkip: () => void;
  locale: string;
}) {
  const l = (fr: string, en: string) => locale === "en" ? en : fr;
  const headline = locale === "en" ? (step.headlineEn || step.headlineFr) : step.headlineFr;
  const description = locale === "en" ? (step.descriptionEn || step.descriptionFr) : step.descriptionFr;
  const ctaText = locale === "en" ? (step.ctaTextEn || step.ctaTextFr) : step.ctaTextFr;

  const price = step.linkedProductPrice;
  const discountedPrice =
    price && step.discountPct ? price * (1 - step.discountPct / 100) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 dark:bg-slate-950 flex items-center">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Product title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          {headline || step.linkedProductTitle || step.title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-base text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            {description}
          </p>
        )}

        {/* Feature bullets */}
        <div className="space-y-3 mb-8">
          {(locale === "en"
            ? [
                "Lifetime access with free updates",
                "Premium support via email and chat",
                "Certificate of completion",
                "Hands-on projects included",
              ]
            : [
                "Acc\u00e8s \u00e0 vie avec mises \u00e0 jour gratuites",
                "Support premium par email et chat",
                "Certificat de compl\u00e9tion",
                "Projets pratiques inclus",
              ]
          ).map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        {price && (
          <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-slate-700 dark:border-slate-800">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {discountedPrice
                  ? `${discountedPrice.toFixed(2)}€`
                  : `${price.toFixed(2)}€`}
              </span>
              {discountedPrice && (
                <span className="text-lg text-slate-400 line-through">
                  {price.toFixed(2)}€
                </span>
              )}
              {step.discountPct && (
                <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  -{step.discountPct}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{l("Paiement unique - Pas d'abonnement", "One-time payment - No subscription")}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onCTA}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-green-600 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/20 transition-all transform hover:scale-105"
        >
          {ctaText || l("Acheter maintenant", "Buy now")}
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Guarantee */}
        <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          {l("Garantie satisfait ou rembours\u00e9 30 jours", "30-day money-back guarantee")}
        </div>
      </div>
    </div>
  );
}

// -- CHECKOUT step -----------------------------------------------------------

function CheckoutStep({ step, onCTA, locale }: { step: FunnelStep; onCTA: () => void; locale: string }) {
  const l = (fr: string, en: string) => locale === "en" ? en : fr;
  const headline = locale === "en" ? (step.headlineEn || step.headlineFr) : step.headlineFr;
  const description = locale === "en" ? (step.descriptionEn || step.descriptionFr) : step.descriptionFr;
  const ctaText = locale === "en" ? (step.ctaTextEn || step.ctaTextFr) : step.ctaTextFr;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-950 flex items-center">
      <div className="max-w-lg mx-auto px-6 py-20 w-full">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
          {headline || l("Finalisez votre commande", "Complete your order")}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 text-center mb-8">{description}</p>
        )}

        {/* Simulated checkout form */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder={l("votre@email.com", "your@email.com")}
              className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {l("Nom complet", "Full name")}
            </label>
            <input
              type="text"
              placeholder={l("Pr\u00e9nom Nom", "First Last")}
              className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 dark:bg-slate-700"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={onCTA}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-green-700 transition-colors text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              {ctaText || l("Payer maintenant", "Pay now")}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {l("SSL s\u00e9curis\u00e9", "SSL secured")}
            </span>
            <span>Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- UPSELL step -------------------------------------------------------------

function UpsellStep({
  step,
  onAccept,
  onDecline,
  locale,
}: {
  step: FunnelStep;
  onAccept: () => void;
  onDecline: () => void;
  locale: string;
}) {
  const l = (fr: string, en: string) => locale === "en" ? en : fr;
  const headline = locale === "en" ? (step.headlineEn || step.headlineFr) : step.headlineFr;
  const description = locale === "en" ? (step.descriptionEn || step.descriptionFr) : step.descriptionFr;
  const ctaText = locale === "en" ? (step.ctaTextEn || step.ctaTextFr) : step.ctaTextFr;

  const originalPrice = step.linkedProductPrice;
  const discountedPrice =
    originalPrice && step.discountPct
      ? originalPrice * (1 - step.discountPct / 100)
      : originalPrice;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-950 flex items-center">
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        {/* Alert badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-6 animate-pulse">
          <Gift className="w-4 h-4" />
          {l("Offre sp\u00e9ciale - R\u00e9serv\u00e9e aux acheteurs", "Special offer - For buyers only")}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          {headline || l("Attendez ! Offre sp\u00e9ciale", "Wait! Special offer")}
        </h1>

        {description && (
          <p className="text-base text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
            {description}
          </p>
        )}

        {/* Product card */}
        {step.linkedProductTitle && (
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border-2 border-amber-200 dark:border-amber-800/50 p-6 mb-8 max-w-md mx-auto relative overflow-hidden">
            {step.discountPct && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                -{step.discountPct}% {l("EXCLUSIF", "EXCLUSIVE")}
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 pr-20">
              {step.linkedProductTitle}
            </h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-extrabold text-green-600">
                {discountedPrice ? `${discountedPrice.toFixed(2)}€` : `${originalPrice?.toFixed(2)}€`}
              </span>
              {step.discountPct && originalPrice && (
                <span className="text-lg text-slate-400 line-through">
                  {originalPrice.toFixed(2)}€
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{l("Ajout\u00e9 \u00e0 votre commande en 1 clic", "Added to your order in 1 click")}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <button
            onClick={onAccept}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-6 py-4 rounded-2xl text-lg hover:bg-green-700 hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Check className="w-5 h-5" />
            {ctaText || l("Oui, j\u2019ajoute !", "Yes, add it!")}
          </button>
          <button
            onClick={onDecline}
            className="w-full text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-2 transition-colors underline underline-offset-2"
          >
            {l("Non merci, je passe", "No thanks, I\u2019ll pass")}
          </button>
        </div>
      </div>
    </div>
  );
}

// -- DOWNSELL step -----------------------------------------------------------

function DownsellStep({
  step,
  onAccept,
  onDecline,
  locale,
}: {
  step: FunnelStep;
  onAccept: () => void;
  onDecline: () => void;
  locale: string;
}) {
  const l = (fr: string, en: string) => locale === "en" ? en : fr;
  const headline = locale === "en" ? (step.headlineEn || step.headlineFr) : step.headlineFr;
  const description = locale === "en" ? (step.descriptionEn || step.descriptionFr) : step.descriptionFr;
  const ctaText = locale === "en" ? (step.ctaTextEn || step.ctaTextFr) : step.ctaTextFr;

  const price = step.linkedProductPrice;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-950 flex items-center">
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
          {headline || l("Pas convaincu ? Voici une alternative", "Not convinced? Here\u2019s an alternative")}
        </h1>

        {description && (
          <p className="text-base text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto">
            {description}
          </p>
        )}

        {step.linkedProductTitle && (
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-blue-800/50 p-6 mb-8 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {step.linkedProductTitle}
            </h3>
            {price && (
              <div className="mb-2">
                <span className="text-3xl font-extrabold text-primary">
                  {price.toFixed(2)}€
                </span>
              </div>
            )}
            <p className="text-xs text-slate-400">{l("Prix r\u00e9duit - Offre limit\u00e9e", "Reduced price - Limited offer")}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <button
            onClick={onAccept}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-xl text-base hover:bg-primary/90 transition-all"
          >
            <Check className="w-4 h-4" />
            {ctaText || l("Oui, je prends !", "Yes, I\u2019ll take it!")}
          </button>
          <button
            onClick={onDecline}
            className="w-full text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-2 transition-colors underline underline-offset-2"
          >
            {l("Non merci, continuer sans", "No thanks, continue without")}
          </button>
        </div>
      </div>
    </div>
  );
}

// -- CONFIRMATION step -------------------------------------------------------

function ConfirmationStep({
  step,
  acceptedItems,
  allSteps,
  onCheckout,
  checkingOut,
  locale,
}: {
  step: FunnelStep;
  acceptedItems: string[];
  allSteps: FunnelStep[];
  onCheckout: () => void;
  checkingOut: boolean;
  locale: string;
}) {
  const l = (fr: string, en: string) => locale === "en" ? en : fr;
  const headline = locale === "en" ? (step.headlineEn || step.headlineFr) : step.headlineFr;
  const description = locale === "en" ? (step.descriptionEn || step.descriptionFr) : step.descriptionFr;
  const ctaText = locale === "en" ? (step.ctaTextEn || step.ctaTextFr) : step.ctaTextFr;

  // Build order summary from accepted items
  const orderItems = allSteps.filter(
    (s) =>
      s.linkedProductId &&
      acceptedItems.includes(s.linkedProductId) &&
      ["PRODUCT", "UPSELL", "DOWNSELL"].includes(s.type),
  );

  const totalAmount = orderItems.reduce((sum, item) => {
    const price = item.linkedProductPrice || 0;
    const discount = item.discountPct ? price * (item.discountPct / 100) : 0;
    return sum + (price - discount);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-950 flex items-center">
      <div className="max-w-lg mx-auto px-6 py-20 w-full">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
          {headline || l("R\u00e9capitulatif de votre commande", "Order summary")}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 text-center mb-8">{description}</p>
        )}

        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Order items */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {orderItems.length > 0 ? (
              orderItems.map((item) => {
                const price = item.linkedProductPrice || 0;
                const finalPrice = item.discountPct
                  ? price * (1 - item.discountPct / 100)
                  : price;

                return (
                  <div key={item.id} className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {item.linkedProductTitle}
                      </p>
                      {item.discountPct && (
                        <p className="text-xs text-green-600">
                          -{item.discountPct}% {l("de r\u00e9duction", "discount")}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {finalPrice.toFixed(2)}€
                      </p>
                      {item.discountPct && (
                        <p className="text-xs text-slate-400 line-through">{price.toFixed(2)}€</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-slate-400">
                {l("Aucun article dans votre commande", "No items in your order")}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t-2 border-slate-200 dark:border-slate-700 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 dark:text-white">Total</span>
              <span className="text-xl font-extrabold text-green-600">
                {totalAmount.toFixed(2)}€
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="p-4">
            <button
              onClick={onCheckout}
              disabled={checkingOut || orderItems.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {checkingOut
                ? l("Redirection vers le paiement...", "Redirecting to payment...")
                : (ctaText || l("Confirmer et payer", "Confirm and pay"))}
            </button>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mt-3">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {l("Paiement s\u00e9curis\u00e9", "Secure payment")}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3" /> {l("Garantie 30 jours", "30-day guarantee")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- THANK_YOU step ----------------------------------------------------------

function ThankYouStep({ step, locale }: { step: FunnelStep; locale: string }) {
  const l = (fr: string, en: string) => locale === "en" ? en : fr;
  const headline = locale === "en" ? (step.headlineEn || step.headlineFr) : step.headlineFr;
  const description = locale === "en" ? (step.descriptionEn || step.descriptionFr) : step.descriptionFr;
  const ctaText = locale === "en" ? (step.ctaTextEn || step.ctaTextFr) : step.ctaTextFr;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-slate-950 flex items-center">
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        {/* Success animation */}
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          {headline || l("Merci pour votre achat !", "Thank you for your purchase!")}
        </h1>

        {description && (
          <p className="text-base text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
            {description}
          </p>
        )}

        {/* Next steps */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8 max-w-md mx-auto text-left">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            {l("Prochaines \u00e9tapes", "Next steps")}
          </h3>
          <div className="space-y-3">
            {(locale === "en"
              ? [
                  "Check your email for access details",
                  "Log in to your learner dashboard",
                  "Start your first lesson",
                ]
              : [
                  "V\u00e9rifiez votre email pour l\u2019acc\u00e8s",
                  "Connectez-vous \u00e0 votre espace apprenant",
                  "Commencez votre premi\u00e8re le\u00e7on",
                ]
            ).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-600">{i + 1}</span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/formations/explorer"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            {ctaText || l("Acc\u00e9der \u00e0 ma formation", "Access my course")}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-sm transition-colors"
          >
            {l("Retour \u00e0 l\u2019accueil", "Back to home")}
          </Link>
        </div>

        {/* Share / social proof */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-3">{l("Rejoignez notre communaut\u00e9", "Join our community")}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-400" />
              <span>{l("+2 000 apprenants satisfaits", "+2,000 satisfied learners")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
