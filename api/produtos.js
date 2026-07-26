const { query } = require('../lib/db');

/** Public, read-only catalog — consumed by the PWA in place of the old static data/produtos.json. */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { rows } = await query(
      `SELECT id, categoria, marca, nome, embalagem, unitario, caixa, imagem
       FROM produtos
       ORDER BY categoria, nome`
    );
    const produtos = rows.map((r) => ({
      ...r,
      unitario: Number(r.unitario),
      caixa: Number(r.caixa),
    }));

    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).json(produtos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha ao carregar catálogo' });
  }
};
