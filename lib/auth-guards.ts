import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { offices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireAuth(allowedRoles?: string[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "pending";

  if (role === "pending") {
    redirect("/pending");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role) && role !== "admin") {
    // Redirect to their own dashboard
    switch (role) {
      case "finance":
        redirect("/finance");
      case "office":
        redirect("/office");
      case "courier":
        redirect("/courier");
      case "seller":
        redirect("/seller");
      default:
        redirect("/pending");
    }
  }

  // If user has an officeId, fetch office name
  let officeName: string | null = null;
  if (session.user.officeId) {
    const [office] = await db
      .select({ name: offices.name })
      .from(offices)
      .where(eq(offices.id, session.user.officeId))
      .limit(1);
    officeName = office?.name || null;
  }

  return {
    user: {
      ...session.user,
      officeName,
    },
    role,
  };
}
