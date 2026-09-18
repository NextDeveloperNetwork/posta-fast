import { requireAuth } from "@/lib/auth-guards";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth(["seller", "admin"]);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
