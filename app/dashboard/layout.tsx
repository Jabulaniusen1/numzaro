import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/dashboard/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  const isAdmin = adminEmails.includes(user.email || "");

  const handleSignOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/login");
  };

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <Navbar onSignOut={handleSignOut} isAdmin={isAdmin} />
      <main className="md:max-w-7xl md:mx-auto md:px-6">{children}</main>
    </div>
  );
}

