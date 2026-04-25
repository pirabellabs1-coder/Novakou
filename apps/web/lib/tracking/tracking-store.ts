/**
 * Tracking store stub — dev-mode analytics storage.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const events: any[] = [];

export const trackingStore = {
  getAll: () => events,
  getByService: (_id: string) => [] as any[],
  getByUser: (_id: string) => [] as any[],
  getSummary: () => ({ totalViews: 0, totalClicks: 0, totalConversions: 0 }),
  track: (event: any) => { events.push({ ...event, timestamp: new Date().toISOString() }); },
};
