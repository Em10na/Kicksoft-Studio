import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ================================================================
// Visual Search — receives category terms detected by the
// client-side image classifier (MobileNet) and returns
// matching products from the catalog.
// ================================================================

const ALLOWED_TERMS = new Set([
  "drone", "camera", "gimbal", "stabilisateur", "micro", "audio",
  "action", "batterie", "eclairage", "sac", "filtre", "accessoire",
]);

export async function POST(request: NextRequest) {
  let body: { terms?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }

  const terms = (body.terms ?? [])
    .map((t) => t.toLowerCase().trim())
    .filter((t) => ALLOWED_TERMS.has(t))
    .slice(0, 5);

  if (terms.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const supabase = createAdminClient();

  // Matche aussi les catégories dont le nom contient un des termes détectés
  const { data: cats } = await supabase.from("categories").select("id, name");
  const catIds = (cats ?? [])
    .filter((c) => terms.some((t) => c.name.toLowerCase().includes(t)))
    .map((c) => c.id);

  const orParts = terms.map((t) => `title.ilike.%${t}%,short_description.ilike.%${t}%`);
  if (catIds.length > 0) orParts.push(`category_id.in.(${catIds.join(",")})`);
  const orFilter = orParts.join(",");

  const { data: products, error } = await supabase
    .from("products")
    .select("id, title, price, compare_price, image_url, stock")
    .eq("status", "published")
    .or(orFilter)
    .order("display_order", { ascending: true })
    .limit(8);

  if (error) {
    return NextResponse.json({ error: "Erreur de recherche." }, { status: 500 });
  }

  return NextResponse.json({ products: products ?? [] });
}
