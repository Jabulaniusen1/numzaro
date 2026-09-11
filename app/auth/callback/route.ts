import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const redirectParam = requestUrl.searchParams.get("redirect");

  const supabase = await createClient();

  // PKCE flow (modern Supabase email links): ?code=...
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] code exchange failed:", error.message);
      return NextResponse.redirect(
        new URL(`/auth/reset-password?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // Password recovery — skip profile creation, go straight to reset page
    if (type === "recovery") {
      return NextResponse.redirect(new URL("/auth/reset-password", requestUrl.origin));
    }

    // Create user profile if it doesn't exist (email confirmation flow)
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingUser) {
        const m = user.user_metadata ?? {};
        await supabase.from("users").insert({
          id: user.id,
          email: user.email!,
          full_name: m.full_name || m.name || "",
          country_code: m.country_code || null,
          country_name: m.country_name || null,
          phone_country_code: m.phone_country_code || null,
          phone_number: m.phone_number || null,
          phone_e164: m.phone_e164 || null,
        });
      }
    }
  } else if (tokenHash && type) {
    // Legacy / direct-verify flow: ?token_hash=...&type=recovery
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    });
    if (error) {
      console.error("[auth/callback] token verify failed:", error.message);
      return NextResponse.redirect(
        new URL(`/auth/reset-password?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }
    if (type === "recovery") {
      return NextResponse.redirect(new URL("/auth/reset-password", requestUrl.origin));
    }
  }

  const redirectPath = redirectParam || "/dashboard";
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
