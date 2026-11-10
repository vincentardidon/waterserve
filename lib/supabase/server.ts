import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabasePublicConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. The Next.js proxy refreshes sessions.
        }
      },
    },
  });
}

export async function createSupabaseAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const { url } = getSupabasePublicConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is required for staff management.");
  if (/your-|placeholder|example|replace/i.test(key))
    throw new Error("Replace SUPABASE_SECRET_KEY in .env.local with the secret key from your Supabase project.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
