/**
 * Same djb2-style hash as js/utils.js (Utils.hashString), reimplemented here
 * so the migration script derives the exact same product ids the frontend
 * already computed client-side (keeps existing LocalStorage favorites valid).
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function productId(product) {
  const key = [product.categoria, product.marca, product.nome, product.embalagem].join('|');
  return hashString(key);
}

module.exports = { hashString, productId };
