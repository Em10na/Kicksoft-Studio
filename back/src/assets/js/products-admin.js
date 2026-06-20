(function () {
  const API = '/api/products';
  const tableBody = document.getElementById('products-table-body');
  const alertBox = document.getElementById('products-alert');
  const form = document.getElementById('product-form');
  const modalEl = document.getElementById('productModal');
  const modalTitle = document.getElementById('productModalLabel');
  const statusEl = document.getElementById('db-status');
  let editingId = null;
  let modal = null;

  if (modalEl && window.bootstrap) {
    modal = new bootstrap.Modal(modalEl);
  }

  function showAlert(message, type) {
    if (!alertBox) return;
    alertBox.className = 'alert alert-' + type;
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
  }

  function formatPrice(value) {
    return '$' + Number(value || 0).toLocaleString('en-US');
  }

  async function checkHealth() {
    if (!statusEl) return;
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.ok) {
        statusEl.className = 'badge bg-success';
        statusEl.textContent = 'Supabase connecté';
      } else {
        statusEl.className = 'badge bg-warning';
        statusEl.textContent = data.message || 'Non configuré';
      }
    } catch {
      statusEl.className = 'badge bg-danger';
      statusEl.textContent = 'Serveur indisponible';
    }
  }

  async function loadProducts() {
    if (!tableBody) return;
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted">Chargement…</td></tr>';

    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      const products = await res.json();

      if (!products.length) {
        tableBody.innerHTML =
          '<tr><td colspan="6" class="text-center text-muted">Aucun produit. Ajoutez-en un.</td></tr>';
        return;
      }

      tableBody.innerHTML = products
        .map(function (p) {
          return (
            '<tr>' +
            '<td><img src="' +
            (p.image_url ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80') +
            '" width="48" height="48" class="rounded" alt="" style="object-fit:cover"></td>' +
            '<td class="fw-semibold">' +
            escapeHtml(p.name) +
            '</td>' +
            '<td>' +
            formatPrice(p.price) +
            '</td>' +
            '<td>' +
            (p.stock ?? 0) +
            '</td>' +
            '<td>' +
            escapeHtml(p.category || '—') +
            '</td>' +
            '<td class="text-end">' +
            '<button class="btn btn-sm btn-light me-1" data-edit="' +
            p.id +
            '">Modifier</button>' +
            '<button class="btn btn-sm btn-danger" data-delete="' +
            p.id +
            '">Supprimer</button>' +
            '</td>' +
            '</tr>'
          );
        })
        .join('');

      tableBody.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openForm(btn.getAttribute('data-edit'), products);
        });
      });
      tableBody.querySelectorAll('[data-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          deleteProduct(btn.getAttribute('data-delete'));
        });
      });
    } catch (err) {
      tableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-danger">' +
        escapeHtml(err.message) +
        '</td></tr>';
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openForm(id, products) {
    editingId = id || null;
    form.reset();
    document.getElementById('product-id').value = '';

    if (id && products) {
      const p = products.find(function (x) {
        return String(x.id) === String(id);
      });
      if (p) {
        modalTitle.textContent = 'Modifier le produit';
        document.getElementById('product-id').value = p.id;
        document.getElementById('product-name').value = p.name || '';
        document.getElementById('product-price').value = p.price || '';
        document.getElementById('product-compare').value = p.compare_price || '';
        document.getElementById('product-stock').value = p.stock ?? 0;
        document.getElementById('product-category').value = p.category || '';
        document.getElementById('product-image').value = p.image_url || '';
        document.getElementById('product-description').value = p.description || '';
      }
    } else {
      modalTitle.textContent = 'Nouveau produit';
    }

    modal && modal.show();
  }

  async function deleteProduct(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      const res = await fetch(API + '/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      showAlert('Produit supprimé.', 'success');
      loadProducts();
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('product-name').value.trim(),
        price: parseFloat(document.getElementById('product-price').value) || 0,
        compare_price:
          parseFloat(document.getElementById('product-compare').value) || null,
        stock: parseInt(document.getElementById('product-stock').value, 10) || 0,
        category: document.getElementById('product-category').value.trim() || null,
        image_url: document.getElementById('product-image').value.trim() || null,
        description:
          document.getElementById('product-description').value.trim() || null,
      };

      const id = document.getElementById('product-id').value;
      const url = id ? API + '/' + id : API;
      const method = id ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        modal && modal.hide();
        showAlert(id ? 'Produit mis à jour.' : 'Produit créé.', 'success');
        loadProducts();
      } catch (err) {
        showAlert(err.message, 'danger');
      }
    });
  }

  document.getElementById('btn-add-product') &&
    document.getElementById('btn-add-product').addEventListener('click', function () {
      openForm(null, []);
    });

  checkHealth();
  loadProducts();
})();
