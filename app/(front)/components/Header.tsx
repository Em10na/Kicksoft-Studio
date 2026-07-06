import Link from "next/link";
import CartCount from "./CartCount";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import HeaderSearch from "./HeaderSearch";
import NotificationBell from "./NotificationBell";
import SideMenu from "./SideMenu";

export default function Header() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="site-header site-header--compact">
        <div className="container">
          <Link href="/" className="brand" aria-label="DJI Store TN — Accueil">
            <img src="/assets/images/logos/logo-store.png" alt="DJI Store TN" className="brand-logo" />
          </Link>

          <nav className="main-nav" aria-label="Primary">
            <Link href="/">Accueil</Link>
            <Link href="/boutique">Boutique</Link>
            <Link href="/a-propos">A propos</Link>
            <Link href="/contact">Contact</Link>
          </nav>

          <div className="icon-row">
            <LanguageSwitcher />
            <HeaderSearch />
            <NotificationBell />
            <ThemeToggle />
            <Link href="/compte/favoris" className="icon-btn" aria-label="Mes favoris">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>
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
              <CartCount />
            </Link>
            <SideMenu />
          </div>
        </div>
      </header>
    </>
  );
}
