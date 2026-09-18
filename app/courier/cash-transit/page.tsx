import { requireAuth } from "@/lib/auth-guards";
import { getCourierData } from "@/lib/queries";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Banknote, ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function CourierCashTransitPage() {
  const { user } = await requireAuth(["courier", "admin"]);
  const data = await getCourierData(user.id);

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
            Tranziti i Parave në Financë
          </h1>
          <p className="text-xs text-neutral-500">
            Zarfet e mbylljeve ditore të marra nga zyrat për t&apos;u dorëzuar në arkën e Financës.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.assignedTransits.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-400">
            Nuk keni asnjë dërgesë parash të caktuar për në Financë.
          </div>
        ) : (
          data.assignedTransits.map((transit) => (
            <div
              key={transit.id}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Zarf Parash COD
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    transit.status === "received_by_finance"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {transit.status === "received_by_finance"
                    ? "Dorëzuar në Kasë"
                    : "Në Tranzit"}
                </span>
              </div>

              <div className="font-mono font-black text-2xl text-neutral-900 dark:text-neutral-50">
                {formatCurrency(transit.amount)}
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 text-xs text-neutral-500">
                Dorëzojani arkëtarit të Financës. Financa do ta skanojë dhe pranojë vlerën menjëherë.
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
