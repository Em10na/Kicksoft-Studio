import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const baseUrl = request.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/auth/connexion", baseUrl));

  // Empêcher le navigateur de mettre en cache la page de redirection
  // et d'autoriser un retour vers les pages admin en cache (bfcache).
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
