import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "4rem", fontWeight: 800, color: "#4F46E5", marginBottom: "0.5rem" }}>404</h1>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Page introuvable</h2>
        <p style={{ color: "#6c757d", marginBottom: "1.5rem" }}>La page que vous recherchez n&apos;existe pas ou a ete deplacee.</p>
        <Link href="/" style={{ padding: "10px 24px", background: "#4F46E5", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "14px" }}>
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
