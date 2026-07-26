/**
 * UI: all DOM reads/writes live here. Renders cards, chips, splash and the
 * update toast. Product data always flows in as arguments — this module
 * never fetches or filters on its own.
 */
const UI = (() => {
  const dom = {
    splash: document.getElementById('splash-screen'),
    resultCount: document.getElementById('result-count'),
    groups: document.getElementById('category-groups'),
    emptyState: document.getElementById('empty-state'),
    historyRow: document.getElementById('history-row'),
    categoryRow: document.getElementById('category-row'),
    updateToast: document.getElementById('update-toast'),
    updateToastBtn: document.getElementById('update-toast-btn'),
    updateToastClose: document.getElementById('update-toast-close'),
    favoritesToggle: document.getElementById('favorites-toggle'),
  };

  const ICON_STAR = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
  const ICON_BOTTLE = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6v3.5l1.5 2.5v12a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V8l1.5-2.5V2Z"></path><path d="M9 9h6"></path></svg>';
  const ICON_SEARCH_EMPTY = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
  const ICON_HISTORY = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 16 14"></polyline></svg>';

  function hideSplash() {
    if (!dom.splash) return;
    dom.splash.classList.add('is-hidden');
    setTimeout(() => dom.splash.remove(), 500);
  }

  function createCard(product, { isFavorite, onToggleFavorite }) {
    const card = document.createElement('article');
    card.className = 'product-card';

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'product-fav' + (isFavorite ? ' is-active' : '');
    favBtn.setAttribute('aria-label', isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    favBtn.innerHTML = ICON_STAR;
    favBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      onToggleFavorite(product.id);
    });
    card.appendChild(favBtn);

    const media = document.createElement('div');
    media.className = 'product-media';
    if (product.imagem) {
      const img = document.createElement('img');
      img.src = product.imagem;
      img.alt = product.nome;
      img.loading = 'lazy';
      media.appendChild(img);
    } else {
      media.innerHTML = ICON_BOTTLE;
    }
    card.appendChild(media);

    const categoria = document.createElement('div');
    categoria.className = 'product-category';
    categoria.textContent = product.categoria || '';
    card.appendChild(categoria);

    const nome = document.createElement('h3');
    nome.className = 'product-name';
    nome.textContent = product.nome;
    card.appendChild(nome);

    if (product.embalagem || product.marca) {
      const meta = document.createElement('div');
      meta.className = 'product-meta';
      meta.textContent = [product.marca, product.embalagem].filter(Boolean).join(' · ');
      card.appendChild(meta);
    }

    const prices = document.createElement('div');
    prices.className = 'product-prices';

    const unit = document.createElement('div');
    unit.className = 'price-block unitario';
    unit.innerHTML = '<span class="price-label">Unidade</span>';
    const unitValue = document.createElement('span');
    unitValue.className = 'price-value';
    unitValue.textContent = Utils.formatCurrency(product.unitario);
    unit.appendChild(unitValue);

    const box = document.createElement('div');
    box.className = 'price-block caixa';
    box.innerHTML = '<span class="price-label">Caixa</span>';
    const boxValue = document.createElement('span');
    boxValue.className = 'price-value';
    boxValue.textContent = Utils.formatCurrency(product.caixa);
    box.appendChild(boxValue);

    prices.appendChild(unit);
    prices.appendChild(box);
    card.appendChild(prices);

    return card;
  }

  function renderResults(products, { grouped, onToggleFavorite }) {
    dom.groups.innerHTML = '';
    dom.resultCount.textContent = `${products.length} produto${products.length === 1 ? '' : 's'} encontrado${products.length === 1 ? '' : 's'}`;
    dom.emptyState.classList.toggle('is-visible', products.length === 0);

    if (products.length === 0) return;

    const fragment = document.createDocumentFragment();

    if (grouped) {
      const byCategory = new Map();
      products.forEach((p) => {
        const key = p.categoria || 'Outros';
        if (!byCategory.has(key)) byCategory.set(key, []);
        byCategory.get(key).push(p);
      });

      Array.from(byCategory.keys())
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .forEach((categoria) => {
          const items = byCategory.get(categoria);
          const section = document.createElement('section');
          section.className = 'category-group';

          const heading = document.createElement('div');
          heading.className = 'category-heading';
          heading.innerHTML = `<h2>${escapeHtml(categoria)}</h2><span class="count">${items.length}</span>`;
          section.appendChild(heading);

          const grid = document.createElement('div');
          grid.className = 'product-grid';
          items.forEach((product) => {
            grid.appendChild(
              createCard(product, { isFavorite: Storage.isFavorite(product.id), onToggleFavorite })
            );
          });
          section.appendChild(grid);
          fragment.appendChild(section);
        });
    } else {
      const grid = document.createElement('div');
      grid.className = 'product-grid';
      products.forEach((product) => {
        grid.appendChild(
          createCard(product, { isFavorite: Storage.isFavorite(product.id), onToggleFavorite })
        );
      });
      fragment.appendChild(grid);
    }

    dom.groups.appendChild(fragment);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderCategoryChips(categorias, activeCategoria, onSelect) {
    dom.categoryRow.innerHTML = '';
    const all = ['Todos', ...categorias.sort((a, b) => a.localeCompare(b, 'pt-BR'))];
    all.forEach((categoria) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (categoria === activeCategoria ? ' is-active' : '');
      chip.textContent = categoria;
      chip.addEventListener('click', () => onSelect(categoria));
      dom.categoryRow.appendChild(chip);
    });
  }

  function renderHistoryChips(history, query, onSelect) {
    dom.historyRow.innerHTML = '';
    if (query || history.length === 0) {
      dom.historyRow.style.display = 'none';
      return;
    }
    dom.historyRow.style.display = 'flex';
    history.slice(0, 8).forEach((term) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip chip-history';
      chip.innerHTML = `${ICON_HISTORY}<span></span>`;
      chip.querySelector('span').textContent = term;
      chip.addEventListener('click', () => onSelect(term));
      dom.historyRow.appendChild(chip);
    });
  }

  function setSearchClearVisible(visible) {
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) clearBtn.classList.toggle('is-visible', visible);
  }

  function setFavoritesToggleActive(active) {
    if (!dom.favoritesToggle) return;
    dom.favoritesToggle.classList.toggle('is-active', active);
    dom.favoritesToggle.setAttribute('aria-pressed', String(active));
  }

  function showUpdateToast(onUpdate) {
    if (!dom.updateToast) return;
    dom.updateToast.classList.add('is-visible');
    const handleUpdate = () => {
      dom.updateToastBtn.removeEventListener('click', handleUpdate);
      onUpdate();
    };
    dom.updateToastBtn.addEventListener('click', handleUpdate);
    dom.updateToastClose.addEventListener('click', () => {
      dom.updateToast.classList.remove('is-visible');
    });
  }

  function initEmptyStateIcon() {
    if (dom.emptyState && !dom.emptyState.querySelector('svg')) {
      const icon = document.createElement('div');
      icon.innerHTML = ICON_SEARCH_EMPTY;
      dom.emptyState.prepend(icon.firstElementChild);
    }
  }

  return {
    hideSplash,
    renderResults,
    renderCategoryChips,
    renderHistoryChips,
    setSearchClearVisible,
    setFavoritesToggleActive,
    showUpdateToast,
    initEmptyStateIcon,
  };
})();
