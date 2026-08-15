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

  // --- Routes admin : authentification seule (sans vérification de rôle) ---
  // Tout utilisateur connecté peut accéder au dashboard admin.
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      return NextResponse.redirect(url);
    }
  }

  // --- Routes compte : authentification seule ---
  if (pathname.startsWith("/compte")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      return NextResponse.redirect(url);
    }
  }

  // --- Auth : rediriger si déjà connecté ---
  // Exception : /auth/reinitialiser-mot-de-passe et /auth/callback
  // ont besoin d'une session active (échange PKCE ou updateUser).
  const isResetFlow =
    pathname === "/auth/reinitialiser-mot-de-passe" ||
    pathname === "/auth/callback";
  if (pathname.startsWith("/auth/") && user && !isResetFlow) {
    const url = request.nextUrl.clone();
    url.pathname = "/compte";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*", "/compte/:path*"],
};
