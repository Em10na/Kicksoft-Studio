"use client";

import Link from "next/link";
import WishlistButton from "./WishlistButton";

type Props = {
  id: string;
  title: string;
  price: number;
  compare_price?: number | null;
  stock: number;
  image_url?: string | null;
  badge?: string | null;
  loyalty_points?: number;
};

export default function ProductCard({ id, title, price, compare_price, stock, image_url }: Props) {
  const img = image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80&auto=format&fit=crop";

  function openDrawer(e: React.MouseEvent) {
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("quickadd", {
        detail: { id, title, price, compare_price, image_url: img, stock },
      })
    );
  }

  return (
    <article className="product-card">
      {/* Image flush — pas de padding sur la carte */}
      <div className="img-wrap" onClick={openDrawer}>
        <span onClick={(e) => e.stopPropagation()}>
          <WishlistButton productId={id} className="wishlist" />
        </span>
        <img src={img} alt={title} />
        <div className="card-quick-view" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Aperçu rapide
        </div>
      </div>
      {/* Infos sous l'image */}
      <div className="card-info">
        <div className="stock">
          <span className="dot"></span>
          {stock > 0 ? `En stock - ${stock} articles` : "Rupture de stock"}
        </div>
        <Link href={`/produit/${id}`} className="name">{title}</Link>
        <div className="price">
          <span className="now">{price} DT</span>
        </div>
      </div>
    </article>
  );
}
