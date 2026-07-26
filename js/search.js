/**
 * SearchEngine: builds a normalized in-memory index once, then filters
 * synchronously on every keystroke. Never touches the network or DOM.
 */
const SearchEngine = (() => {
  let index = [];

  function buildIndex(products) {
    index = products.map((product) => ({
      product,
      haystack: Utils.normalizeText(
        [product.nome, product.categoria, product.embalagem, product.marca].join(' ')
      ),
    }));
  }

  function search(query, { onlyFavorites = false, categoria = null } = {}) {
    const tokens = Utils.normalizeText(query).split(' ').filter(Boolean);

    return index
      .filter((entry) => {
        if (categoria && entry.product.categoria !== categoria) return false;
        if (onlyFavorites && !Storage.isFavorite(entry.product.id)) return false;
        if (tokens.length === 0) return true;
        return tokens.every((token) => entry.haystack.includes(token));
      })
      .map((entry) => entry.product);
  }

  return { buildIndex, search };
})();
