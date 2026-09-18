import { requireAuth } from "@/lib/auth-guards";
import { getOfficeData, getOfficesList } from "@/lib/queries";
import { createOfficeDailyClosingAction } from "@/app/actions/courier-system";
import { formatCurrency } from "@/lib/currency";
import { Banknote, ArrowLeft, Send, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function OfficeClosingPage() {
  const { user } = await requireAuth(["office", "admin"]);
  const officesList = await getOfficesList();
  const officeId = user.officeId || officesList[0]?.id;
  const { deliveredForClosing, closings, couriers } = await getOfficeData(officeId);

  const totalCodCollected = deliveredForClosing.reduce(
    (acc, p) => acc + parseFloat(p.amount || "0"),
    0
  );

  async function handleMakeClosing(formData: FormData) {
    "use server";
    const courierId = String(formData.get("courierId") || "");
    await createOfficeDailyClosingAction(officeId, user.id, courierId);
    revalidatePath("/office/closing");
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
            Mbyllja Ditore e Parave (Kasa & Tranziti në Financë)
          </h1>
          <p className="text-xs text-neutral-500">
            Mblidhni të gjitha paratë COD të dorëzuara nga korrierët dhe caktoni korrierin për t&apos;i dërguar në Financë.
          </p>
        </div>
      </div>

      {/* Cash Closing Action Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100/50 dark:from-neutral-900 dark:to-neutral-850 border border-amber-200/80 dark:border-neutral-700 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-amber-200/60 dark:border-neutral-700">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-[#fce883]">
              Paratë COD të Mbledhura për Mbyllje Sot
            </span>
            <div className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-neutral-50 mt-1">
              {formatCurrency(totalCodCollected)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Gjithsej {deliveredForClosing.length} dërgesa të dorëzuara me sukses me pagesë COD.
            </div>
          </div>

          <Banknote className="w-14 h-14 text-amber-600/40 shrink-0" />
        </div>

        {totalCodCollected > 0 ? (
          <form action={handleMakeClosing} className="mt-5 space-y-3">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
              Zgjidhni Korrierin që do të Transportojë Kasën në Financë:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                name="courierId"
                required
                className="flex-1 h-11 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
              >
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.email})
                  </option>
                ))}
              </select>

              <Button
                type="submit"
                className="h-11 px-6 font-bold bg-neutral-900 text-[#fce883] hover:bg-neutral-800 shadow-md text-xs"
              >
                <Send className="w-4 h-4 mr-2" />
                Krijo Mbylljen & Nis Tranzitin
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 text-xs text-neutral-500 font-medium">
            Nuk ka para të pambyllura aktualisht. Pas dorëzimit të pakove të reja me COD, vlera do të shfaqet këtu.
          </div>
        )}
      </div>

      {/* Closings History */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Historiku i Mbylljeve Ditore të Zyrës
          </h2>
        </div>

        {closings.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            Nuk ka mbyllje të regjistruara më parë.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {closings.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {c.closingCode}
                  </div>
                  <div className="text-neutral-500 text-[11px] mt-0.5">
                    Data: {new Date(c.closingDate).toLocaleDateString("sq-AL")} • {c.packageCount} pako
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-sm text-neutral-900 dark:text-neutral-50">
                    {formatCurrency(c.totalCodCollected)}
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    c.status === "received_by_finance"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {c.status === "received_by_finance" ? "Pranuar në Financë" : "Në Tranzit"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
