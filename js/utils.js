/**
 * Pure helper functions shared across modules. No DOM access, no storage.
 */
const Utils = (() => {
  /**
   * Strips accents/diacritics, lowercases, and collapses non-alphanumeric
   * characters so search can ignore case, accents and punctuation.
   */
  function normalizeText(value) {
    if (!value) return '';
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function debounce(fn, delay = 150) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function formatCurrency(value) {
    const number = Number(value) || 0;
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  /** Small stable string hash (djb2), used to derive product ids. */
  function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
  }

  return { normalizeText, debounce, formatCurrency, hashString };
})();
