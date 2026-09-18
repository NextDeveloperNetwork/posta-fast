"use server";

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
  accounts,
  sessions,
} from "@/db/schema";
import { count, ne, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // ignore if outside Next.js request context
  }
}

function parseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseNonNullDate(val: any): Date {
  if (!val) return new Date();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function chunkInsert<T extends Record<string, any>>(table: any, items: T[], chunkSize = 50) {
  if (!items || items.length === 0) return;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await db.insert(table).values(chunk);
  }
}

// 1. GET DATABASE STATS
export async function getDatabaseStatsAction() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [
      usersCount,
      officesCount,
      packagesCount,
      bagsCount,
      closingsCount,
      payoutsCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(offices),
      db.select({ count: count() }).from(packages),
      db.select({ count: count() }).from(bags),
      db.select({ count: count() }).from(officeClosings),
      db.select({ count: count() }).from(financialPayouts),
    ]);

    return {
      success: true,
      stats: {
        users: Number(usersCount[0]?.count || 0),
        offices: Number(officesCount[0]?.count || 0),
        packages: Number(packagesCount[0]?.count || 0),
        bags: Number(bagsCount[0]?.count || 0),
        closings: Number(closingsCount[0]?.count || 0),
        payouts: Number(payoutsCount[0]?.count || 0),
      },
    };
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return { success: false, error: error.message || "Failed to fetch stats" };
  }
}

