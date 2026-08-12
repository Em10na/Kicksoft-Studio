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

  // --- Routes admin : authentifie + role admin ---
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      return NextResponse.redirect(url);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_id, roles(name)")
      .eq("id", user.id)
      .single();
    const roles = profile?.roles as unknown as { name: string } | null;
    const roleName = roles?.name;
    if (roleName !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/compte";
      return NextResponse.redirect(url);
    }
  }

  // --- Routes compte : authentifie + reserve aux clients ---
  // (l'admin a son propre espace : le dashboard /admin)
  if (pathname.startsWith("/compte")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      return NextResponse.redirect(url);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_id, roles(name)")
      .eq("id", user.id)
      .single();
    const roles = profile?.roles as unknown as { name: string } | null;
    const roleName = roles?.name;
    if (roleName === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // --- Auth : rediriger si deja connecte ---
  // Exception : /auth/reinitialiser-mot-de-passe et /auth/callback
  // ont besoin d'une session active (échange PKCE ou updateUser).
  const isResetFlow =
    pathname === "/auth/reinitialiser-mot-de-passe" ||
    pathname === "/auth/callback";
  if (pathname.startsWith("/auth/") && user && !isResetFlow) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_id, roles(name)")
      .eq("id", user.id)
      .single();
    const roles = profile?.roles as unknown as { name: string } | null;
    const roleName = roles?.name;
    const url = request.nextUrl.clone();
    url.pathname = roleName === "admin" ? "/admin" : "/compte";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*", "/compte/:path*"],
};
