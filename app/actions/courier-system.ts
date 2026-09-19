"use server";

import { db } from "@/db";
import {
  offices,
  systemSettings,
  packages,
  packageEvents,
  bags,
  bagPackages,
  officeClosings,
  cashTransits,
  financialPayouts,
  users,
} from "@/db/schema";
import { eq, and, desc, sql, inArray, or, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // ignore if called outside Next.js request context
  }
}

// Helper to generate unique codes
function generateCode(prefix: string, length = 6): string {
  const digits = Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
  return `${prefix}-${digits}`;
}

// ==========================================
// 1. ADMIN ACTIONS
// ==========================================

export async function createOfficeAction(formData: FormData) {
  try {
    const name = String(formData.get("name") || "").trim();
    const code = String(formData.get("code") || "").trim().toUpperCase();
    const city = String(formData.get("city") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const intakeCommissionPercent = String(formData.get("intakeCommissionPercent") || "15.00");

    if (!name || !code || !city) {
      return { error: "Ju lutem plotësoni emrin, kodin dhe qytetin e zyrës." };
    }

    await db.insert(offices).values({
      name,
      code,
      city,
      address,
      phone,
      intakeCommissionPercent,
    });

    safeRevalidate("/admin/offices");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSystemSettingsAction(formData: FormData) {
  try {
    const totalTariffPerPackage = String(formData.get("totalTariffPerPackage") || "300.00");
    const deliveryOfficeCut = String(formData.get("deliveryOfficeCut") || "100.00");

    await db
      .insert(systemSettings)
      .values({
        id: "default",
        totalTariffPerPackage,
        deliveryOfficeCut,
        currency: "ALL",
      })
      .onConflictDoUpdate({
        target: systemSettings.id,
        set: {
          totalTariffPerPackage,
          deliveryOfficeCut,
          updatedAt: new Date(),
        },
      });

    safeRevalidate("/admin/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function assignUserRoleAction(formData: FormData) {
  try {
    const userId = String(formData.get("userId") || "");
    const role = String(formData.get("role") || "seller");
    const officeId = String(formData.get("officeId") || "") || null;

    if (!userId) return { error: "Përdoruesi i pavlefshëm." };

    await db
      .update(users)
      .set({
        role,
        officeId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    safeRevalidate("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ==========================================
// 2. SELLER ACTIONS
// ==========================================

export async function createPackageAction(sellerId: string, formData: FormData) {
  try {
    const intakeOfficeId = String(formData.get("intakeOfficeId") || "");
    const destinationOfficeId = String(formData.get("destinationOfficeId") || "");
    const paymentType = String(formData.get("paymentType") || "cod");
    const amount = paymentType === "cod" ? String(formData.get("amount") || "0") : "0";
    const clientName = String(formData.get("clientName") || "").trim();
    const clientPhone = String(formData.get("clientPhone") || "").trim();
    const clientAddress = String(formData.get("clientAddress") || "").trim();
    const clientCity = String(formData.get("clientCity") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    if (!intakeOfficeId || !destinationOfficeId || !clientName || !clientPhone || !clientAddress) {
      return { error: "Ju lutem plotësoni të gjitha fushat e kërkuara." };
    }

    const barcode = generateCode("PF", 6);

    const [newPkg] = await db
      .insert(packages)
      .values({
        barcode,
        sellerId,
        intakeOfficeId,
        destinationOfficeId,
        paymentType,
        amount,
        clientName,
        clientPhone,
        clientAddress,
        clientCity,
        notes,
        status: "created",
      })
      .returning();

    // Log creation event
    await db.insert(packageEvents).values({
      packageId: newPkg.id,
      status: "created",
      actorId: sellerId,
      notes: `Krijuar nga shitësi. Pagesa: ${paymentType.toUpperCase()} ${amount} ALL`,
    });

    safeRevalidate("/seller/packages");
    return { success: true, barcode: newPkg.barcode, id: newPkg.id };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ==========================================
// 3. OFFICE ACTIONS (INTAKE, BAG LOADING, UNLOADING, CLOSING)
// ==========================================

export async function getIntakePackagesAction(officeId?: string | null) {
  try {
    const allOffices = await db.select().from(offices).orderBy(offices.name);
    const officeMap = new Map(allOffices.map((o) => [o.id, o.name]));

    const rows = await db
      .select({
        id: packages.id,
        barcode: packages.barcode,
        sellerId: packages.sellerId,
        sellerName: users.name,
        sellerEmail: users.email,
        intakeOfficeId: packages.intakeOfficeId,
        destinationOfficeId: packages.destinationOfficeId,
        paymentType: packages.paymentType,
        amount: packages.amount,
        clientName: packages.clientName,
        clientPhone: packages.clientPhone,
        clientAddress: packages.clientAddress,
        clientCity: packages.clientCity,
        notes: packages.notes,
        status: packages.status,
        createdAt: packages.createdAt,
      })
      .from(packages)
      .leftJoin(users, eq(packages.sellerId, users.id))
      .orderBy(desc(packages.createdAt));

    const enriched = rows.map((p) => ({
      ...p,
      intakeOfficeName: officeMap.get(p.intakeOfficeId) || "Zyrë e panjohur",
      destinationOfficeName: officeMap.get(p.destinationOfficeId) || "Zyrë e panjohur",
    }));

    return {
      success: true,
      packages: enriched,
      offices: allOffices,
    };
  } catch (error: any) {
    console.error("getIntakePackagesAction error:", error);
    return { success: false, error: error.message, packages: [], offices: [] };
  }
}

export async function intakeScanPackageAction(barcode: string, officeId: string, actorId: string) {
  try {
    const raw = String(barcode || "").trim();
    if (!raw) {
      return { error: "Ju lutemi shkruani një barkod të vlefshëm." };
    }

    const upper = raw.toUpperCase();
    const withPrefix = upper.startsWith("PF-") ? upper : `PF-${upper}`;

    // Search by exact, prefixed, or case-insensitive match
    const [pkg] = await db
      .select()
      .from(packages)
      .where(
        or(
          eq(packages.barcode, raw),
          eq(packages.barcode, upper),
          eq(packages.barcode, withPrefix),
          ilike(packages.barcode, raw),
          ilike(packages.barcode, `%${raw}%`)
        )
      )
      .limit(1);

    if (!pkg) {
      return { error: `Pakoja me barkod '${raw}' nuk u gjet në sistem.` };
    }

    if (pkg.status !== "created") {
      const statusLabels: Record<string, string> = {
        accepted_at_intake: "Tashmë e pranuar në zyrë",
        bagged: "Tashmë e ngarkuar në çantë",
        in_transit_interoffice: "Në tranzit mes zyrave",
        received_at_dest_office: "E mbërritur në zyrën e destinacionit",
        out_for_delivery: "Në dorëzim te klienti",
        delivered: "E dorëzuar me sukses",
        refused: "E refuzuar",
      };
      const label = statusLabels[pkg.status] || pkg.status;
      return { error: `Pakoja ${pkg.barcode} nuk mund të pranohet sërish (Statusi aktual: ${label}).` };
    }

    // Determine a valid office ID to avoid FK constraint error
    let targetOfficeId: string | null = null;
    if (officeId && officeId !== "default-office") {
      const [existingOffice] = await db
        .select({ id: offices.id })
        .from(offices)
        .where(eq(offices.id, officeId))
        .limit(1);
      if (existingOffice) {
        targetOfficeId = existingOffice.id;
      }
    }

    // Fallback to pkg.intakeOfficeId if actor doesn't belong to a specific office (e.g. Admin)
    if (!targetOfficeId) {
      targetOfficeId = pkg.intakeOfficeId;
    }

    await db
      .update(packages)
      .set({
        status: "accepted_at_intake",
        updatedAt: new Date(),
      })
      .where(eq(packages.id, pkg.id));

    await db.insert(packageEvents).values({
      packageId: pkg.id,
      status: "accepted_at_intake",
      actorId: actorId || null,
      officeId: targetOfficeId,
      notes: "Skanuar dhe pranuar në magazinën e zyrës.",
    });

    safeRevalidate("/office");
    safeRevalidate("/office/intake");
    safeRevalidate("/office/bags");
    return { success: true, package: pkg };
  } catch (error: any) {
    console.error("intakeScanPackageAction error:", error);
    return { error: error.message || "Ndodhi një gabim gjatë skanimit të pakos." };
  }
}

export async function createBagAction(originOfficeId: string, destinationOfficeId: string) {
  try {
    const barcode = generateCode("BAG", 5);
    const [bag] = await db
      .insert(bags)
      .values({
        barcode,
        originOfficeId,
        destinationOfficeId,
        status: "open",
      })
      .returning();

    safeRevalidate("/office/bags");
    return { success: true, bag };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function scanPackageIntoBagAction(bagId: string, packageBarcode: string, actorId: string) {
  try {
    const cleanBarcode = packageBarcode.trim();
    const [pkg] = await db
      .select()
      .from(packages)
      .where(eq(packages.barcode, cleanBarcode))
      .limit(1);

    if (!pkg) {
      return { error: `Pakoja ${cleanBarcode} nuk u gjet.` };
    }

    if (pkg.status !== "accepted_at_intake") {
      return { error: `Pakoja duhet të ketë statusin 'Pranuar në Zyrë' për t'u ngarkuar. Statusi aktual: ${pkg.status}` };
    }

    // Check if already in bag
    const [existing] = await db
      .select()
      .from(bagPackages)
      .where(and(eq(bagPackages.bagId, bagId), eq(bagPackages.packageId, pkg.id)))
      .limit(1);

    if (existing) {
      return { error: `Pakoja ${cleanBarcode} është shtuar tashmë në këtë çantë.` };
    }

    await db.insert(bagPackages).values({
      bagId,
      packageId: pkg.id,
    });

    await db
      .update(packages)
      .set({
        status: "bagged",
        updatedAt: new Date(),
      })
      .where(eq(packages.id, pkg.id));

    await db.insert(packageEvents).values({
      packageId: pkg.id,
      status: "bagged",
      actorId,
      notes: `Ngarkuar në çantë (ID: ${bagId}).`,
    });

    safeRevalidate("/office/bags");
    return { success: true, package: pkg };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function sealAndDispatchBagAction(bagId: string, courierId: string) {
  try {
    await db
      .update(bags)
      .set({
        status: "assigned",
        assignedCourierId: courierId,
        sealedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bags.id, bagId));

    safeRevalidate("/office/bags");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function verifyAndUnloadPackageAction(bagId: string, packageBarcode: string, actorId: string) {
  try {
    const cleanBarcode = packageBarcode.trim();
    const [pkg] = await db
      .select()
      .from(packages)
      .where(eq(packages.barcode, cleanBarcode))
      .limit(1);

    if (!pkg) {
      return { error: `Pakoja ${cleanBarcode} nuk u gjet.` };
    }

    const [item] = await db
      .select()
      .from(bagPackages)
      .where(and(eq(bagPackages.bagId, bagId), eq(bagPackages.packageId, pkg.id)))
      .limit(1);

    if (!item) {
      return { error: `Pakoja ${cleanBarcode} nuk i përket kësaj çante!` };
    }

    await db
      .update(bagPackages)
      .set({ verifiedAt: new Date() })
      .where(eq(bagPackages.id, item.id));

    await db
      .update(packages)
      .set({
        status: "received_at_dest_office",
        updatedAt: new Date(),
      })
      .where(eq(packages.id, pkg.id));

    await db.insert(packageEvents).values({
      packageId: pkg.id,
      status: "received_at_dest_office",
      actorId,
      notes: "Shkarkuar dhe verifikuar nga çanta në zyrën e destinacionit.",
    });

    safeRevalidate("/office/unloading");
    return { success: true, package: pkg };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function completeBagUnloadingAction(bagId: string) {
  try {
    // Check if all packages in bag are verified
    const items = await db.select().from(bagPackages).where(eq(bagPackages.bagId, bagId));
    const unverified = items.filter((i) => !i.verifiedAt);

    if (unverified.length > 0) {
      return { error: `Mbeten edhe ${unverified.length} pako të paverifikuara në këtë çantë.` };
    }

    await db
      .update(bags)
      .set({
        status: "unloaded",
        updatedAt: new Date(),
      })
      .where(eq(bags.id, bagId));

    safeRevalidate("/office/unloading");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function assignPackageForFinalDeliveryAction(packageId: string, courierId: string, actorId: string) {
  try {
    await db
      .update(packages)
      .set({
        status: "out_for_delivery",
        assignedCourierId: courierId,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, packageId));

    await db.insert(packageEvents).values({
      packageId,
      status: "out_for_delivery",
      actorId,
      notes: "Caktuar te korrieri për dorëzim përfundimtar te klienti.",
    });

    safeRevalidate("/office/delivery");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createOfficeDailyClosingAction(officeId: string, actorId: string, courierId: string) {
  try {
    // Find all delivered packages for this destination office that haven't been in a closing yet
    const delivered = await db
      .select()
      .from(packages)
      .where(
        and(
          eq(packages.destinationOfficeId, officeId),
          eq(packages.status, "delivered"),
          eq(packages.paymentType, "cod")
        )
      );

    const totalCod = delivered.reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0);
    const closingCode = generateCode("CLS", 6);

    const [closing] = await db
      .insert(officeClosings)
      .values({
        closingCode,
        officeId,
        closedById: actorId,
        totalCodCollected: totalCod.toFixed(2),
        packageCount: delivered.length,
        status: "in_transit_to_finance",
        courierId,
      })
      .returning();

    // Create cash transit record
    await db.insert(cashTransits).values({
      closingId: closing.id,
      courierId,
      amount: totalCod.toFixed(2),
      status: "in_transit",
      handedOverAt: new Date(),
    });

    safeRevalidate("/office/closing");
    return { success: true, closingCode, totalCod };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ==========================================
// 4. COURIER ACTIONS
// ==========================================

export async function acceptBagTransitAction(bagId: string, courierId: string) {
  try {
    await db
      .update(bags)
      .set({
        status: "in_transit",
        dispatchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bags.id, bagId));

    // Update all packages in bag to in_transit_interoffice
    const items = await db.select().from(bagPackages).where(eq(bagPackages.bagId, bagId));
    const packageIds = items.map((i) => i.packageId);

    if (packageIds.length > 0) {
      await db
        .update(packages)
        .set({
          status: "in_transit_interoffice",
          updatedAt: new Date(),
        })
        .where(inArray(packages.id, packageIds));
    }

    safeRevalidate("/courier/bags");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function markPackageDeliveredAction(packageId: string, courierId: string) {
  try {
    const [pkg] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
    if (!pkg) return { error: "Pakoja nuk u gjet." };

    await db
      .update(packages)
      .set({
        status: "delivered",
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(packages.id, packageId));

    await db.insert(packageEvents).values({
      packageId,
      status: "delivered",
      actorId: courierId,
      notes: `Dorëzuar me sukses te klienti. Vlera e mbledhur: ${pkg.amount} ALL.`,
    });

    safeRevalidate("/courier/deliveries");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function markPackageRefusedAction(packageId: string, courierId: string, reason: string) {
  try {
    await db
      .update(packages)
      .set({
        status: "refused",
        refusedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, packageId));

    await db.insert(packageEvents).values({
      packageId,
      status: "refused",
      actorId: courierId,
      notes: `Refuzuar nga klienti. Arsyeja: ${reason}`,
    });

    safeRevalidate("/courier/deliveries");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ==========================================
// 5. FINANCE ACTIONS
// ==========================================

export async function receiveCashTransitAction(transitId: string, financeUserId: string) {
  try {
    const [transit] = await db
      .select()
      .from(cashTransits)
      .where(eq(cashTransits.id, transitId))
      .limit(1);

    if (!transit) return { error: "Tranziti i parave nuk u gjet." };

    await db
      .update(cashTransits)
      .set({
        status: "received_by_finance",
        receivedAt: new Date(),
        receivedById: financeUserId,
      })
      .where(eq(cashTransits.id, transitId));

    await db
      .update(officeClosings)
      .set({
        status: "received_by_finance",
      })
      .where(eq(officeClosings.id, transit.closingId));

    // Get system settings for tariffs and office cut
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, "default")).limit(1);
    const totalTariff = parseFloat(settings?.totalTariffPerPackage || "300.00");
    const deliveryCut = parseFloat(settings?.deliveryOfficeCut || "100.00");

    // Fetch closing and its destination office
    const [closing] = await db.select().from(officeClosings).where(eq(officeClosings.id, transit.closingId)).limit(1);

    // Fetch delivered packages to generate payouts & commissions
    const deliveredPkgs = await db
      .select()
      .from(packages)
      .where(
        and(
          eq(packages.destinationOfficeId, closing.officeId),
          eq(packages.status, "delivered")
        )
      );

    for (const p of deliveredPkgs) {
      // Check if payout already created
      const [existingPayout] = await db
        .select()
        .from(financialPayouts)
        .where(eq(financialPayouts.packageId, p.id))
        .limit(1);

      if (!existingPayout) {
        // Fetch intake office for commission %
        const [intakeOffice] = await db
          .select()
          .from(offices)
          .where(eq(offices.id, p.intakeOfficeId))
          .limit(1);

        const intakePercent = parseFloat(intakeOffice?.intakeCommissionPercent || "15.00");
        const intakeCommission = (totalTariff * intakePercent) / 100;
        const codAmount = parseFloat(p.amount || "0");
        const sellerPayout = p.paymentType === "cod" ? Math.max(0, codAmount - totalTariff) : 0;

        await db.insert(financialPayouts).values({
          sellerId: p.sellerId,
          packageId: p.id,
          codAmount: codAmount.toFixed(2),
          postalTariff: totalTariff.toFixed(2),
          intakeOfficeCommission: intakeCommission.toFixed(2),
          deliveryOfficeCut: deliveryCut.toFixed(2),
          sellerPayoutAmount: sellerPayout.toFixed(2),
          status: "cleared",
          clearedAt: new Date(),
        });
      }
    }

    safeRevalidate("/finance");
    safeRevalidate("/finance/cash-intake");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function processSellerPayoutAction(payoutId: string, paymentReference: string) {
  try {
    await db
      .update(financialPayouts)
      .set({
        status: "paid",
        paymentReference,
        paidAt: new Date(),
      })
      .where(eq(financialPayouts.id, payoutId));

    safeRevalidate("/finance/payouts");
    safeRevalidate("/seller/payouts");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