// 2. RESTORE DATABASE FROM JSON BACKUP
export async function restoreDatabaseAction(jsonString: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized: Administrator access required." };
  }

  try {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return { success: false, error: "Invalid JSON format. Please upload a valid JSON backup." };
    }

    const data = parsed.data || parsed;
    if (!data || typeof data !== "object") {
      return { success: false, error: "Backup file has no valid data structure." };
    }

    const {
      systemSettings: rawSettings = [],
      offices: rawOffices = [],
      users: rawUsers = [],
      packages: rawPackages = [],
      packageEvents: rawPackageEvents = [],
      bags: rawBags = [],
      bagPackages: rawBagPackages = [],
      officeClosings: rawOfficeClosings = [],
      cashTransits: rawCashTransits = [],
      financialPayouts: rawFinancialPayouts = [],
    } = data;

    // STEP 1: CLEAR EXISTING TABLES IN REVERSE FK ORDER
    await db.delete(financialPayouts);
    await db.delete(cashTransits);
    await db.delete(officeClosings);
    await db.delete(bagPackages);
    await db.delete(bags);
    await db.delete(packageEvents);
    await db.delete(packages);

    // If restoring users and offices:
    if (Array.isArray(rawUsers) && rawUsers.length > 0) {
      await db.delete(sessions);
      await db.delete(accounts);
      await db.delete(users);
    }
    if (Array.isArray(rawOffices) && rawOffices.length > 0) {
      await db.delete(offices);
    }
    if (Array.isArray(rawSettings) && rawSettings.length > 0) {
      await db.delete(systemSettings);
    }

    // STEP 2: INSERT IN FORWARD FK ORDER WITH PROPER DATE PARSING

    // 2.1 System Settings
    if (Array.isArray(rawSettings) && rawSettings.length > 0) {
      const preparedSettings = rawSettings.map((s: any) => ({
        id: s.id || "default",
        totalTariffPerPackage: String(s.totalTariffPerPackage || "300.00"),
        deliveryOfficeCut: String(s.deliveryOfficeCut || "100.00"),
        currency: s.currency || "ALL",
        updatedAt: parseNonNullDate(s.updatedAt),
      }));
      await chunkInsert(systemSettings, preparedSettings);
    }

    // 2.2 Offices
    if (Array.isArray(rawOffices) && rawOffices.length > 0) {
      const preparedOffices = rawOffices.map((o: any) => ({
        id: o.id,
        name: o.name,
        code: o.code,
        city: o.city,
        address: o.address || null,
        phone: o.phone || null,
        intakeCommissionPercent: String(o.intakeCommissionPercent || "15.00"),
        createdAt: parseNonNullDate(o.createdAt),
        updatedAt: parseNonNullDate(o.updatedAt),
      }));
      await chunkInsert(offices, preparedOffices);
    }

    // 2.3 Users
    if (Array.isArray(rawUsers) && rawUsers.length > 0) {
      const preparedUsers = rawUsers.map((u: any) => ({
        id: u.id,
        name: u.name || null,
        email: u.email,
        emailVerified: parseDate(u.emailVerified),
        image: u.image || null,
        password: u.password || null,
        phone: u.phone || null,
        role: u.role || "pending",
        officeId: u.officeId || null,
        status: u.status || "active",
        createdAt: parseNonNullDate(u.createdAt),
        updatedAt: parseNonNullDate(u.updatedAt),
      }));
      await chunkInsert(users, preparedUsers);
    }

    // 2.4 Packages
    if (Array.isArray(rawPackages) && rawPackages.length > 0) {
      const preparedPackages = rawPackages.map((p: any) => ({
        id: p.id,
        barcode: p.barcode,
        sellerId: p.sellerId,
        intakeOfficeId: p.intakeOfficeId,
        destinationOfficeId: p.destinationOfficeId,
        paymentType: p.paymentType || "cod",
        amount: String(p.amount || "0.00"),
        clientName: p.clientName,
        clientPhone: p.clientPhone,
        clientAddress: p.clientAddress,
        clientCity: p.clientCity || null,
        notes: p.notes || null,
        status: p.status || "created",
        assignedCourierId: p.assignedCourierId || null,
        deliveredAt: parseDate(p.deliveredAt),
        refusedReason: p.refusedReason || null,
        createdAt: parseNonNullDate(p.createdAt),
        updatedAt: parseNonNullDate(p.updatedAt),
      }));
      await chunkInsert(packages, preparedPackages);
    }

    // 2.5 Package Events
    if (Array.isArray(rawPackageEvents) && rawPackageEvents.length > 0) {
      const preparedEvents = rawPackageEvents.map((e: any) => ({
        id: e.id,
        packageId: e.packageId,
        status: e.status,
        actorId: e.actorId || null,
        officeId: e.officeId || null,
        notes: e.notes || null,
        createdAt: parseNonNullDate(e.createdAt),
      }));
      await chunkInsert(packageEvents, preparedEvents);
    }

    // 2.6 Bags
    if (Array.isArray(rawBags) && rawBags.length > 0) {
      const preparedBags = rawBags.map((b: any) => ({
        id: b.id,
        barcode: b.barcode,
        originOfficeId: b.originOfficeId,
        destinationOfficeId: b.destinationOfficeId,
        status: b.status || "open",
        assignedCourierId: b.assignedCourierId || null,
        sealedAt: parseDate(b.sealedAt),
        dispatchedAt: parseDate(b.dispatchedAt),
        receivedAt: parseDate(b.receivedAt),
        createdAt: parseNonNullDate(b.createdAt),
        updatedAt: parseNonNullDate(b.updatedAt),
      }));
      await chunkInsert(bags, preparedBags);
    }

    // 2.7 Bag Packages
    if (Array.isArray(rawBagPackages) && rawBagPackages.length > 0) {
      const preparedBagPackages = rawBagPackages.map((bp: any) => ({
        id: bp.id,
        bagId: bp.bagId,
        packageId: bp.packageId,
        scannedAt: parseNonNullDate(bp.scannedAt),
        verifiedAt: parseDate(bp.verifiedAt),
      }));
      await chunkInsert(bagPackages, preparedBagPackages);
    }

    // 2.8 Office Closings
    if (Array.isArray(rawOfficeClosings) && rawOfficeClosings.length > 0) {
      const preparedClosings = rawOfficeClosings.map((c: any) => ({
        id: c.id,
        closingCode: c.closingCode,
        officeId: c.officeId,
        closedById: c.closedById,
        closingDate: parseNonNullDate(c.closingDate),
        totalCodCollected: String(c.totalCodCollected || "0.00"),
        packageCount: Number(c.packageCount || 0),
        status: c.status || "closed",
        courierId: c.courierId || null,
        notes: c.notes || null,
        createdAt: parseNonNullDate(c.createdAt),
      }));
      await chunkInsert(officeClosings, preparedClosings);
    }

    // 2.9 Cash Transits
    if (Array.isArray(rawCashTransits) && rawCashTransits.length > 0) {
      const preparedTransits = rawCashTransits.map((t: any) => ({
        id: t.id,
        closingId: t.closingId,
        courierId: t.courierId,
        amount: String(t.amount || "0.00"),
        status: t.status || "assigned",
        handedOverAt: parseDate(t.handedOverAt),
        receivedAt: parseDate(t.receivedAt),
        receivedById: t.receivedById || null,
        createdAt: parseNonNullDate(t.createdAt),
      }));
      await chunkInsert(cashTransits, preparedTransits);
    }

    // 2.10 Financial Payouts
    if (Array.isArray(rawFinancialPayouts) && rawFinancialPayouts.length > 0) {
      const preparedPayouts = rawFinancialPayouts.map((p: any) => ({
        id: p.id,
        payoutBatchCode: p.payoutBatchCode || null,
        sellerId: p.sellerId,
        packageId: p.packageId,
        codAmount: String(p.codAmount || "0.00"),
        postalTariff: String(p.postalTariff || "0.00"),
        intakeOfficeCommission: String(p.intakeOfficeCommission || "0.00"),
        deliveryOfficeCut: String(p.deliveryOfficeCut || "0.00"),
        sellerPayoutAmount: String(p.sellerPayoutAmount || "0.00"),
        status: p.status || "pending",
        paymentReference: p.paymentReference || null,
        clearedAt: parseDate(p.clearedAt),
        paidAt: parseDate(p.paidAt),
        createdAt: parseNonNullDate(p.createdAt),
      }));
      await chunkInsert(financialPayouts, preparedPayouts);
    }

    safeRevalidate("/admin");
    safeRevalidate("/admin/backup");
    safeRevalidate("/admin/packages");
    safeRevalidate("/admin/offices");
    safeRevalidate("/admin/users");
    safeRevalidate("/finance");

    return {
      success: true,
      message: `Rikthimi përfundoi me sukses! Janë rikthyer të gjitha të dhënat e sistemit.`,
    };
  } catch (error: any) {
    console.error("Restore error:", error);
    return { success: false, error: error.message || "Failed to restore database." };
  }
}

