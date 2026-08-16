import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "[createAdminClient] NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY " +
      "doivent être définis dans .env.local. Consultez .env.example."
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
