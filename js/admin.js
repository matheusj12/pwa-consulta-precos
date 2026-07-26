/**
 * Painel /admin: lista todos os produtos, permite editar preço (unitário e
 * caixa) e trocar a imagem. Salva direto no banco via /api/admin/produtos
 * e /api/admin/upload. Sem autenticação (decisão de produto).
 */
(() => {
  const listEl = document.getElementById('admin-list');
  const countEl = document.getElementById('admin-count');
  const searchEl = document.getElementById('admin-search');

  let produtos = [];

  function normalize(str) {
    return (str || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  async function loadProdutos() {
    const res = await fetch('/api/admin/produtos');
    if (!res.ok) throw new Error('Falha ao carregar produtos');
    produtos = await res.json();
  }

  function render(filterText) {
    const term = normalize(filterText);
    const filtered = term
      ? produtos.filter((p) => normalize(`${p.nome} ${p.categoria} ${p.marca} ${p.embalagem}`).includes(term))
      : produtos;

    countEl.textContent = `${filtered.length} de ${produtos.length} produtos`;
    listEl.innerHTML = '';

    const fragment = document.createDocumentFragment();
    filtered.forEach((p) => fragment.appendChild(renderRow(p)));
    listEl.appendChild(fragment);
  }

  function setStatus(statusEl, state, text) {
    statusEl.textContent = text;
    statusEl.className = `admin-status ${state}`;
  }

  async function saveField(id, field, value, statusEl) {
    setStatus(statusEl, 'saving', 'Salvando...');
    try {
      const res = await fetch('/api/admin/produtos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao salvar');
      }
      const updated = await res.json();
      const idx = produtos.findIndex((p) => p.id === id);
      if (idx !== -1) produtos[idx] = updated;
      setStatus(statusEl, 'saved', 'Salvo ✓');
    } catch (err) {
      setStatus(statusEl, 'error', err.message);
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(file, product, thumbImg, statusEl) {
    setStatus(statusEl, 'saving', 'Enviando imagem...');
    try {
      const dataBase64 = await fileToBase64(file);
      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, dataBase64 }),
      });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao enviar imagem');
      }
      const { url } = await uploadRes.json();
      thumbImg.src = url;
      await saveField(product.id, 'imagem', url, statusEl);
    } catch (err) {
      setStatus(statusEl, 'error', err.message);
    }
  }

  function renderRow(product) {
    const row = document.createElement('div');
    row.className = 'admin-row';

    const thumb = document.createElement('div');
    thumb.className = 'admin-thumb';
    if (product.imagem) {
      const img = document.createElement('img');
      img.src = product.imagem;
      img.alt = '';
      thumb.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'admin-thumb-placeholder';
      placeholder.textContent = 'sem foto';
      thumb.appendChild(placeholder);
    }
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    thumb.appendChild(fileInput);
    row.appendChild(thumb);

    const info = document.createElement('div');
    info.className = 'admin-info';
    const nome = document.createElement('div');
    nome.className = 'nome';
    nome.textContent = product.nome;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = [product.categoria, product.marca, product.embalagem].filter(Boolean).join(' · ');
    info.appendChild(nome);
    info.appendChild(meta);
    row.appendChild(info);

    const statusEl = document.createElement('div');
    statusEl.className = 'admin-status';

    const unitField = createPriceField('Unidade', product.unitario, (value) =>
      saveField(product.id, 'unitario', value, statusEl)
    );
    const caixaField = createPriceField('Caixa', product.caixa, (value) =>
      saveField(product.id, 'caixa', value, statusEl)
    );

    row.appendChild(unitField);
    row.appendChild(caixaField);
    row.appendChild(statusEl);

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) handleImageUpload(file, product, thumb.querySelector('img') || thumb, statusEl);
    });

    return row;
  }

  function createPriceField(label, value, onSave) {
    const field = document.createElement('div');
    field.className = 'admin-field';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.min = '0';
    input.value = value;
    input.addEventListener('change', () => {
      const num = parseFloat(input.value);
      if (Number.isFinite(num) && num >= 0) onSave(num);
    });
    field.appendChild(labelEl);
    field.appendChild(input);
    return field;
  }

  async function init() {
    listEl.textContent = 'Carregando...';
    try {
      await loadProdutos();
      render('');
    } catch (err) {
      listEl.textContent = `Erro: ${err.message}`;
      return;
    }

    searchEl.addEventListener('input', debounce((e) => render(e.target.value), 120));
  }

  init();
})();
