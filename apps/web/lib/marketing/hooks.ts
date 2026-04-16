/**
 * FreelanceHigh — Marketing Hooks
 *
 * Point d'entree central qui connecte les evenements plateforme
 * (achats, inscriptions, abandons, completions) au moteur marketing.
 *
 * Chaque fonction est fire-and-forget : elle ne bloque jamais l'appelant.
 * Les erreurs sont capturees et loguees avec le prefixe [Marketing Hooks].
 *
 * Flux :
 *   Evenement plateforme
 *     -> emitEvent() (automation engine : trigger workflows + propagation eventBus)
 *     -> trackConversion() (si affilie detecte)
 */

import { emitEvent, type TriggerEvent } from "./automation-engine";
import { trackConversion } from "./affiliate-tracker";
// Note: emitEvent() already propagates to eventBus internally,
// so we do not need to call eventBus.emit() separately.

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a TriggerEvent from base parameters.
 */
function buildEvent(
  type: TriggerEvent["type"],
  userId: string,
  metadata: Record<string, unknown> = {}
): TriggerEvent {
  return {
    type,
    userId,
    metadata,
    timestamp: new Date(),
  };
}

/**
 * Safe wrapper: executes a callback in true fire-and-forget mode.
 * The returned promise resolves immediately; the inner work runs
 * asynchronously without blocking the caller.
 * Errors are caught and logged without propagating.
 */
function fireAndForget(
  label: string,
  fn: () => Promise<void>
): void {
  void fn().catch((err) => {
    console.error(`[Marketing Hooks] ${label}:`, err);
  });
}

// ── Hook: Formation Purchase ─────────────────────────────────────────────────

/**
 * Called after a formation enrollment is confirmed (payment verified).
 *
 * 1. Emit PURCHASE event to automation engine (triggers post-purchase workflows)
 * 2. Check for affiliate cookie and track conversion
 * 3. Enroll user in post-purchase email sequences via automation actions
 * 4. Emit to event bus for real-time listeners (dashboards, popups)
 */
export function onFormationPurchase(
  userId: string,
  formationId: string,
  amount: number,
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onFormationPurchase", async () => {
    console.log(
      `[Marketing Hooks] onFormationPurchase: userId=${userId}, formationId=${formationId}, amount=${amount}`
    );

    const event = buildEvent("PURCHASE", userId, {
      formationId,
      amount,
      orderType: "formation",
      ...metadata,
    });

    // 1. Emit to automation engine (evaluates all PURCHASE workflows)
    await emitEvent(event);

    // 2. Check affiliate cookie and track conversion if present
    const affiliateCode = getAffiliateCookieServer(metadata);
    if (affiliateCode) {
      console.log(
        `[Marketing Hooks] Affiliate conversion detected: code=${affiliateCode}`
      );
      await trackConversion(
        affiliateCode,
        `formation-${formationId}-${Date.now()}`,
        amount,
        "formation"
      );

      // Also emit AFFILIATE_SALE event for the affiliate's workflows
      const affiliateEvent = buildEvent("AFFILIATE_SALE", userId, {
        affiliateCode,
        amount,
        orderType: "formation",
        formationId,
      });
      await emitEvent(affiliateEvent);
    }

    // Note: emitEvent() already propagates to eventBus for real-time listeners
  });
}

// ── Hook: Digital Product Purchase ───────────────────────────────────────────

/**
 * Called after a digital product purchase is completed.
 * Same flow as formation purchase but for products.
 */
export function onProductPurchase(
  userId: string,
  productId: string,
  amount: number,
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onProductPurchase", async () => {
    console.log(
      `[Marketing Hooks] onProductPurchase: userId=${userId}, productId=${productId}, amount=${amount}`
    );

    const event = buildEvent("PURCHASE", userId, {
      productId,
      amount,
      orderType: "digital_product",
      ...metadata,
    });

    // 1. Emit to automation engine
    await emitEvent(event);

    // 2. Check affiliate conversion
    const affiliateCode = getAffiliateCookieServer(metadata);
    if (affiliateCode) {
      console.log(
        `[Marketing Hooks] Affiliate conversion detected: code=${affiliateCode}`
      );
      await trackConversion(
        affiliateCode,
        `product-${productId}-${Date.now()}`,
        amount,
        "digital_product"
      );

      const affiliateEvent = buildEvent("AFFILIATE_SALE", userId, {
        affiliateCode,
        amount,
        orderType: "digital_product",
        productId,
      });
      await emitEvent(affiliateEvent);
    }

    // Note: emitEvent() already propagates to eventBus for real-time listeners
  });
}

// ── Hook: User Signup ────────────────────────────────────────────────────────

/**
 * Called when a new user signs up on the platform.
 *
 * 1. Emit USER_SIGNUP event (triggers welcome email + onboarding sequence)
 * 2. Emit to event bus for real-time analytics
 */
export function onUserSignup(
  userId: string,
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onUserSignup", async () => {
    console.log(
      `[Marketing Hooks] onUserSignup: userId=${userId}`
    );

    const event = buildEvent("USER_SIGNUP", userId, {
      ...metadata,
    });

    // 1. Emit to automation engine (triggers welcome workflows)
    await emitEvent(event);

    // Note: emitEvent() already propagates to eventBus for real-time listeners
  });
}

// ── Hook: Cart Abandoned ─────────────────────────────────────────────────────

/**
 * Called when a user abandons their cart (detected by inactivity timer
 * or page unload with items in cart).
 *
 * 1. Emit CART_ABANDONED event (triggers recovery email sequence)
 * 2. Emit to event bus for real-time tracking
 */
