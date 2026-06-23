import { createBrowserClient } from "@supabase/ssr";

function getPublicSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltan variables publicas de Supabase.");
  }

  return { supabaseKey, supabaseUrl };
}

export function createClient() {
  const { supabaseKey, supabaseUrl } = getPublicSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabaseKey);
}
