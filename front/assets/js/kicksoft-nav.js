(function () {
  const ADMIN_URL = '/back/html/index.html';

  const utilityLinks = document.querySelector('.utility .links');
  if (utilityLinks && !utilityLinks.querySelector('[data-kicksoft-admin]')) {
    const link = document.createElement('a');
    link.href = ADMIN_URL;
    link.textContent = 'Administration';
    link.setAttribute('data-kicksoft-admin', '');
    utilityLinks.insertBefore(link, utilityLinks.firstChild);
  }

  const mainNav = document.querySelector('.main-nav');
  if (mainNav && !mainNav.querySelector('[data-kicksoft-admin]')) {
    const link = document.createElement('a');
    link.href = ADMIN_URL;
    link.textContent = 'Admin';
    link.setAttribute('data-kicksoft-admin', '');
    mainNav.appendChild(link);
  }

  const drawer = document.getElementById('drawer');
  if (drawer && !drawer.querySelector('[data-kicksoft-admin]')) {
    const link = document.createElement('a');
    link.href = ADMIN_URL;
    link.textContent = 'Administration';
    link.setAttribute('data-kicksoft-admin', '');
    link.className = 'btn btn--indigo';
    link.style.marginTop = 'var(--s4)';
    link.style.justifyContent = 'center';
    drawer.appendChild(link);
  }
})();
