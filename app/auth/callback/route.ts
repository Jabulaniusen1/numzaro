import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectParam = requestUrl.searchParams.get("redirect");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Create user profile if it doesn't exist
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingUser) {
        await supabase.from("users").insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        });
      }
    }
  }

  // Redirect to specified path or default to dashboard
  const redirectPath = redirectParam || "/dashboard";
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}

