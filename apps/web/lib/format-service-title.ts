/**
 * Prepend "Je vais" to a service title if not already present.
 * All services on FreelanceHigh start with "Je vais" — freelancers
 * don't type it (the wizard adds it visually), so we add it at display time.
 */
export function formatServiceTitle(title: string): string {
  if (!title) return "";
  if (/^je vais\s/i.test(title)) return title;
  return `Je vais ${title}`;
}
