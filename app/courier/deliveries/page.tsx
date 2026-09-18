import { requireAuth } from "@/lib/auth-guards";
import { getCourierData } from "@/lib/queries";
import {
  markPackageDeliveredAction,
  markPackageRefusedAction,
} from "@/app/actions/courier-system";
import { formatCurrency } from "@/lib/currency";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, CheckCircle2, XCircle, ArrowLeft, Truck } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function CourierDeliveriesPage() {
  const { user } = await requireAuth(["courier", "admin"]);
  const data = await getCourierData(user.id);

  const pending = data.assignedDeliveries.filter((d) => d.status === "out_for_delivery");
  const completed = data.assignedDeliveries.filter((d) => ["delivered", "refused"].includes(d.status));

  async function handleDeliver(formData: FormData) {
    "use server";
    const packageId = String(formData.get("packageId") || "");
    await markPackageDeliveredAction(packageId, user.id);
    revalidatePath("/courier/deliveries");
  }

  async function handleRefuse(formData: FormData) {
    "use server";
    const packageId = String(formData.get("packageId") || "");
    const reason = String(formData.get("reason") || "Refuzuar nga klienti");
    await markPackageRefusedAction(packageId, user.id, reason);
    revalidatePath("/courier/deliveries");
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="p-2">
          <Link href="/courier">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Dorëzimet e Mia te Klientët
          </h1>
          <p className="text-xs text-neutral-500">
            Telefononi klientin, mblidhni vlerën COD ose shënoni arsyen e refuzimit.
          </p>
        </div>
      </div>

      {/* Pending Deliveries Cards */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Në Proces Dorëzimi ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-400">
            🎉 Nuk keni asnjë dërgesë të mbetur për sot!
          </div>
        ) : (
          pending.map((pkg) => (
            <div
              key={pkg.id}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-4"
            >
              {/* Card Header: Client & Barcode */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-lg text-neutral-900 dark:text-neutral-50">
                    {pkg.clientName}
                  </h3>
                  <div className="font-mono text-xs text-neutral-400 mt-0.5">
                    {pkg.barcode}
                  </div>
                </div>
                <BarcodeBadge value={pkg.barcode} height={28} width={1.1} />
              </div>

              {/* Address & Call Button */}
              <div className="space-y-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs">
                <div className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <span className="font-medium">
                    {pkg.clientAddress}
                    {pkg.clientCity ? `, ${pkg.clientCity}` : ""}
                  </span>
                </div>

                {pkg.notes && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 italic">
                    Shënim: {pkg.notes}
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-200/50 dark:border-neutral-700 flex items-center justify-between">
                  <span className="text-neutral-500">Telefoni:</span>
                  <a
                    href={`tel:${pkg.clientPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {pkg.clientPhone}
                  </a>
                </div>
              </div>

              {/* Payment Section */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-neutral-800/60 border border-amber-200/60 dark:border-neutral-700">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase">
                  Vlera për t&apos;u mbledhur:
                </span>
                <span className="font-mono font-black text-xl text-neutral-900 dark:text-neutral-50">
                  {pkg.paymentType === "cod" ? formatCurrency(pkg.amount) : "E Parapaguar"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Deliver Button */}
                <form action={handleDeliver}>
                  <input type="hidden" name="packageId" value={pkg.id} />
                  <Button
                    type="submit"
                    className="w-full h-11 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Dorëzo & Mblidh Paratë
                  </Button>
                </form>

                {/* Refuse Form */}
                <form action={handleRefuse} className="flex gap-1.5">
                  <input type="hidden" name="packageId" value={pkg.id} />
                  <select
                    name="reason"
                    className="h-11 px-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px] font-medium flex-1"
                  >
                    <option value="Refuzuar nga klienti">Klienti Refuzoi</option>
                    <option value="Nuk përgjigjet në telefon">Nuk Përgjigjet</option>
                    <option value="Adresë e pasaktë">Adresë e Gabuar</option>
                    <option value="Kërkon shtyrje date">Shtyrje Date</option>
                  </select>
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-11 px-3 text-xs font-bold text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50"
                  >
                    Refuzo
                  </Button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Completed Deliveries Today */}
      {completed.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Dorëzimet e Përfunduara Sot ({completed.length})
          </h2>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
            {completed.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold">{p.clientName}</span>
                  <div className="text-[10px] text-neutral-400 font-mono">{p.barcode}</div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    p.status === "delivered"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {p.status === "delivered" ? "Dorëzuar" : "Refuzuar"}
                  </span>
                  <div className="font-mono font-bold text-[11px] mt-0.5">
                    {formatCurrency(p.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
