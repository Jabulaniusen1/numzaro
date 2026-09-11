import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

function getAppUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return request.nextUrl.origin;
}

// Sends password-recovery emails through our own SMTP instead of
// Supabase's built-in mailer (which silently drops mail when the Supabase
// project's SMTP / rate limits aren't set up).
export async function POST(request: NextRequest) {
  let email = "";
  try {
    const body = await request.json().catch(() => ({}));
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Always return success to avoid account enumeration — but only send
  // mail when the account actually exists.
  try {
    const supabase = createServiceRoleClient();
    const redirectTo = `${getAppUrl(request)}/auth/callback?type=recovery`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      // Unknown email (or link error) — pretend success.
      console.warn("[auth/forgot-password] generateLink failed:", error?.message);
      return NextResponse.json({ success: true });
    }

    const { sendEmail } = await import("@/lib/email/smtp");
    const { getPasswordResetEmail } = await import("@/lib/email/templates");

    await sendEmail({
      to: email,
      subject: "Reset your Numzaro password",
      html: getPasswordResetEmail(data.properties.action_link),
      text: `Reset your Numzaro password: ${data.properties.action_link}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[auth/forgot-password] error:", err);
    // Misconfiguration (e.g. missing SMTP_*) should surface so it can be
    // fixed instead of silently pretending the mail was sent.
    if (String(err?.message ?? "").includes("SMTP is not configured")) {
      return NextResponse.json(
        { error: "Email service is not configured. Please contact support." },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  }
}
