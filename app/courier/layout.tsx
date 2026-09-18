import { requireAuth } from "@/lib/auth-guards";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth(["courier", "admin"]);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
