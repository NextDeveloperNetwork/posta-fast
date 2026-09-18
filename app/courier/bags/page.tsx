import { requireAuth } from "@/lib/auth-guards";
import { getCourierData } from "@/lib/queries";
import { db } from "@/db";
import { offices } from "@/db/schema";
import { acceptBagTransitAction } from "@/app/actions/courier-system";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Truck, CheckCircle2, MapPin } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function CourierBagsPage() {
  const { user } = await requireAuth(["courier", "admin"]);
  const data = await getCourierData(user.id);
  const allOffices = await db.select().from(offices);

  const getOfficeName = (id: string) => {
    return allOffices.find((o) => o.id === id)?.name || "Zyrë";
  };

  async function handleAcceptTransit(formData: FormData) {
    "use server";
    const bagId = String(formData.get("bagId") || "");
    await acceptBagTransitAction(bagId, user.id);
    revalidatePath("/courier/bags");
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
            Çantat e Mia në Tranzit
          </h1>
          <p className="text-xs text-neutral-500">
            Pranoni çantat e caktuara nga zyrë-marrësi dhe dorëzojini në zyrën e destinacionit.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.assignedBags.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-400">
            Nuk keni asnjë çantë të caktuar për transport aktualisht.
          </div>
        ) : (
          data.assignedBags.map((bag) => (
            <div
              key={bag.id}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-black text-lg text-neutral-900 dark:text-neutral-50">
                    {bag.barcode}
                  </span>
                  <div className="text-xs text-neutral-400">
                    Statusi:{" "}
                    <span className="font-bold text-amber-600 uppercase">
                      {bag.status}
                    </span>
                  </div>
                </div>
                <BarcodeBadge value={bag.barcode} height={30} width={1.2} />
              </div>

              {/* Origin to Destination */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Nisja:</span>
                  <span className="font-bold">{getOfficeName(bag.originOfficeId)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-200/60 dark:border-neutral-700 pt-1.5">
                  <span className="text-neutral-500">Destinacioni:</span>
                  <span className="font-black text-amber-700 dark:text-[#fce883]">
                    📍 {getOfficeName(bag.destinationOfficeId)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {bag.status === "assigned" && (
                <form action={handleAcceptTransit}>
                  <input type="hidden" name="bagId" value={bag.id} />
                  <Button
                    type="submit"
                    className="w-full h-11 font-bold text-xs bg-neutral-900 text-[#fce883] hover:bg-neutral-800"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Prano Çantën për Transport
                  </Button>
                </form>
              )}

              {bag.status === "in_transit" && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center text-xs font-bold text-blue-800 dark:text-blue-300">
                  🚚 Çanta është në rrugë drejt {getOfficeName(bag.destinationOfficeId)}. Zyra pritëse do ta skanojë për shkarkim.
                </div>
              )}

              {bag.status === "unloaded" && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  ✓ Çanta u dorëzua dhe u shkarkua me sukses.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
