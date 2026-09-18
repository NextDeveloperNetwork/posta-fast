import { requireAuth } from "@/lib/auth-guards";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth(["admin"]);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
