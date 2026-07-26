const { query } = require('../../lib/db');

const EDITABLE_FIELDS = ['categoria', 'marca', 'nome', 'embalagem', 'unitario', 'caixa', 'imagem'];

function isValidNumber(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

/**
 * Admin write endpoint — intentionally has no auth (per product decision:
 * internal tool, URL not linked from the public app). Validates input types
 * so a malformed request can't corrupt a row, but does not gate who can call it.
 */
module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { rows } = await query(
        `SELECT id, categoria, marca, nome, embalagem, unitario, caixa, imagem, updated_at
         FROM produtos ORDER BY categoria, nome`
      );
      res.status(200).json(rows.map((r) => ({ ...r, unitario: Number(r.unitario), caixa: Number(r.caixa) })));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Falha ao carregar produtos' });
    }
    return;
  }

  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id, ...fields } = req.body || {};
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'id é obrigatório' });
    return;
  }

  const updates = [];
  const values = [];
  let i = 1;

  for (const field of EDITABLE_FIELDS) {
    if (!(field in fields)) continue;
    const value = fields[field];

    if (field === 'unitario' || field === 'caixa') {
      if (!isValidNumber(value)) {
        res.status(400).json({ error: `${field} deve ser um número >= 0` });
        return;
      }
    } else if (typeof value !== 'string') {
      res.status(400).json({ error: `${field} deve ser texto` });
      return;
    }

    updates.push(`${field} = $${i}`);
    values.push(value);
    i += 1;
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'Nenhum campo para atualizar' });
    return;
  }

  updates.push('updated_at = now()');
  values.push(id);

  try {
    const { rows } = await query(
      `UPDATE produtos SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    const row = rows[0];
    res.status(200).json({ ...row, unitario: Number(row.unitario), caixa: Number(row.caixa) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha ao atualizar produto' });
  }
};
