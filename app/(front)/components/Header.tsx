import Link from "next/link";

export default function Header() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="utility">
        <div className="container">
          <span className="promo">
            <span className="tag">PROMO</span>
            Livraison gratuite des 50 DT - Retours sous 30 jours
          </span>
          <span className="links">
            <Link href="/support">Aide</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/admin">Administration</Link>
          </span>
        </div>
      </div>

      <header className="site-header">
        <div className="container">
          <Link href="/" className="brand">
            <span className="brand-mark">K</span> Kicksoft
          </Link>

          <form className="search" role="search" action="/boutique">
            <input
              type="text"
              name="q"
              placeholder="Rechercher des produits, marques, categories..."
              aria-label="Rechercher"
            />
            <button type="submit" aria-label="Rechercher">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
          </form>

          <div className="icon-row">
            <Link href="/compte" className="icon-btn" aria-label="Mon compte">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
              </svg>
            </Link>
            <Link href="/panier" className="icon-btn icon-btn--cart" aria-label="Panier">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2l-2 5v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-5z" />
                <path d="M4 7h16" />
                <path d="M16 11a4 4 0 0 1-8 0" />
              </svg>
            </Link>
            <button className="nav-toggle" aria-label="Ouvrir le menu" aria-expanded="false">&#x2261;</button>
          </div>
        </div>
      </header>

      <nav className="nav-bar" aria-label="Primary">
        <div className="container">
          <Link href="/boutique" className="all-cats">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Categories
          </Link>
          <div className="main-nav">
            <Link href="/">Accueil</Link>
            <Link href="/boutique">Boutique</Link>
            <Link href="/solutions">Solutions</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/a-propos">A propos</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <span className="nav-cta"><Link href="/devis" style={{ color: "inherit", textDecoration: "none" }}>DEMANDER UN <strong>DEVIS</strong></Link></span>
        </div>
      </nav>

      <div className="drawer" id="drawer" aria-hidden="true">
        <div className="drawer-head">
          <Link href="/" className="brand"><span className="brand-mark">K</span> Kicksoft</Link>
          <button className="drawer-close" aria-label="Fermer">Close &#x2715;</button>
        </div>
        <Link href="/">Accueil</Link>
        <Link href="/boutique">Boutique</Link>
        <Link href="/solutions">Solutions</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/a-propos">A propos</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/support">Support</Link>
        <Link href="/devis">Demander un devis</Link>
        <Link href="/panier" className="btn btn--indigo" style={{ marginTop: "var(--s5)", justifyContent: "center" }}>Voir le panier &rarr;</Link>
      </div>
    </>
  );
}
