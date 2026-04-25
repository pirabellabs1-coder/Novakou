/**
 * Dev-mode user store stub.
 * Used as fallback when IS_DEV && !USE_PRISMA_FOR_DATA.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const users: any[] = [];

export const devStore = {
  users: {
    getAll: () => users,
    getById: (id: string) => users.find((u: any) => u.id === id) ?? null,
    filter: (fn: (u: any) => boolean) => users.filter(fn),
    update: (id: string, data: any) => {
      const idx = users.findIndex((u: any) => u.id === id);
      if (idx >= 0) Object.assign(users[idx], data);
      return users[idx] ?? null;
    },
  },
};
