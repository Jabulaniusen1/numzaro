import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const redirectParam = requestUrl.searchParams.get("redirect");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

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
  }

  const redirectPath = redirectParam || "/dashboard";
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}

