import { db } from "@/db";
import {
  offices,
  systemSettings,
  packages,
  bags,
  bagPackages,
  officeClosings,
  cashTransits,
  financialPayouts,
  users,
} from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function getSystemSettings() {
  const [settings] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.id, "default"))
    .limit(1);

  return settings || {
    id: "default",
    totalTariffPerPackage: "300.00",
    deliveryOfficeCut: "100.00",
    currency: "ALL",
  };
}

export async function getOfficesList() {
  return await db.select().from(offices).orderBy(offices.name);
}

export async function getUsersList() {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      officeId: users.officeId,
      phone: users.phone,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function getAdminOverview() {
  const allPkgs = await db.select().from(packages);
  const allOffices = await db.select().from(offices);
  const allBags = await db.select().from(bags);
  const allTransits = await db.select().from(cashTransits);

  const totalCodCirculating = allPkgs
    .filter((p) => p.paymentType === "cod" && p.status !== "delivered")
    .reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0);

  const totalCodCollected = allPkgs
    .filter((p) => p.status === "delivered" && p.paymentType === "cod")
    .reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0);

  return {
    packageCount: allPkgs.length,
    officeCount: allOffices.length,
    bagCount: allBags.length,
    deliveredCount: allPkgs.filter((p) => p.status === "delivered").length,
    refusedCount: allPkgs.filter((p) => p.status === "refused").length,
    inTransitCount: allPkgs.filter((p) => p.status.includes("transit")).length,
    totalCodCirculating,
    totalCodCollected,
  };
}

export async function getOfficeData(officeId: string) {
  const [office] = await db.select().from(offices).where(eq(offices.id, officeId)).limit(1);

  // Packages ready for intake (created and targeting this intake office)
  const pendingIntake = await db
    .select()
    .from(packages)
    .where(and(eq(packages.intakeOfficeId, officeId), eq(packages.status, "created")))
    .orderBy(desc(packages.createdAt));

  // Packages accepted at intake ready to be bagged
  const acceptedForBagging = await db
    .select()
    .from(packages)
    .where(and(eq(packages.intakeOfficeId, officeId), eq(packages.status, "accepted_at_intake")))
    .orderBy(desc(packages.createdAt));

  // Bags created at this office
  const originBags = await db
    .select()
    .from(bags)
    .where(eq(bags.originOfficeId, officeId))
    .orderBy(desc(bags.createdAt));

  // Incoming bags arriving at this destination office
  const incomingBags = await db
    .select()
    .from(bags)
    .where(eq(bags.destinationOfficeId, officeId))
    .orderBy(desc(bags.createdAt));

  // Packages ready for last-mile delivery at destination office
  const readyForDelivery = await db
    .select()
    .from(packages)
    .where(
      and(
        eq(packages.destinationOfficeId, officeId),
        eq(packages.status, "received_at_dest_office")
      )
    )
    .orderBy(desc(packages.createdAt));

  // Packages currently out for delivery
  const outForDelivery = await db
    .select()
    .from(packages)
    .where(
      and(
        eq(packages.destinationOfficeId, officeId),
        eq(packages.status, "out_for_delivery")
      )
    );

  // Delivered packages today needing closing
  const deliveredForClosing = await db
    .select()
    .from(packages)
    .where(
      and(
        eq(packages.destinationOfficeId, officeId),
        eq(packages.status, "delivered"),
        eq(packages.paymentType, "cod")
      )
    );

  // Closings for this office
  const closings = await db
    .select()
    .from(officeClosings)
    .where(eq(officeClosings.officeId, officeId))
    .orderBy(desc(officeClosings.createdAt));

  // Available couriers
  const couriers = await db
    .select()
    .from(users)
    .where(eq(users.role, "courier"));

  return {
    office,
    pendingIntake,
    acceptedForBagging,
    originBags,
    incomingBags,
    readyForDelivery,
    outForDelivery,
    deliveredForClosing,
    closings,
    couriers,
  };
}

export async function getCourierData(courierId: string) {
  // Bags assigned for inter-office transport
  const assignedBags = await db
    .select()
    .from(bags)
    .where(eq(bags.assignedCourierId, courierId))
    .orderBy(desc(bags.createdAt));

  // Packages assigned for final last-mile delivery
  const assignedDeliveries = await db
    .select()
    .from(packages)
    .where(eq(packages.assignedCourierId, courierId))
    .orderBy(desc(packages.createdAt));

  // Cash transits assigned to courier
  const assignedTransits = await db
    .select()
    .from(cashTransits)
    .where(eq(cashTransits.courierId, courierId))
    .orderBy(desc(cashTransits.createdAt));

  const totalCodCollected = assignedDeliveries
    .filter((p) => p.status === "delivered" && p.paymentType === "cod")
    .reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0);

  return {
    assignedBags,
    assignedDeliveries,
    assignedTransits,
    totalCodCollected,
  };
}

export async function getFinanceData() {
  const transits = await db
    .select()
    .from(cashTransits)
    .orderBy(desc(cashTransits.createdAt));

  const payouts = await db
    .select()
    .from(financialPayouts)
    .orderBy(desc(financialPayouts.createdAt));

  const closings = await db
    .select()
    .from(officeClosings)
    .orderBy(desc(officeClosings.createdAt));

  const totalCashReceived = transits
    .filter((t) => t.status === "received_by_finance")
    .reduce((acc, t) => acc + parseFloat(t.amount || "0"), 0);

  const totalPendingPayouts = payouts
    .filter((p) => p.status === "cleared")
    .reduce((acc, p) => acc + parseFloat(p.sellerPayoutAmount || "0"), 0);

  const totalPaidOut = payouts
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + parseFloat(p.sellerPayoutAmount || "0"), 0);

  const totalCommissionsEarned = payouts
    .reduce((acc, p) => acc + parseFloat(p.postalTariff || "0"), 0);

  return {
    transits,
    payouts,
    closings,
    totalCashReceived,
    totalPendingPayouts,
    totalPaidOut,
    totalCommissionsEarned,
  };
}

export async function getSellerData(sellerId: string) {
  const sellerPkgs = await db
    .select()
    .from(packages)
    .where(eq(packages.sellerId, sellerId))
    .orderBy(desc(packages.createdAt));

  const payouts = await db
    .select()
    .from(financialPayouts)
    .where(eq(financialPayouts.sellerId, sellerId))
    .orderBy(desc(financialPayouts.createdAt));

  const allOffices = await db.select().from(offices).orderBy(offices.name);

  const pendingCod = payouts
    .filter((p) => p.status === "cleared")
    .reduce((acc, p) => acc + parseFloat(p.sellerPayoutAmount || "0"), 0);

  const paidCod = payouts
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + parseFloat(p.sellerPayoutAmount || "0"), 0);

  return {
    packages: sellerPkgs,
    payouts,
    offices: allOffices,
    pendingCod,
    paidCod,
  };
}
