/**
 * App: wires the other modules together. Owns the small bit of UI state
 * (query, active category, favorites-only) and re-renders on change.
 */
(() => {
  const state = {
    query: '',
    categoria: 'Todos',
    onlyFavorites: false,
  };

  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const favoritesToggle = document.getElementById('favorites-toggle');

  function isBrowsing() {
    return !state.query && state.categoria === 'Todos' && !state.onlyFavorites;
  }

  function refresh() {
    const results = SearchEngine.search(state.query, {
      categoria: state.categoria === 'Todos' ? null : state.categoria,
      onlyFavorites: state.onlyFavorites,
    });

    UI.renderResults(results, {
      grouped: isBrowsing(),
      onToggleFavorite: handleToggleFavorite,
    });

    UI.renderHistoryChips(Storage.getHistory(), state.query, handleHistorySelect);
    UI.setSearchClearVisible(Boolean(state.query));
  }

  function handleToggleFavorite(id) {
    Storage.toggleFavorite(id);
    refresh();
  }

  function handleHistorySelect(term) {
    state.query = term;
    searchInput.value = term;
    refresh();
  }

  function commitHistory() {
    if (state.query.trim().length >= 2) {
      Storage.addHistoryTerm(state.query.trim());
    }
  }

  function setupSearch() {
    const debouncedRefresh = Utils.debounce(refresh, 120);

    searchInput.addEventListener('input', (event) => {
      state.query = event.target.value;
      debouncedRefresh();
    });

    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        commitHistory();
        refresh();
        searchInput.blur();
      }
    });

    searchInput.addEventListener('blur', commitHistory);

    searchClear.addEventListener('click', () => {
      state.query = '';
      searchInput.value = '';
      searchInput.focus();
      refresh();
    });
  }

  function setupFavoritesToggle() {
    favoritesToggle.addEventListener('click', () => {
      state.onlyFavorites = !state.onlyFavorites;
      UI.setFavoritesToggleActive(state.onlyFavorites);
      refresh();
    });
  }

  function bindCategoryChips(categorias) {
    const onSelect = (categoria) => {
      state.categoria = categoria;
      UI.renderCategoryChips(categorias, state.categoria, onSelect);
      refresh();
    };
    UI.renderCategoryChips(categorias, state.categoria, onSelect);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register('service-worker.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            UI.showUpdateToast(() => {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            });
          }
        });
      });
    }).catch(() => {
      /* offline-first app: registration failure just means no offline cache yet */
    });
  }

  async function init() {
    UI.initEmptyStateIcon();
    setupSearch();
    setupFavoritesToggle();
    registerServiceWorker();

    try {
      const products = await ProductService.load();
      SearchEngine.buildIndex(products);
      bindCategoryChips(ProductService.getCategorias());
      refresh();
    } finally {
      UI.hideSplash();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
