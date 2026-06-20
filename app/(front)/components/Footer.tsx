import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="mark"><span className="brand-mark">K</span> Kicksoft</div>
            <p>Kicksoft Studio — solutions tech et gadgets, livraison rapide, support reactif. Votre partenaire e-commerce de confiance.</p>
            <div className="socials" style={{ marginTop: "var(--s4)" }}>
              <a href="#" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.8a8.5 8.5 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.4 8.4 0 0 1-2.6 1 4.2 4.2 0 0 0-7.2 3.8A11.9 11.9 0 0 1 3 4.8a4.2 4.2 0 0 0 1.3 5.6 4.2 4.2 0 0 1-1.9-.5v.1a4.2 4.2 0 0 0 3.4 4.1 4.2 4.2 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9A8.4 8.4 0 0 1 2 18.7 11.9 11.9 0 0 0 8.5 21c7.7 0 11.9-6.4 11.9-11.9v-.5A8.5 8.5 0 0 0 22 5.8z" /></svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Boutique</h4>
            <ul>
              <li><Link href="/boutique">Tous les produits</Link></li>
              <li><Link href="/solutions">Solutions pro</Link></li>
              <li><Link href="/comparer">Comparer</Link></li>
              <li><Link href="/devis">Demander un devis</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Aide</h4>
            <ul>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/support">Support</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/garantie">Garantie</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Ressources</h4>
            <ul>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/revendeurs">Revendeurs</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Informations</h4>
            <ul>
              <li><Link href="/a-propos">A propos</Link></li>
              <li><Link href="/cgv">CGV</Link></li>
              <li><Link href="/garantie">Politique de garantie</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Kicksoft Studio - Tous droits reserves</span>
        </div>
      </div>
    </footer>
  );
}
