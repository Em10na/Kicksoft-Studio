import Script from "next/script";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="stylesheet" href="/assets/css/styles.min.css" />
      <div
        className="page-wrapper"
        id="main-wrapper"
        data-layout="vertical"
        data-navbarbg="skin6"
        data-sidebartype="full"
        data-sidebar-position="fixed"
        data-header-position="fixed"
      >
        <aside className="left-sidebar">
          <div>
            <div className="brand-logo d-flex align-items-center justify-content-between">
              <a href="/admin" className="text-nowrap logo-img">
                <span style={{ fontSize: "24px", fontWeight: "bold", color: "#5d87ff" }}>
                  KICKSOFT
                </span>
              </a>
            </div>
            <nav className="sidebar-nav scroll-sidebar" data-simplebar="">
              <ul id="sidebarnav">
                <li className="nav-small-cap">
                  <i className="ti ti-dots nav-small-cap-icon fs-4"></i>
                  <span className="hide-menu">HOME</span>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin">
                    <span><i className="ti ti-layout-dashboard"></i></span>
                    <span className="hide-menu">Dashboard</span>
                  </a>
                </li>
                <li className="nav-small-cap">
                  <i className="ti ti-dots nav-small-cap-icon fs-4"></i>
                  <span className="hide-menu">KICKSOFT</span>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin/produits">
                    <span><i className="ti ti-package"></i></span>
                    <span className="hide-menu">Produits</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin/categories">
                    <span><i className="ti ti-category"></i></span>
                    <span className="hide-menu">Categories</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin/commandes">
                    <span><i className="ti ti-shopping-cart"></i></span>
                    <span className="hide-menu">Commandes</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin/devis">
                    <span><i className="ti ti-file-invoice"></i></span>
                    <span className="hide-menu">Devis</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin/fidelite">
                    <span><i className="ti ti-star"></i></span>
                    <span className="hide-menu">Fidelite</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin/utilisateurs">
                    <span><i className="ti ti-users"></i></span>
                    <span className="hide-menu">Utilisateurs</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin/contenu">
                    <span><i className="ti ti-file-text"></i></span>
                    <span className="hide-menu">Contenu</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin/medias">
                    <span><i className="ti ti-photo"></i></span>
                    <span className="hide-menu">Medias</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/admin/accueil">
                    <span><i className="ti ti-home"></i></span>
                    <span className="hide-menu">Page accueil</span>
                  </a>
                </li>
                <li className="nav-small-cap">
                  <i className="ti ti-dots nav-small-cap-icon fs-4"></i>
                  <span className="hide-menu">AUTH</span>
                </li>
                <li className="sidebar-item">
                  <a className="sidebar-link" href="/api/auth/signout">
                    <span><i className="ti ti-logout"></i></span>
                    <span className="hide-menu">Deconnexion</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        <div className="body-wrapper">
          <header className="app-header">
            <nav className="navbar navbar-expand-lg navbar-light">
              <ul className="navbar-nav">
                <li className="nav-item d-block d-xl-none">
                  <a className="nav-link sidebartoggler nav-icon-hover" href="#">
                    <i className="ti ti-menu-2"></i>
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link nav-icon-hover" href="#">
                    <i className="ti ti-bell-ringing"></i>
                    <div className="notification bg-primary rounded-circle"></div>
                  </a>
                </li>
              </ul>
              <div className="navbar-collapse justify-content-end px-0">
                <ul className="navbar-nav flex-row ms-auto align-items-center justify-content-end">
                  <a href="/" className="btn btn-primary me-3">
                    Voir la boutique
                  </a>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link nav-icon-hover"
                      href="#"
                      id="drop2"
                      data-bs-toggle="dropdown"
                    >
                      <div
                        style={{
                          width: 35,
                          height: 35,
                          borderRadius: "50%",
                          background: "#5d87ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      >
                        A
                      </div>
                    </a>
                    <div className="dropdown-menu dropdown-menu-end dropdown-menu-animate-up">
                      <div className="message-body">
                        <a
                          href="/api/auth/signout"
                          className="btn btn-outline-primary mx-3 mt-2 d-block"
                        >
                          Deconnexion
                        </a>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </nav>
          </header>
          <div className="container-fluid">{children}</div>
        </div>
      </div>

      <Script src="/assets/libs/jquery/dist/jquery.min.js" strategy="afterInteractive" />
      <Script src="/assets/libs/bootstrap/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/sidebarmenu.js" strategy="lazyOnload" />
      <Script src="/assets/js/app.min.js" strategy="lazyOnload" />
      <Script src="/assets/libs/apexcharts/dist/apexcharts.min.js" strategy="lazyOnload" />
      <Script src="/assets/libs/simplebar/dist/simplebar.js" strategy="lazyOnload" />
    </>
  );
}
