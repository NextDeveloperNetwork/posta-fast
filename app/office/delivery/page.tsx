import { requireAuth } from "@/lib/auth-guards";
import { getOfficeData, getOfficesList } from "@/lib/queries";
import { assignPackageForFinalDeliveryAction } from "@/app/actions/courier-system";
import { formatCurrency } from "@/lib/currency";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import { Button } from "@/components/ui/button";
import { Truck, ArrowLeft, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function OfficeDeliveryDispatchPage() {
  const { user } = await requireAuth(["office", "admin"]);
  const officesList = await getOfficesList();
  const officeId = user.officeId || officesList[0]?.id;
  const { readyForDelivery, outForDelivery, couriers } = await getOfficeData(officeId);

  async function handleAssignDelivery(formData: FormData) {
    "use server";
    const packageId = String(formData.get("packageId") || "");
    const courierId = String(formData.get("courierId") || "");
    await assignPackageForFinalDeliveryAction(packageId, courierId, user.id);
    revalidatePath("/office/delivery");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="p-2">
          <Link href="/office">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Caktimi për Dorëzimin Përfundimtar
          </h1>
          <p className="text-xs text-neutral-500">
            Pakot e shkarkuara nga çanta caktohen te korrierët lokalë për dërgim te klienti.
          </p>
        </div>
      </div>

      {/* Ready for delivery section */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            Pako Gati për Shpërndarje ({readyForDelivery.length})
          </h2>
        </div>

        {readyForDelivery.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            Nuk ka pako në pritje për caktim korrieri. Shkarkoni çanta të reja për të shtuar pako.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {readyForDelivery.map((pkg) => (
              <div
                key={pkg.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <BarcodeBadge value={pkg.barcode} height={32} width={1.2} />
                  <div>
                    <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      {pkg.clientName}
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-3 mt-0.5">
                      <span>📞 {pkg.clientPhone}</span>
                      <span>📍 {pkg.clientAddress}, {pkg.clientCity}</span>
                    </div>
                    <div className="font-mono font-black text-sm text-emerald-600 mt-1">
                      {pkg.paymentType === "cod" ? formatCurrency(pkg.amount) : "E Parapaguar"}
                    </div>
                  </div>
                </div>

                {/* Courier assignment form */}
                <form action={handleAssignDelivery} className="flex items-center gap-2">
                  <input type="hidden" name="packageId" value={pkg.id} />
                  <select
                    name="courierId"
                    required
                    className="h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
                  >
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || c.email})
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" className="h-10 bg-neutral-900 text-[#fce883] font-bold text-xs">
                    Cakto Korrierin
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Out for delivery list */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Aktualisht në Rrugë te Klienti ({outForDelivery.length})
          </h2>
        </div>

        {outForDelivery.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            Asnjë pako nuk është në proces dorëzimi aktualisht.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {outForDelivery.map((pkg) => (
              <div key={pkg.id} className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold">{pkg.clientName}</span>
                  <span className="text-neutral-400 ml-2 font-mono">({pkg.barcode})</span>
                  <div className="text-neutral-500 text-[11px]">📍 {pkg.clientAddress}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-600">{formatCurrency(pkg.amount)}</span>
                  <div className="text-[10px] text-neutral-400">Në dorëzim</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
