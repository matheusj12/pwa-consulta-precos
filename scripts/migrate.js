/**
 * One-time (and re-runnable) migration: creates the `produtos` table if
 * needed and upserts every row from data/produtos.json. Run with:
 *
 *   POSTGRES_URL=postgres://... node scripts/migrate.js
 *
 * Safe to re-run — it's an upsert keyed on the same stable id the
 * frontend already uses for favorites, so re-running won't duplicate rows
 * or break existing LocalStorage favorites.
 */
const fs = require('fs');
const path = require('path');
const { query, getPool } = require('../lib/db');
const { productId } = require('../lib/hash');

async function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'produtos.json');
  const produtos = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  await query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY,
      categoria TEXT NOT NULL,
      marca TEXT NOT NULL DEFAULT '',
      nome TEXT NOT NULL,
      embalagem TEXT NOT NULL DEFAULT '',
      unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
      caixa NUMERIC(10,2) NOT NULL DEFAULT 0,
      imagem TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  let count = 0;
  for (const p of produtos) {
    const id = productId(p);
    await query(
      `INSERT INTO produtos (id, categoria, marca, nome, embalagem, unitario, caixa, imagem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         categoria = EXCLUDED.categoria,
         marca = EXCLUDED.marca,
         nome = EXCLUDED.nome,
         embalagem = EXCLUDED.embalagem,
         unitario = EXCLUDED.unitario,
         caixa = EXCLUDED.caixa,
         imagem = EXCLUDED.imagem`,
      [id, p.categoria, p.marca || '', p.nome, p.embalagem || '', p.unitario, p.caixa, p.imagem || '']
    );
    count += 1;
  }

  console.log(`Migrated ${count} products.`);
  await getPool().end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
