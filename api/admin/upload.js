const { put } = require('@vercel/blob');

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Admin image upload — receives base64 JSON rather than multipart/form-data
 * so body parsing stays predictable across Vercel's Node runtime (it always
 * parses application/json automatically; raw multipart parsing is not).
 * Body: { filename: string, contentType: string, dataBase64: string }
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { filename, contentType, dataBase64 } = req.body || {};

  if (!filename || typeof filename !== 'string') {
    res.status(400).json({ error: 'filename é obrigatório' });
    return;
  }
  if (!contentType || !contentType.startsWith('image/')) {
    res.status(400).json({ error: 'contentType deve ser image/*' });
    return;
  }
  if (!dataBase64 || typeof dataBase64 !== 'string') {
    res.status(400).json({ error: 'dataBase64 é obrigatório' });
    return;
  }

  let buffer;
  try {
    buffer = Buffer.from(dataBase64, 'base64');
  } catch (err) {
    res.status(400).json({ error: 'dataBase64 inválido' });
    return;
  }

  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    res.status(400).json({ error: `Imagem deve ter entre 1 byte e ${MAX_BYTES} bytes` });
    return;
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');

  try {
    const blob = await put(`produtos/${Date.now()}-${safeName}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha ao enviar imagem' });
  }
};
