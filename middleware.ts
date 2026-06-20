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

  // --- Routes admin : authentifie + role admin ou manager ---
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
    if (roleName !== "admin" && roleName !== "manager") {
      const url = request.nextUrl.clone();
      url.pathname = "/compte";
      return NextResponse.redirect(url);
    }
  }

  // --- Routes compte : authentifie ---
  if (pathname.startsWith("/compte")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      return NextResponse.redirect(url);
    }
  }

  // --- Auth : rediriger si deja connecte ---
  if (pathname.startsWith("/auth/") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_id, roles(name)")
      .eq("id", user.id)
      .single();
    const roles = profile?.roles as unknown as { name: string } | null;
    const roleName = roles?.name;
    const url = request.nextUrl.clone();
    url.pathname =
      roleName === "admin" || roleName === "manager" ? "/admin" : "/compte";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*", "/compte/:path*"],
};
