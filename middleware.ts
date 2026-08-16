import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Récupérer le rôle si l'utilisateur est connecté ─────────────────────
  // Une seule requête couvre toutes les vérifications qui suivent.
  let roleName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();
    // PostgREST peut retourner un tableau ou un objet selon le type de relation
    const rolesRaw = profile?.roles;
    const roles = (Array.isArray(rolesRaw) ? rolesRaw[0] : rolesRaw) as { name: string } | null | undefined;
    roleName = roles?.name ?? null;
  }

  // Admin/manager = connecté ET rôle différent de "client"
  const isAdminUser = roleName !== null && roleName !== "client";

  // --- Routes admin : authentification + rôle non-client ──────────────────
  if (pathname.startsWith("/admin")) {
    if (!user) {
      // Non connecté → connexion
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      return NextResponse.redirect(url);
    }
    if (!isAdminUser) {
      // Rôle "client" (ou aucun rôle) → espace client
      const url = request.nextUrl.clone();
      url.pathname = "/compte";
      return NextResponse.redirect(url);
    }
  }

  // --- Routes compte : authentification seule ─────────────────────────────
  if (pathname.startsWith("/compte")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      return NextResponse.redirect(url);
    }
  }

  // --- Auth : rediriger vers le bon espace si déjà connecté ───────────────
  // Exception : /auth/reinitialiser-mot-de-passe et /auth/callback
  // ont besoin d'une session active (échange PKCE ou updateUser).
  const isResetFlow =
    pathname === "/auth/reinitialiser-mot-de-passe" ||
    pathname === "/auth/callback";
  if (pathname.startsWith("/auth/") && user && !isResetFlow) {
    const url = request.nextUrl.clone();
    // Admin/manager → dashboard ; client → espace client
    url.pathname = isAdminUser ? "/admin" : "/compte";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*", "/compte/:path*"],
};
