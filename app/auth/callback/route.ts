import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("Auth callback error:", error.message);
    } catch (err) {
      console.error("Auth callback exception:", err);
    }
  }

  // Fallback — redirect to dashboard anyway (session may already be set via cookie)
  return NextResponse.redirect(`${origin}/dashboard`);
}
