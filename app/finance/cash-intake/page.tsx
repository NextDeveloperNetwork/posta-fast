import { requireAuth } from "@/lib/auth-guards";
import { getFinanceData } from "@/lib/queries";
import { receiveCashTransitAction } from "@/app/actions/courier-system";
import { formatCurrency } from "@/lib/currency";
import { Banknote, ArrowLeft, CheckCircle2, Building2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function FinanceCashIntakePage() {
  const { user } = await requireAuth(["finance", "admin"]);
  const data = await getFinanceData();

  async function handleReceiveTransit(formData: FormData) {
    "use server";
    const transitId = String(formData.get("transitId") || "");
    await receiveCashTransitAction(transitId, user.id);
    revalidatePath("/finance/cash-intake");
  }

  const pendingTransits = data.transits.filter((t) => t.status !== "received_by_finance");
  const receivedTransits = data.transits.filter((t) => t.status === "received_by_finance");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="p-2">
          <Link href="/finance">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Pranimi i Parave të Zyrës në Arkë
          </h1>
          <p className="text-xs text-neutral-500">
            Verifikoni zarfin fizik me para nga korrieri. Pranimi do të llogarisë automatikisht komisionet dhe pagesat për shitësit.
          </p>
        </div>
      </div>

      {/* Pending Transits */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Zarfe Parash në Pritje Verifikimi ({pendingTransits.length})
          </h2>
        </div>

        {pendingTransits.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            Nuk ka zarfe parash në pritje. Kur një zyrë të kryejë mbylljen ditore dhe të nisë korrierin, zarfi do të shfaqet këtu.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {pendingTransits.map((t) => (
              <div
                key={t.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50/20 dark:bg-neutral-850"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-2xl text-neutral-900 dark:text-neutral-50">
                      {formatCurrency(t.amount)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      Në Tranzit
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    Nisur më: {new Date(t.createdAt).toLocaleDateString("sq-AL")} • Korrieri: {t.courierId}
                  </div>
                </div>

                <form action={handleReceiveTransit}>
                  <input type="hidden" name="transitId" value={t.id} />
                  <Button
                    type="submit"
                    className="h-11 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verifiko & Prano Paratë në Kasë
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previously Received Transits */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Zarfe të Pranuara në Kasë ({receivedTransits.length})
          </h2>
        </div>

        {receivedTransits.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            Asnjë zarf i pranuar më parë.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800 text-xs">
            {receivedTransits.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(t.amount)}
                  </span>
                  <div className="text-neutral-400 text-[11px]">
                    Pranuar më: {new Date(t.createdAt).toLocaleDateString("sq-AL")}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full font-bold text-[10px] uppercase bg-emerald-100 text-emerald-800">
                  Pranuar & Likuiduar
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
