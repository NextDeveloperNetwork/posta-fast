import { requireAuth } from "@/lib/auth-guards";
import { getFinanceData } from "@/lib/queries";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import { Banknote, Coins, Wallet, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function FinanceDashboardPage() {
  const { user } = await requireAuth(["finance", "admin"]);
  const data = await getFinanceData();

  const pendingTransits = data.transits.filter((t) => t.status !== "received_by_finance");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Paneli Financiar & Arka Qendrore
          </h1>
          <p className="text-xs text-neutral-500">
            Llogaritja dhe shpërndarja e tarifave postare, pagesave COD dhe përqindjeve të zyrave.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="bg-neutral-900 text-[#fce883] font-bold">
            <Link href="/finance/cash-intake">
              <Banknote className="w-4 h-4 mr-2" />
              Prano Para nga Korrierët ({pendingTransits.length})
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Para të Pranuara në Kasë</span>
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-50">
            {formatCurrency(data.totalCashReceived)}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Verifikuar nga zarfet e zyrave</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tarifa Postare të Fituara</span>
            <Coins className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {formatCurrency(data.totalCommissionsEarned)}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Totali i tarifave të mbajtura</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pagesa COD në Pritje</span>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-50">
            {formatCurrency(data.totalPendingPayouts)}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Gati për likuidim te shitësit</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pagesa të Ekzekutuara</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600">
            {formatCurrency(data.totalPaidOut)}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Likuiduar me bankë te shitësit</div>
        </div>
      </div>

      {/* Pending Transits & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Cash Transits */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-600" />
              Zarfe Parash në Ardhje nga Zyrat ({pendingTransits.length})
            </h2>
            <Link href="/finance/cash-intake" className="text-xs font-bold text-amber-700 dark:text-[#fce883] hover:underline">
              Shiko të Gjitha →
            </Link>
          </div>

          {pendingTransits.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Të gjitha zarfet e dërguara nga zyrat janë pranuar në arkë.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingTransits.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(t.amount)}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Nisur: {new Date(t.createdAt).toLocaleDateString("sq-AL")}
                    </div>
                  </div>

                  <Button asChild size="sm" className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    <Link href="/finance/cash-intake">
                      Prano në Kasë
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribution Quick Breakdown */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Coins className="w-4 h-4 text-purple-600" />
              Ndarja e Tarifave & Komisioneve
            </h2>
            <Link href="/finance/commissions" className="text-xs font-bold text-amber-700 dark:text-[#fce883] hover:underline">
              Hap Raportin e Detajuar →
            </Link>
          </div>

          <p className="text-xs text-neutral-500">
            Sistemi llogarit automatikisht përqindjen e zyrës pritëse (caktuar nga Admin), tarifën fikse të zyrës dorëzuese dhe fitimin neto të Posta Fast.
          </p>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between font-medium">
              <span className="text-neutral-500">Kanalet e Veprimit:</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">2 Kanale Operative</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Kanali 1:</span>
              <span className="text-neutral-700 dark:text-neutral-300">Shitës → Zyrë → Tranzit → Klient</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Kanali 2:</span>
              <span className="text-neutral-700 dark:text-neutral-300">COD Klienti → Zyrë → Financë → Likuidim Shitësi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
