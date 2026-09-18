import { requireAuth } from "@/lib/auth-guards";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth(["office", "admin"]);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
