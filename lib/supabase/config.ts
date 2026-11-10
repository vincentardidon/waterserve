export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }
  if (/your-|placeholder|example|replace/i.test(key)) {
    throw new Error(
      "Replace NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local with the publishable key from the same Supabase project as the URL.",
    );
  }
  if (/your-|placeholder|example|replace/i.test(url)) {
    throw new Error(
      "Replace NEXT_PUBLIC_SUPABASE_URL in .env.local with the project URL from your Supabase project.",
    );
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname)
      throw new Error();
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be the full HTTP or HTTPS URL from your Supabase project, for example https://your-project-ref.supabase.co.",
    );
  }

  return { url, key };
}
