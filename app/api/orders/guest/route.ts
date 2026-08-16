import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guest_name, guest_phone, guest_address, guest_email, items } = body;

  // Validation des champs obligatoires
  if (!guest_name?.trim() || !guest_phone?.trim() || !guest_address?.trim()) {
    return NextResponse.json(
      { error: "Nom, téléphone et adresse sont obligatoires." },
      { status: 400 }
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Le panier est vide." }, { status: 400 });
  }

  // Utilise le service role pour bypasser RLS — jamais exposé au navigateur.
  const supabase = createAdminClient();

  // Vérification des produits (stock + prix réel) pour éviter la manipulation côté client
  const productIds = items.map((i: { product_id: string }) => i.product_id);
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, price, stock, title, status")
    .in("id", productIds);

  if (prodErr || !products) {
    return NextResponse.json(
      { error: "Erreur lors de la vérification des produits." },
      { status: 500 }
    );
  }

  const priceMap = new Map(products.map((p) => [p.id, p]));

  let verifiedTotal = 0;
  const verifiedItems: { product_id: string; quantity: number; unit_price: number }[] = [];

  for (const item of items) {
    const product = priceMap.get(item.product_id);
    if (!product) {
      return NextResponse.json(
        { error: `Produit introuvable : ${item.product_id}` },
        { status: 400 }
      );
    }
    if (product.status !== "published") {
      return NextResponse.json(
        { error: `Produit non disponible : ${product.title ?? item.product_id}` },
        { status: 400 }
      );
    }
    if (item.quantity > product.stock) {
      return NextResponse.json(
        { error: `Stock insuffisant pour "${product.title ?? "ce produit"}". Disponible : ${product.stock}` },
        { status: 400 }
      );
    }
    if (item.quantity < 1) {
      return NextResponse.json(
        { error: "Quantité invalide." },
        { status: 400 }
      );
    }
    verifiedItems.push({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: product.price, // Prix réel depuis la DB — ignore le prix envoyé par le client
    });
    verifiedTotal += product.price * item.quantity;
  }

  const livraison = verifiedTotal >= 50 ? 0 : 7;
  const grandTotal = verifiedTotal + livraison;

  // Création de la commande (user_id = null → commande invité)
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: null,
      total: grandTotal,
      status: "pending",
      guest_name: guest_name.trim(),
      guest_phone: guest_phone.trim(),
      guest_address: guest_address.trim(),
      ...(guest_email?.trim() ? { guest_email: guest_email.trim() } : {}),
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[orders/guest] order insert failed:", orderErr?.message);
    return NextResponse.json(
      { error: "Erreur lors de la création de la commande. Veuillez réessayer." },
      { status: 500 }
    );
  }

  // Insertion des lignes de commande
  const { error: itemsErr } = await supabase.from("order_items").insert(
    verifiedItems.map((item) => ({ order_id: order.id, ...item }))
  );

  if (itemsErr) {
    console.error("[orders/guest] order_items insert failed:", itemsErr.message);
    // La commande existe mais sans articles — la supprimer pour rester cohérent
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement des articles." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: order.id });
}
