import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Blog - DJI Store TN" };

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>Blog</span>
          </div>
          <h1>Blog &amp; Actualites</h1>
          <p>Lancements, demonstrations, conseils d&apos;utilisation et actualites tech.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {posts && posts.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--s6)" }}>
              {posts.map((post) => (
                <article key={post.id} style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", overflow: "hidden" }}>
                  <div style={{ padding: "var(--s6)" }}>
                    <div style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)", marginBottom: "var(--s2)" }}>
                      {new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s3)" }}>
                      <Link href={`/blog/${post.slug}`} style={{ color: "var(--ink)", textDecoration: "none" }}>
                        {post.title}
                      </Link>
                    </h3>
                    <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.6", marginBottom: "var(--s4)" }}>
                      {post.content ? post.content.slice(0, 150) + "..." : ""}
                    </p>
                    <Link href={`/blog/${post.slug}`} className="shop-now" style={{ color: "var(--indigo)" }}>
                      Lire la suite
                      <svg width="12" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "var(--fg-mute)", padding: "var(--s8) 0" }}>
              Aucun article pour le moment. Revenez bientot !
            </p>
          )}
        </div>
      </section>
    </>
  );
}
