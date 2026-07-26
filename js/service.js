/**
 * ProductService: fetches /api/produtos exactly once and keeps the catalog
 * in memory for the lifetime of the page. Nothing else in the app is
 * allowed to fetch it again — search and rendering both read from the
 * array this module exposes.
 */
const ProductService = (() => {
  let products = null;
  let loadingPromise = null;

  // The API already assigns a stable id per product (same hash the app used
  // when data lived in a static JSON file), kept here only as a fallback.
  function assignId(product) {
    const key = [product.categoria, product.marca, product.nome, product.embalagem].join('|');
    return Utils.hashString(key);
  }

  async function load() {
    if (products) return products;
    if (loadingPromise) return loadingPromise;

    loadingPromise = fetch('/api/produtos', { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Falha ao carregar catálogo (${res.status})`);
        return res.json();
      })
      .then((raw) => {
        products = raw.map((item) => ({
          ...item,
          id: item.id || assignId(item),
        }));
        return products;
      });

    return loadingPromise;
  }

  function getAll() {
    return products || [];
  }

  function getCategorias() {
    const set = new Set(getAll().map((p) => p.categoria).filter(Boolean));
    return Array.from(set);
  }

  function getById(id) {
    return getAll().find((p) => p.id === id) || null;
  }

  return { load, getAll, getCategorias, getById };
})();
