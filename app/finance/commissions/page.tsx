import { requireAuth } from "@/lib/auth-guards";
import { getFinanceData } from "@/lib/queries";
import { formatCurrency } from "@/lib/currency";
import { Coins, ArrowLeft, Building2, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function FinanceCommissionsPage() {
  const { user } = await requireAuth(["finance", "admin"]);
  const data = await getFinanceData();

  const totalIntakeCommissions = data.payouts.reduce(
    (acc, p) => acc + parseFloat(p.intakeOfficeCommission || "0"),
    0
  );

  const totalDeliveryCuts = data.payouts.reduce(
    (acc, p) => acc + parseFloat(p.deliveryOfficeCut || "0"),
    0
  );

  const totalPostalTariffs = data.payouts.reduce(
    (acc, p) => acc + parseFloat(p.postalTariff || "0"),
    0
  );

  const companyNetProfit = totalPostalTariffs - totalIntakeCommissions - totalDeliveryCuts;

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
            Ndarja e Tarifave & Komisioneve për Çdo Pako
          </h1>
          <p className="text-xs text-neutral-500">
            Përllogaritja sipas rregullave: Tarifa e Përgjithshme (Admin), Përqindja e Zyrës Pritëse (Zyra) dhe Përfitimi i Zyrës Dorëzuese.
          </p>
        </div>
      </div>

      {/* Summary Distribution Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Totali i Tarifave
          </span>
          <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50 mt-1">
            {formatCurrency(totalPostalTariffs)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Mbajtur nga dërgesat</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-neutral-900 border border-blue-200/80 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Pjesa e Zyrave Pritëse (%)
          </span>
          <div className="text-2xl font-black text-blue-800 dark:text-blue-300 mt-1">
            {formatCurrency(totalIntakeCommissions)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Sipas % së caktuar në Admin</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-neutral-900 border border-emerald-200/80 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Pjesa e Zyrave Dorëzuese
          </span>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
            {formatCurrency(totalDeliveryCuts)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Tarifa fikse për zyrën dorëzuese</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100/50 dark:from-neutral-900 dark:to-neutral-850 border border-amber-200/80 dark:border-neutral-700 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-[#fce883]">
            Fitimi Neto i Posta Fast
          </span>
          <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50 mt-1">
            {formatCurrency(companyNetProfit)}
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
            Mbetja pas zbritjes së zyrave
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Zbardhja Financiare sipas Çdo Pakoje
          </h2>
        </div>

        {data.payouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            Nuk ka pako të llogaritura ende. Kur korrierët të dorëzojnë pakot dhe kasa të pranohet në Financë, të dhënat do të shfaqen këtu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 font-semibold">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">COD i Mbledhur</th>
                  <th className="py-3 px-4">Tarifa Totale</th>
                  <th className="py-3 px-4 text-blue-600">Pjesa e Zyrës Pritëse</th>
                  <th className="py-3 px-4 text-emerald-600">Pjesa e Zyrës Dorëzuese</th>
                  <th className="py-3 px-4 font-bold text-amber-700">Fitimi Posta Fast</th>
                  <th className="py-3 px-4 font-black">Neto Shitësi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
                {data.payouts.map((p) => {
                  const tariff = parseFloat(p.postalTariff || "0");
                  const intakeCut = parseFloat(p.intakeOfficeCommission || "0");
                  const deliveryCut = parseFloat(p.deliveryOfficeCut || "0");
                  const pfProfit = tariff - intakeCut - deliveryCut;

                  return (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-mono text-xs">
                        {new Date(p.createdAt).toLocaleDateString("sq-AL")}
                      </td>
                      <td className="py-3 px-4 font-bold">{formatCurrency(p.codAmount)}</td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(p.postalTariff)}</td>
                      <td className="py-3 px-4 text-blue-600 font-mono font-medium">
                        {formatCurrency(intakeCut)}
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-mono font-medium">
                        {formatCurrency(deliveryCut)}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700 dark:text-[#fce883]">
                        {formatCurrency(pfProfit)}
                      </td>
                      <td className="py-3 px-4 font-black text-neutral-900 dark:text-neutral-50">
                        {formatCurrency(p.sellerPayoutAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
