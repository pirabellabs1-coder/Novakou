/**
 * FreelanceHigh — Marketing Event Bus
 *
 * Bus d'evenements in-process pour la propagation temps reel des evenements marketing.
 * Singleton qui permet aux differents modules de s'abonner aux evenements
 * sans couplage direct.
 *
 * Usage:
 *   import { eventBus } from "./event-bus";
 *   eventBus.on("PURCHASE", async (event) => { ... });
 *   eventBus.emit({ type: "PURCHASE", userId: "...", metadata: {}, timestamp: new Date() });
 */

import type { TriggerEvent, TriggerType } from "./automation-engine";

type EventHandler = (event: TriggerEvent) => Promise<void>;

// ── Wildcard ─────────────────────────────────────────────────────────────────
const WILDCARD = "*";

class MarketingEventBus {
  private static instance: MarketingEventBus;

  private handlers: Map<string, EventHandler[]> = new Map();
  private emitCount = 0;
  private lastEmitAt: string | null = null;

  private constructor() {
    // Private constructor — use getInstance()
  }

  static getInstance(): MarketingEventBus {
    if (!MarketingEventBus.instance) {
      MarketingEventBus.instance = new MarketingEventBus();
    }
    return MarketingEventBus.instance;
  }

  /**
   * Subscribe to a specific event type (or "*" for all events).
   */
  on(eventType: TriggerType | "*", handler: EventHandler): void {
    const key = eventType;
    const existing = this.handlers.get(key) || [];
    existing.push(handler);
    this.handlers.set(key, existing);
  }

  /**
   * Unsubscribe a specific handler from an event type.
   */
  off(eventType: TriggerType | "*", handler: EventHandler): void {
    const key = eventType;
    const existing = this.handlers.get(key);
    if (!existing) return;

    const filtered = existing.filter((h) => h !== handler);
    if (filtered.length === 0) {
      this.handlers.delete(key);
    } else {
      this.handlers.set(key, filtered);
    }
  }

  /**
   * Emit an event to all matching handlers.
   * Calls handlers for the specific type + wildcard handlers.
   * Errors in individual handlers are caught and logged without stopping other handlers.
   */
  async emit(event: TriggerEvent): Promise<void> {
    this.emitCount++;
    this.lastEmitAt = new Date().toISOString();

    // Collect all matching handlers
    const typeHandlers = this.handlers.get(event.type) || [];
    const wildcardHandlers = this.handlers.get(WILDCARD) || [];
    const allHandlers = [...typeHandlers, ...wildcardHandlers];

    if (allHandlers.length === 0) return;

    // Execute all handlers concurrently
    const results = await Promise.allSettled(
      allHandlers.map((handler) => handler(event))
    );

    // Log failures
    for (const result of results) {
      if (result.status === "rejected") {
        console.error(
          `[EventBus] Handler failed for event ${event.type}:`,
          result.reason
        );
      }
    }
  }

  /**
   * Remove all handlers for a specific event type, or all handlers if no type given.
   */
  clear(eventType?: TriggerType | "*"): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get the number of registered handlers for a type (or total).
   */
  listenerCount(eventType?: TriggerType | "*"): number {
    if (eventType) {
      return (this.handlers.get(eventType) || []).length;
    }
    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.length;
    }
    return total;
  }

  /**
   * Get all registered event types.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Diagnostic stats.
   */
  getStats(): { totalHandlers: number; emitCount: number; lastEmitAt: string | null; registeredTypes: string[] } {
    return {
      totalHandlers: this.listenerCount(),
      emitCount: this.emitCount,
      lastEmitAt: this.lastEmitAt,
      registeredTypes: this.getRegisteredTypes(),
    };
  }
}

export const eventBus = MarketingEventBus.getInstance();
