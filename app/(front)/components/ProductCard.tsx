import Link from "next/link";
import WishlistButton from "./WishlistButton";

// Carte volontairement épurée : prix courant uniquement — pas de prix
// barré, badge promo ni points fidélité ajoutés par défaut.
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

export default function ProductCard({ id, title, price, stock, image_url }: Props) {
  const img = image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80&auto=format&fit=crop";

  return (
    <article className="product-card">
      <div className="img-wrap">
        <WishlistButton productId={id} className="wishlist" />
        <img src={img} alt={title} />
      </div>
      <div className="stock">
        <span className="dot"></span>
        {stock > 0 ? `En stock - ${stock} articles` : "Rupture de stock"}
      </div>
      <Link href={`/produit/${id}`} className="name">{title}</Link>
      <div className="price">
        <span className="now">{price} DT</span>
      </div>
    </article>
  );
}
