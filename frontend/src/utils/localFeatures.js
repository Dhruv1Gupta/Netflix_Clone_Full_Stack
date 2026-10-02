// Small, dependency-free localStorage helpers for the "easy" features:
// watchlist, recently-viewed, and per-movie star ratings.
// Each is namespaced by key so they never collide with token storage.

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // storage full or unavailable — fail silently, feature is non-critical
  }
}

// ---- Watchlist ("My List") ------------------------------------------
const WATCHLIST_KEY = 'cv_watchlist';

export function getWatchlist() {
  return readList(WATCHLIST_KEY); // array of movie ids
}

export function isInWatchlist(id) {
  return getWatchlist().includes(id);
}

export function toggleWatchlist(id) {
  const current = getWatchlist();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  writeList(WATCHLIST_KEY, next);
  return next;
}

// ---- Recently viewed ---------------------------------------------------
const RECENT_KEY = 'cv_recently_viewed';
const RECENT_LIMIT = 12;

export function getRecentlyViewed() {
  return readList(RECENT_KEY); // array of movie ids, most recent first
}

export function pushRecentlyViewed(id) {
  const current = getRecentlyViewed().filter((x) => x !== id);
  const next = [id, ...current].slice(0, RECENT_LIMIT);
  writeList(RECENT_KEY, next);
  return next;
}

// ---- Personal star ratings (1-5, per movie, this browser only) --------
const RATINGS_KEY = 'cv_ratings';

export function getRatings() {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getRating(id) {
  return getRatings()[id] || 0;
}

export function setRating(id, value) {
  const current = getRatings();
  const next = { ...current, [id]: value };
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

// ---- Theme preference --------------------------------------------------
const THEME_KEY = 'cv_theme';

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY); // 'light' | 'dark' | null
}

export function setStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
