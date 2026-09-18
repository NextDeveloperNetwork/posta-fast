import { requireAuth } from "@/lib/auth-guards";
import { getFinanceData } from "@/lib/queries";
import { processSellerPayoutAction } from "@/app/actions/courier-system";
import { formatCurrency } from "@/lib/currency";
import { Wallet, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function FinancePayoutsPage() {
  const { user } = await requireAuth(["finance", "admin"]);
  const data = await getFinanceData();

  const pendingPayouts = data.payouts.filter((p) => p.status === "cleared");
  const paidPayouts = data.payouts.filter((p) => p.status === "paid");

  async function handlePaySeller(formData: FormData) {
    "use server";
    const payoutId = String(formData.get("payoutId") || "");
    const ref = String(formData.get("reference") || "BKT-TRANS-001");
    await processSellerPayoutAction(payoutId, ref);
    revalidatePath("/finance/payouts");
  }

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
            Likuidimi i Pagesave për Shitësit (COD)
          </h1>
          <p className="text-xs text-neutral-500">
            Paratë e mbledhura nga klientët pas zbritjes së tarifës postare transferohen te tregtarët.
          </p>
        </div>
      </div>

      {/* Pending Payouts Action List */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            Pagesa të Pastruara në Pritje për Likuidim ({pendingPayouts.length})
          </h2>
        </div>

        {pendingPayouts.length === 0 ? (
          <div className="p-10 text-center text-xs text-neutral-400">
            Nuk ka pagesa të prapambetura për t&apos;u likuiduar. Të gjitha pagesat janë ekzekutuar.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {pendingPayouts.map((p) => (
              <div
                key={p.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      Shitësi ID: {p.sellerId.substring(0, 8)}...
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                      Gati për Pagesë
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    COD i Mbledhur: {formatCurrency(p.codAmount)} • Tarifa e Zbritur:{" "}
                    <span className="text-red-600 font-semibold">-{formatCurrency(p.postalTariff)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                      Vlera Neto
                    </span>
                    <span className="font-mono font-black text-xl text-emerald-600">
                      {formatCurrency(p.sellerPayoutAmount)}
                    </span>
                  </div>

                  <form action={handlePaySeller} className="flex items-center gap-2">
                    <input type="hidden" name="payoutId" value={p.id} />
                    <Input
                      name="reference"
                      defaultValue="BKT-TRANS"
                      placeholder="Nr. Referencë..."
                      className="h-10 w-36 text-xs font-mono"
                    />
                    <Button
                      type="submit"
                      className="h-10 px-4 text-xs font-bold bg-neutral-900 text-[#fce883] hover:bg-neutral-800 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Paguaj
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Payouts History */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Pagesat e Likuiduara më Parë ({paidPayouts.length})
          </h2>
        </div>

        {paidPayouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            Asnjë pagesë e likuiduar më parë.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800 text-xs">
            {paidPayouts.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(p.sellerPayoutAmount)}
                  </span>
                  <div className="text-neutral-400 text-[11px] font-mono">
                    Ref: {p.paymentReference} • Paguar më: {new Date(p.paidAt || p.createdAt).toLocaleDateString("sq-AL")}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full font-bold text-[10px] uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Likuiduar
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