export function onCartAbandoned(
  userId: string,
  cartItems: string[],
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onCartAbandoned", async () => {
    console.log(
      `[Marketing Hooks] onCartAbandoned: userId=${userId}, items=${cartItems.length}`
    );

    const event = buildEvent("CART_ABANDONED", userId, {
      cartItems,
      itemCount: cartItems.length,
      ...metadata,
    });

    // 1. Emit to automation engine (triggers cart recovery workflows)
    await emitEvent(event);

    // Note: emitEvent() already propagates to eventBus for real-time listeners
  });
}

// ── Hook: Course Completed ───────────────────────────────────────────────────

/**
 * Called when a user completes all lessons/modules of a formation.
 *
 * 1. Emit COURSE_COMPLETED event (triggers upsell workflows)
 * 2. Emit to event bus
 */
export function onCourseCompleted(
  userId: string,
  formationId: string,
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onCourseCompleted", async () => {
    console.log(
      `[Marketing Hooks] onCourseCompleted: userId=${userId}, formationId=${formationId}`
    );

    const event = buildEvent("COURSE_COMPLETED", userId, {
      formationId,
      ...metadata,
    });

    // 1. Emit to automation engine (triggers post-completion/upsell workflows)
    await emitEvent(event);

    // Note: emitEvent() already propagates to eventBus for real-time listeners
  });
}

// ── Hook: Lesson Completed ───────────────────────────────────────────────────

/**
 * Called when a user completes a single lesson within a formation.
 */
export function onLessonCompleted(
  userId: string,
  formationId: string,
  lessonId: string,
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onLessonCompleted", async () => {
    console.log(
      `[Marketing Hooks] onLessonCompleted: userId=${userId}, formationId=${formationId}, lessonId=${lessonId}`
    );

    const event = buildEvent("LESSON_COMPLETED", userId, {
      formationId,
      lessonId,
      ...metadata,
    });

    await emitEvent(event);
  });
}

// ── Hook: Quiz Result ────────────────────────────────────────────────────────

/**
 * Called when a user finishes a quiz (pass or fail).
 *
 * 1. Emit QUIZ_PASSED or QUIZ_FAILED event
 * 2. Emit to event bus
 */
export function onQuizResult(
  userId: string,
  formationId: string,
  passed: boolean,
  score: number,
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onQuizResult", async () => {
    const eventType = passed ? "QUIZ_PASSED" : "QUIZ_FAILED";
    console.log(
      `[Marketing Hooks] onQuizResult: userId=${userId}, formationId=${formationId}, passed=${passed}, score=${score}`
    );

    const event = buildEvent(eventType, userId, {
      formationId,
      score,
      passed,
      ...metadata,
    });

    await emitEvent(event);
  });
}

// ── Hook: Tag Changed ────────────────────────────────────────────────────────

/**
 * Called when a user tag is added or removed.
 * Useful for triggering tag-based workflows.
 */
export function onTagChanged(
  userId: string,
  tag: string,
  action: "added" | "removed",
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onTagChanged", async () => {
    const eventType = action === "added" ? "TAG_ADDED" : "TAG_REMOVED";
    console.log(
      `[Marketing Hooks] onTagChanged: userId=${userId}, tag=${tag}, action=${action}`
    );

    const event = buildEvent(eventType, userId, {
      tag,
      action,
      ...metadata,
    });

    await emitEvent(event);
  });
}

// ── Hook: Funnel Step Reached ────────────────────────────────────────────────

/**
 * Called when a user reaches a specific step in a sales funnel.
 */
export function onFunnelStepReached(
  userId: string,
  funnelId: string,
  stepIndex: number,
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onFunnelStepReached", async () => {
    console.log(
      `[Marketing Hooks] onFunnelStepReached: userId=${userId}, funnelId=${funnelId}, stepIndex=${stepIndex}`
    );

    const event = buildEvent("FUNNEL_STEP_REACHED", userId, {
      funnelId,
      stepIndex,
      ...metadata,
    });

    await emitEvent(event);
  });
}

// ── Hook: Custom Event ───────────────────────────────────────────────────────

/**
 * Generic hook for custom events not covered by the specific hooks above.
 * Useful for extensibility.
 */
export function onCustomEvent(
  userId: string,
  eventName: string,
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onCustomEvent", async () => {
    console.log(
      `[Marketing Hooks] onCustomEvent: userId=${userId}, eventName=${eventName}`
    );

    const event = buildEvent("CUSTOM_EVENT", userId, {
      eventName,
      ...metadata,
    });

    await emitEvent(event);
  });
}

// ── Hook: User Inactive ──────────────────────────────────────────────────────

/**
 * Called when a user is detected as inactive (e.g., no login for X days).
 * Typically called by a cron job or background worker.
 */
export function onUserInactive(
  userId: string,
  daysInactive: number,
  metadata?: Record<string, unknown>
): void {
  fireAndForget("onUserInactive", async () => {
    console.log(
      `[Marketing Hooks] onUserInactive: userId=${userId}, daysInactive=${daysInactive}`
    );

    const event = buildEvent("USER_INACTIVE", userId, {
      daysInactive,
      ...metadata,
    });

    await emitEvent(event);
  });
}

// ── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Extract the affiliate code from metadata (passed from client-side cookie
 * via API route headers or body).
 *
 * In server context, we cannot access document.cookie directly.
 * The affiliate code is expected to be passed in metadata.affiliateCode
 * by the calling API route which reads it from the request cookie.
 */
function getAffiliateCookieServer(
  metadata?: Record<string, unknown>
): string | null {
  if (!metadata) return null;
  const code = metadata.affiliateCode;
  if (typeof code === "string" && code.length >= 6 && code.length <= 12) {
    return code;
  }
  return null;
}
