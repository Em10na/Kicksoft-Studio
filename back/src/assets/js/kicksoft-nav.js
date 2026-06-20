(function () {
  const FRONT_URL = '/front/index.html';
  const PRODUCTS_URL = './products.html';

  const sidebar = document.getElementById('sidebarnav');
  if (sidebar && !sidebar.querySelector('[data-kicksoft-nav]')) {
    const cap = document.createElement('li');
    cap.className = 'nav-small-cap';
    cap.setAttribute('data-kicksoft-nav', '');
    cap.innerHTML =
      '<i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Kicksoft</span>';

    const products = document.createElement('li');
    products.className = 'sidebar-item';
    products.innerHTML =
      '<a class="sidebar-link" href="' +
      PRODUCTS_URL +
      '"><span><i class="ti ti-shopping-bag"></i></span><span class="hide-menu">Produits</span></a>';

    const front = document.createElement('li');
    front.className = 'sidebar-item';
    front.innerHTML =
      '<a class="sidebar-link" href="' +
      FRONT_URL +
      '"><span><i class="ti ti-building-store"></i></span><span class="hide-menu">Boutique (Front)</span></a>';

    const dashboard = sidebar.querySelector('.sidebar-item');
    if (dashboard) {
      dashboard.after(cap, products, front);
    } else {
      sidebar.prepend(cap, products, front);
    }

    if (location.pathname.endsWith('/products.html')) {
      products.querySelector('.sidebar-link').classList.add('active');
    }
  }

  const headerBtn = document.querySelector('.app-header .btn-primary[href*="adminmart"]');
  if (headerBtn) {
    headerBtn.href = FRONT_URL;
    headerBtn.textContent = 'Voir la boutique';
    headerBtn.classList.replace('btn-primary', 'btn-outline-primary');
  }
})();
