import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  users,
  offices,
  systemSettings,
  packages,
  packageEvents,
  bags,
  bagPackages,
  officeClosings,
  cashTransits,
  financialPayouts,
} from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    // Fetch all records across all tables
    const [
      allSettings,
      allOffices,
      allUsers,
      allPackages,
      allEvents,
      allBags,
      allBagPackages,
      allClosings,
      allTransits,
      allPayouts,
    ] = await Promise.all([
      db.select().from(systemSettings),
      db.select().from(offices),
      db.select().from(users),
      db.select().from(packages),
      db.select().from(packageEvents),
      db.select().from(bags),
      db.select().from(bagPackages),
      db.select().from(officeClosings),
      db.select().from(cashTransits),
      db.select().from(financialPayouts),
    ]);

    const timestamp = new Date().toISOString();
    const formattedDate = timestamp.replace(/[:.]/g, "-");
    const filename = `posta-fast-backup-${formattedDate}.json`;

    const backupPayload = {
      meta: {
        version: "1.0",
        appName: "Posta Fast",
        exportedAt: timestamp,
        exportedBy: session.user.email || session.user.name || "admin",
        counts: {
          settings: allSettings.length,
          offices: allOffices.length,
          users: allUsers.length,
          packages: allPackages.length,
          packageEvents: allEvents.length,
          bags: allBags.length,
          bagPackages: allBagPackages.length,
          officeClosings: allClosings.length,
          cashTransits: allTransits.length,
          financialPayouts: allPayouts.length,
        },
      },
      data: {
        systemSettings: allSettings,
        offices: allOffices,
        users: allUsers,
        packages: allPackages,
        packageEvents: allEvents,
        bags: allBags,
        bagPackages: allBagPackages,
        officeClosings: allClosings,
        cashTransits: allTransits,
        financialPayouts: allPayouts,
      },
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Backup export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate database backup." },
      { status: 500 }
    );
  }
}
