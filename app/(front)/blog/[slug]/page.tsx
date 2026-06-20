import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span>{" "}
            <Link href="/blog">Blog</Link> <span className="sep">&rsaquo;</span>{" "}
            <span>{post.title}</span>
          </div>
          <h1>{post.title}</h1>
          <p style={{ fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>
            Publie le {new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "760px" }}>
          <div style={{ fontSize: "var(--text-base)", lineHeight: "1.8", color: "var(--fg-soft)", whiteSpace: "pre-wrap" }}>
            {post.content}
          </div>
          <div style={{ marginTop: "var(--s8)", paddingTop: "var(--s6)", borderTop: "1px solid var(--rule)", display: "flex", gap: "var(--s3)" }}>
            <Link href="/blog" className="btn btn--ghost">&larr; Retour au blog</Link>
            <Link href="/boutique" className="btn btn--indigo">Voir nos produits &rarr;</Link>
          </div>
        </div>
      </section>
    </>
  );
}
