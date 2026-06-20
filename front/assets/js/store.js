(function () {
  const grid = document.getElementById('shop-grid');
  const countEl = document.querySelector('.shop-toolbar .count');
  if (!grid) return;

  function formatPrice(value) {
    return '$' + Number(value || 0).toLocaleString('en-US');
  }

  function renderProduct(p) {
    const onSale = p.compare_price && p.compare_price > p.price;
    const img =
      p.image_url ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80&auto=format&fit=crop';

    return (
      '<article class="product-card">' +
      '<div class="img-wrap">' +
      (onSale ? '<span class="badge badge--sale">Sale</span>' : '') +
      '<button class="wishlist" aria-label="Wishlist">♡</button>' +
      '<img src="' +
      img +
      '" alt="' +
      escapeAttr(p.name) +
      '" />' +
      '</div>' +
      '<div class="stock"><span class="dot"></span>In stock · ' +
      (p.stock ?? 0) +
      ' items</div>' +
      '<a href="product.html?id=' +
      encodeURIComponent(p.id) +
      '" class="name">' +
      escapeHtml(p.name) +
      '</a>' +
      '<div class="price"><span class="now">' +
      formatPrice(p.price) +
      '</span>' +
      (onSale
        ? '<span class="was">' + formatPrice(p.compare_price) + '</span>'
        : '') +
      '</div>' +
      '<div class="stars">★★★★★ <span class="count">(—)</span></div>' +
      '<a href="cart.html" class="btn">Order now →</a>' +
      '</article>'
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  async function loadProducts() {
    grid.innerHTML =
      '<p style="grid-column:1/-1;text-align:center;color:var(--fg-mute)">Chargement des produits…</p>';

    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      const products = await res.json();

      if (!products.length) {
        grid.innerHTML =
          '<p style="grid-column:1/-1;text-align:center;color:var(--fg-mute)">Aucun produit dans Supabase. Ajoutez-en depuis l\'administration.</p>';
        if (countEl) countEl.textContent = '0 produit';
        return;
      }

      grid.innerHTML = products.map(renderProduct).join('');
      if (countEl) {
        countEl.textContent =
          'Showing 1 – ' + products.length + ' of ' + products.length + ' products';
      }
    } catch (err) {
      grid.innerHTML =
        '<p style="grid-column:1/-1;text-align:center;color:var(--rose)">Impossible de charger les produits : ' +
        escapeHtml(err.message) +
        '</p>';
    }
  }

  loadProducts();
})();
