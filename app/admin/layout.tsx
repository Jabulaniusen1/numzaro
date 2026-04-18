import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void children;
  redirect("/dashboard/admin");
}
