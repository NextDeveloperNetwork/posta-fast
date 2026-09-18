import { requireAuth } from "@/lib/auth-guards";
import { getSellerData } from "@/lib/queries";
import { formatCurrency } from "@/lib/currency";
import { Wallet, CheckCircle2, Clock, Banknote } from "lucide-react";

export default async function SellerPayoutsPage() {
  const { user } = await requireAuth(["seller", "admin"]);
  const { payouts, pendingCod, paidCod } = await getSellerData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
          Pasqyra e Pagesave COD
        </h1>
        <p className="text-xs text-neutral-500">
          Llogaritja automatike e parave të mbledhura pas zbritjes së tarifës postare.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-neutral-900 border border-amber-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pagesa në Pritje të Likuidimit</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-neutral-900 dark:text-neutral-50">
            {formatCurrency(pendingCod)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Paratë janë mbledhur nga korrierët dhe po procesohen nga Financa.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-neutral-900 border border-emerald-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pagesa të Likuiduara (Të Pagura)</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {formatCurrency(paidCod)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Paratë janë transferuar me sukses në llogarinë tuaj bankare.
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Historiku i Pagesave për Çdo Pako
          </h2>
        </div>

        {payouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            Nuk keni ende pagesa të llogaritura. Pagesat shfaqen pasi pakot dorëzohen me sukses.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 font-semibold">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">COD i Mbledhur</th>
                  <th className="py-3 px-4">Tarifa Postare</th>
                  <th className="py-3 px-4">Neto për Ju</th>
                  <th className="py-3 px-4">Statusi</th>
                  <th className="py-3 px-4">Referenca</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-mono text-xs">
                      {new Date(p.createdAt).toLocaleDateString("sq-AL")}
                    </td>
                    <td className="py-3 px-4 font-bold">{formatCurrency(p.codAmount)}</td>
                    <td className="py-3 px-4 text-red-600">-{formatCurrency(p.postalTariff)}</td>
                    <td className="py-3 px-4 font-black text-emerald-600">
                      {formatCurrency(p.sellerPayoutAmount)}
                    </td>
                    <td className="py-3 px-4">
                      {p.status === "paid" ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                          E Paguar
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                          Në Pritje
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-neutral-500">
                      {p.paymentReference || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
