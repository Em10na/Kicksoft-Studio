// Seed de test : 3 produits soldés (avec solde_hero) + médias.
// Usage : node scripts/seed-soldes-test.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const PRODUITS = [
  {
    title: "Drone Explorer 4K [TEST]",
    slug: "drone-explorer-4k-test",
    price: 1499,
    compare_price: 1999,
    stock: 12,
    status: "published",
    solde_hero: true,
    short_description: "Capteur 4K HDR, 42 min d'autonomie, portée 12 km — le compagnon idéal de vos aventures aériennes.",
    image_url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=90&auto=format&fit=crop",
    loyalty_points: 0,
    display_order: 90,
    media: [
      { type: "video", url: "https://videos.pexels.com/video-files/2890196/2890196-hd_1920_1080_30fps.mp4" },
      { type: "image", url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=90&auto=format&fit=crop" },
    ],
  },
  {
    title: "Caméra Action X6 Pro [TEST]",
    slug: "camera-action-x6-pro-test",
    price: 649,
    compare_price: 899,
    stock: 4, // volontairement bas pour tester l'alerte stock faible (≤ 5)
    status: "published",
    solde_hero: true,
    short_description: "5.3K à 60 i/s, stabilisation HyperSteady, étanche 10 m sans caisson.",
    image_url: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=1920&q=90&auto=format&fit=crop",
    loyalty_points: 0,
    display_order: 91,
    media: [
      { type: "image", url: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=1920&q=90&auto=format&fit=crop" },
    ],
  },
  {
    title: "Gimbal Stabilisateur S3 [TEST]",
    slug: "gimbal-stabilisateur-s3-test",
    price: 379,
    compare_price: 459,
    stock: 8,
    status: "published",
    solde_hero: true,
    short_description: "Stabilisation 3 axes, suivi intelligent du sujet, 14 h d'autonomie.",
    image_url: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1920&q=90&auto=format&fit=crop",
    loyalty_points: 0,
    display_order: 92,
    media: [
      { type: "image", url: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1920&q=90&auto=format&fit=crop" },
    ],
  },
];

// Catégorie existante au hasard (facultatif)
const { data: cats } = await supabase.from("categories").select("id, name").limit(3);

for (const [i, p] of PRODUITS.entries()) {
  const { media, ...produit } = p;
  produit.category_id = cats?.[i % (cats.length || 1)]?.id ?? null;

  // Évite les doublons si le script est relancé
  const { data: existant } = await supabase.from("products").select("id").eq("slug", produit.slug).maybeSingle();
  if (existant) {
    console.log(`= existe déjà : ${produit.title}`);
    continue;
  }

  const { data, error } = await supabase.from("products").insert(produit).select("id").single();
  if (error) {
    console.error(`✗ ${produit.title} : ${error.message}`);
    continue;
  }

  const medias = media.map((m, pos) => ({ product_id: data.id, url: m.url, type: m.type, position: pos }));
  const { error: mediaErr } = await supabase.from("product_media").insert(medias);
  console.log(`✓ ${produit.title} (id ${data.id.slice(0, 8)}, ${medias.length} média(s)${mediaErr ? " — ERREUR médias : " + mediaErr.message : ""})`);
}

console.log("\nSeed terminé. Ouvrez la page d'accueil : le slider doit afficher les 3 articles soldés.");
