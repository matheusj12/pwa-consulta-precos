/**
 * LocalStorage access for favorites and search history.
 * No DOM access, no business logic beyond persistence rules.
 */
const Storage = (() => {
  const KEYS = {
    FAVORITES: 'atacadao:favorites',
    HISTORY: 'atacadao:history',
  };

  const HISTORY_LIMIT = 20;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* storage full or unavailable: silently ignore, app keeps working in-memory */
    }
  }

  // ---- Favorites ----

  function getFavorites() {
    return readJSON(KEYS.FAVORITES, []);
  }

  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function toggleFavorite(id) {
    const favorites = getFavorites();
    const index = favorites.indexOf(id);
    if (index === -1) {
      favorites.push(id);
    } else {
      favorites.splice(index, 1);
    }
    writeJSON(KEYS.FAVORITES, favorites);
    return favorites.includes(id);
  }

  // ---- Search history ----

  function getHistory() {
    return readJSON(KEYS.HISTORY, []);
  }

  function addHistoryTerm(term) {
    const clean = term.trim();
    if (!clean) return getHistory();
    let history = getHistory().filter((item) => item.toLowerCase() !== clean.toLowerCase());
    history.unshift(clean);
    history = history.slice(0, HISTORY_LIMIT);
    writeJSON(KEYS.HISTORY, history);
    return history;
  }

  function clearHistory() {
    writeJSON(KEYS.HISTORY, []);
  }

  return {
    getFavorites,
    isFavorite,
    toggleFavorite,
    getHistory,
    addHistoryTerm,
    clearHistory,
  };
})();
