import { requireAuth } from "@/lib/auth-guards";
import { getCourierData } from "@/lib/queries";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import { Truck, ShoppingBag, Banknote, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CourierDashboardPage() {
  const { user } = await requireAuth(["courier", "admin"]);
  const data = await getCourierData(user.id);

  const pendingDeliveries = data.assignedDeliveries.filter((d) => d.status === "out_for_delivery");
  const deliveredToday = data.assignedDeliveries.filter((d) => d.status === "delivered");
  const activeBags = data.assignedBags.filter((b) => b.status !== "unloaded");

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Welcome & Cash in Hand Header */}
      <div className="p-5 rounded-3xl bg-neutral-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#fce883]">
              Korrier Posta Fast
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#fce883] text-neutral-950 font-black text-sm">
              ⚡
            </span>
          </div>

          <div className="mt-4">
            <div className="text-xs text-neutral-400 font-medium">Para në Dorë (COD i Mbledhur Sot)</div>
            <div className="text-3xl sm:text-4xl font-black text-[#fce883] tracking-tight mt-1">
              {formatCurrency(data.totalCodCollected)}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Dorëzuar me sukses: {deliveredToday.length} pako
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#fce883]/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/courier/deliveries"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#fce883] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <Truck className="w-5 h-5" />
              <span className="font-mono text-xl font-black text-neutral-900 dark:text-neutral-50">
                {pendingDeliveries.length}
              </span>
            </div>
            <span className="font-bold text-sm block leading-tight">Dorëzimet e Mia</span>
            <span className="text-[11px] text-neutral-400">Te klientët</span>
          </div>
          <div className="mt-3 text-[11px] font-bold text-amber-700 dark:text-[#fce883] flex items-center">
            Hap listën <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>

        <Link
          href="/courier/bags"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#fce883] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-blue-600 mb-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-mono text-xl font-black text-neutral-900 dark:text-neutral-50">
                {activeBags.length}
              </span>
            </div>
            <span className="font-bold text-sm block leading-tight">Çantat në Tranzit</span>
            <span className="text-[11px] text-neutral-400">Midis zyrave</span>
          </div>
          <div className="mt-3 text-[11px] font-bold text-amber-700 dark:text-[#fce883] flex items-center">
            Hap listën <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>
      </div>

      {/* Cash transit button */}
      <Link
        href="/courier/cash-transit"
        className="block p-4 rounded-2xl bg-amber-50/80 dark:bg-neutral-900 border border-amber-200/80 dark:border-neutral-800 shadow-xs hover:border-amber-400 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-200/60 dark:bg-neutral-800 text-amber-800 dark:text-[#fce883]">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Tranziti i Kasës në Financë
              </div>
              <div className="text-xs text-neutral-500">
                {data.assignedTransits.filter((t) => t.status !== "received_by_finance").length} zarfe parash caktuar
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </div>
      </Link>

      {/* Priority Pending Deliveries */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Dërgesat me Përparësi ({pendingDeliveries.length})
          </h2>
          <Link href="/courier/deliveries" className="text-xs font-bold text-amber-700 dark:text-[#fce883]">
            Shiko të gjitha →
          </Link>
        </div>

        {pendingDeliveries.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            🎉 Nuk keni pako në pritje për dorëzim!
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingDeliveries.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{p.clientName}</span>
                  <span className="text-emerald-600 font-mono">
                    {p.paymentType === "cod" ? formatCurrency(p.amount) : "Prepaid"}
                  </span>
                </div>
                <div className="text-neutral-500 text-[11px] mt-0.5 truncate">
                  📍 {p.clientAddress}
                </div>
                <div className="mt-2 flex items-center justify-between pt-2 border-t border-neutral-200/50 dark:border-neutral-700">
                  <a
                    href={`tel:${p.clientPhone}`}
                    className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" /> {p.clientPhone}
                  </a>
                  <Button asChild size="sm" className="h-7 px-3 text-xs bg-neutral-900 text-[#fce883] font-bold">
                    <Link href="/courier/deliveries">Vepro</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