// 3. RESET DATABASE
export async function resetDatabaseAction(
  mode: "operational" | "full",
  confirmationText: string
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized: Administrator access required." };
  }

  if (confirmationText.trim() !== "RESET") {
    return {
      success: false,
      error: "Konfirmimi dështoi: Ju lutemi shkruani saktësisht fjalën 'RESET' me të mëdha.",
    };
  }

  try {
    // Both modes clear operational data
    await db.delete(financialPayouts);
    await db.delete(cashTransits);
    await db.delete(officeClosings);
    await db.delete(bagPackages);
    await db.delete(bags);
    await db.delete(packageEvents);
    await db.delete(packages);

    if (mode === "full") {
      const currentAdminId = session.user.id;

      // Unassign office from current admin so office FK doesn't restrict office deletion
      if (currentAdminId) {
        await db
          .update(users)
          .set({ officeId: null })
          .where(eq(users.id, currentAdminId));
      }

      // Delete other users' sessions and accounts
      if (currentAdminId) {
        await db.delete(sessions).where(ne(sessions.userId, currentAdminId));
        await db.delete(accounts).where(ne(accounts.userId, currentAdminId));
        // Delete all other users
        await db.delete(users).where(ne(users.id, currentAdminId));
      } else {
        // Fallback: delete other non-admin users
        await db.delete(users).where(ne(users.role, "admin"));
      }

      // Delete all offices
      await db.delete(offices);
    }

    safeRevalidate("/admin");
    safeRevalidate("/admin/backup");
    safeRevalidate("/admin/packages");
    safeRevalidate("/admin/offices");
    safeRevalidate("/admin/users");
    safeRevalidate("/finance");

    return {
      success: true,
      message:
        mode === "operational"
          ? "Të gjitha pakot, çantat dhe operacionet u pastruan me sukses. Përdoruesit dhe zyrat u ruajtën."
          : "Resetimi i plotë fabrike u krye me sukses. Të gjitha të dhënat u fshinë përveç llogarisë suaj administrative.",
    };
  } catch (error: any) {
    console.error("Reset error:", error);
    return { success: false, error: error.message || "Failed to reset database." };
  }
}
