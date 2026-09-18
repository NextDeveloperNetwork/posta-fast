import { requireAuth } from "@/lib/auth-guards";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth(["finance", "admin"]);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
