import Link from "next/link";

type Props = {
  id: string;
  title: string;
  price: number;
  compare_price?: number | null;
  stock: number;
  image_url?: string | null;
  badge?: string | null;
};

export default function ProductCard({ id, title, price, compare_price, stock, image_url, badge }: Props) {
  const onSale = compare_price && compare_price > price;
  const img = image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80&auto=format&fit=crop";

  return (
    <article className="product-card">
      <div className="img-wrap">
        {badge && <span className={`badge ${badge === "Sale" ? "badge--sale" : ""}`}>{badge}</span>}
        {onSale && !badge && <span className="badge badge--sale">Promo</span>}
        <button className="wishlist" aria-label="Favoris">&#x2661;</button>
        <img src={img} alt={title} />
      </div>
      <div className="stock">
        <span className="dot"></span>
        {stock > 0 ? `En stock - ${stock} articles` : "Rupture de stock"}
      </div>
      <Link href={`/produit/${id}`} className="name">{title}</Link>
      <div className="price">
        <span className="now">{price} DT</span>
        {onSale && <span className="was">{compare_price} DT</span>}
      </div>
      <Link href={`/produit/${id}`} className="btn">Voir le produit &rarr;</Link>
    </article>
  );
}
