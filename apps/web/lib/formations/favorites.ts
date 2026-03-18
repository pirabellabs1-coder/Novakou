const FAVORITES_KEY = "fh_formation_favorites";

// ── localStorage helpers (work for all users, including non-authenticated) ──

export function getFormationFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleFormationFavorite(id: string): boolean {
  const favorites = getFormationFavorites();
  const idx = favorites.indexOf(id);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return false;
  } else {
    favorites.push(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  }
}

function setFormationFavorites(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

// ── Server sync functions (for authenticated users) ──

/**
 * Fetches favorites from the server and merges them with localStorage.
 * Server favorites that are not in localStorage are added.
 * localStorage favorites that are not on the server are pushed to the server.
 * Returns the merged list of favorite formation IDs.
 */
export async function syncFavoritesFromServer(): Promise<string[]> {
  try {
    const res = await fetch("/api/apprenant/favoris");
    if (!res.ok) return getFormationFavorites();

    const data = await res.json();
    const serverFavorites: string[] = (data.favorites || []).map(
      (f: { formationId: string }) => f.formationId
    );

    const localFavorites = getFormationFavorites();

    // Merge: union of both sets
    const merged = Array.from(new Set([...serverFavorites, ...localFavorites]));

    // Push any local-only favorites to the server
    const localOnly = localFavorites.filter((id) => !serverFavorites.includes(id));
    await Promise.allSettled(
      localOnly.map((formationId) => addFavoriteServer(formationId))
    );

    // Save merged list to localStorage
    setFormationFavorites(merged);

    return merged;
  } catch {
    return getFormationFavorites();
  }
}

/**
 * Adds a formation to server favorites and updates localStorage.
 */
export async function addFavoriteServer(formationId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/apprenant/favoris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formationId }),
    });

    if (res.ok) {
      // Also ensure it's in localStorage
      const favorites = getFormationFavorites();
      if (!favorites.includes(formationId)) {
        favorites.push(formationId);
        setFormationFavorites(favorites);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Removes a formation from server favorites and updates localStorage.
 */
export async function removeFavoriteServer(formationId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/apprenant/favoris?formationId=${encodeURIComponent(formationId)}`, {
      method: "DELETE",
    });

    if (res.ok) {
      // Also remove from localStorage
      const favorites = getFormationFavorites();
      const idx = favorites.indexOf(formationId);
      if (idx >= 0) {
        favorites.splice(idx, 1);
        setFormationFavorites(favorites);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
