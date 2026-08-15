import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route de callback OAuth/PKCE.
 * Supabase redirige ici après avoir validé le lien de réinitialisation.
 * Le paramètre `code` est échangé contre une session valide via PKCE.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/reinitialiser-mot-de-passe";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Échange réussi : on redirige vers la page de réinitialisation avec session établie
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Lien invalide ou expiré : retour vers la page mot de passe oublié avec indicateur d'erreur
  return NextResponse.redirect(
    `${origin}/auth/mot-de-passe-oublie?erreur=lien_invalide`
  );
}
