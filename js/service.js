/**
 * ProductService: fetches data/produtos.json exactly once and keeps the
 * catalog in memory for the lifetime of the page. Nothing else in the app
 * is allowed to fetch this file again — search and rendering both read
 * from the array this module exposes.
 */
const ProductService = (() => {
  let products = null;
  let loadingPromise = null;

  function assignId(product) {
    const key = [product.categoria, product.marca, product.nome, product.embalagem].join('|');
    return Utils.hashString(key);
  }

  async function load() {
    if (products) return products;
    if (loadingPromise) return loadingPromise;

    loadingPromise = fetch('data/produtos.json', { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Falha ao carregar catálogo (${res.status})`);
        return res.json();
      })
      .then((raw) => {
        products = raw.map((item) => ({
          ...item,
          id: assignId(item),
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
