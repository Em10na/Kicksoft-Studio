import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("id", user.id)
    .single();

  const roles = profile?.roles as unknown as { name: string } | { name: string }[] | null;
  const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name;
  if (roleName !== "admin") return null;
  return user;
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, full_name, phone, role_name } = body;

  if (!email?.trim() || !password || !full_name?.trim()) {
    return NextResponse.json({ error: "Email, mot de passe et nom sont obligatoires." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caracteres." }, { status: 400 });
  }

  if (!["admin"].includes(role_name)) {
    return NextResponse.json({ error: "Le role doit etre admin." }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: roleData } = await supabaseAdmin
    .from("roles")
    .select("id")
    .eq("name", role_name)
    .single();

  if (!roleData) {
    return NextResponse.json({ error: "Role introuvable." }, { status: 500 });
  }

  const { data: newUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (authErr || !newUser.user) {
    return NextResponse.json({ error: authErr?.message ?? "Erreur lors de la creation du compte." }, { status: 500 });
  }

  const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
    id: newUser.user.id,
    full_name: full_name.trim(),
    phone: phone?.trim() || null,
    role_id: roleData.id,
  });

  if (profileErr) {
    return NextResponse.json({ error: "Compte cree mais erreur profil : " + profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: newUser.user.id, email: newUser.user.email });
}

export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

  const body = await request.json();
  const { user_id, full_name, phone, role_name } = body;

  if (!user_id || !full_name?.trim()) {
    return NextResponse.json({ error: "ID utilisateur et nom sont obligatoires." }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const update: Record<string, unknown> = {
    full_name: full_name.trim(),
    phone: phone?.trim() || null,
  };

  if (role_name) {
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", role_name)
      .single();
    if (roleData) {
      update.role_id = roleData.id;
    }
  }

  const { error } = await supabaseAdmin.from("profiles").update(update).eq("id", user_id);

  if (error) {
    return NextResponse.json({ error: "Erreur : " + error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "ID utilisateur manquant." }, { status: 400 });
  }

  if (userId === admin.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: "Erreur : " + error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
