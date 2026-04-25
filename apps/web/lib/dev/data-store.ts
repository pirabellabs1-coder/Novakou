/**
 * Dev-mode in-memory data stores.
 * Stub implementation — used as fallback when IS_DEV && !USE_PRISMA_FOR_DATA.
 * In production, all routes use Prisma directly.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

function createStore<T extends { id: string }>() {
  const items: T[] = [];
  return {
    getAll: () => items,
    getById: (id: string) => items.find((i) => i.id === id) ?? null,
    create: (data: any): T => {
      const item = { id: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...data } as T;
      items.push(item);
      return item;
    },
    update: (id: string, data: Partial<T>) => {
      const idx = items.findIndex((i) => i.id === id);
      if (idx >= 0) Object.assign(items[idx], data);
      return items[idx] ?? null;
    },
    delete: (id: string) => {
      const idx = items.findIndex((i) => i.id === id);
      if (idx >= 0) items.splice(idx, 1);
    },
    filter: (fn: (item: T) => boolean) => items.filter(fn),
    addMessage: (_id: string, _msg: any) => {},
  };
}

export const orderStore = createStore<any>();
export const serviceStore = createStore<any>();
export const transactionStore = createStore<any>();
export const reviewStore = createStore<any>();
export const notificationStore = createStore<any>();
export const kycRequestStore = createStore<any>();
export const offreStore = createStore<any>();
export const boostStore = createStore<any>();
