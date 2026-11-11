export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return null;
    }
  } catch {
    return null;
  }

  return { url, key };
}