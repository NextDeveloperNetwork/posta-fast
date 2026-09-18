import { requireAuth } from "@/lib/auth-guards";
import { getOfficeData, getOfficesList } from "@/lib/queries";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import {
  Barcode,
  ShoppingBag,
  Truck,
  CheckSquare,
  Banknote,
  ArrowRight,
  Building2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function OfficeDashboardPage() {
  const { user } = await requireAuth(["office", "admin"]);
  const officesList = await getOfficesList();

  // If user has no officeId assigned, pick first available office (e.g. Tirana)
  const activeOfficeId = user.officeId || officesList[0]?.id;
  const data = await getOfficeData(activeOfficeId);

  const totalCodToClose = data.deliveredForClosing.reduce(
    (acc, p) => acc + parseFloat(p.amount || "0"),
    0
  );

  return (
    <div className="space-y-6">
      {/* Office Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fce883] text-neutral-950 font-black shadow-md shadow-[#fce883]/40">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50">
              {data.office?.name || "Zyra Postare"}
            </h1>
            <p className="text-xs text-neutral-500">
              Kodi: <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{data.office?.code}</span> •
              Qyteti: {data.office?.city} • Përqindja Pritëse:{" "}
              <span className="font-bold text-amber-600">{data.office?.intakeCommissionPercent}%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="bg-neutral-900 text-[#fce883] font-bold">
            <Link href="/office/intake">
              <Barcode className="w-4 h-4 mr-2" />
              Skano Pranimin
            </Link>
          </Button>
        </div>
      </div>

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Link
          href="/office/intake"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#fce883] transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pranimi (Scan)</span>
            <Barcode className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50">
            {data.pendingIntake.length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Pako në pritje pranimi</div>
        </Link>

        <Link
          href="/office/bags"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#fce883] transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ngarkim Çante</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50">
            {data.acceptedForBagging.length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Gati për t&apos;u paketuar</div>
        </Link>

        <Link
          href="/office/unloading"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#fce883] transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Çanta Mbërritur</span>
            <CheckSquare className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50">
            {data.incomingBags.filter((b) => b.status !== "unloaded").length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Për shkarkim & verifikim</div>
        </Link>

        <Link
          href="/office/delivery"
          className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#fce883] transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Dorëzim Klientit</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50">
            {data.readyForDelivery.length}
          </div>
        </Link>

        <Link
          href="/office/closing"
          className="p-4 rounded-2xl bg-amber-50 dark:bg-neutral-900 border border-amber-200/80 dark:border-neutral-700 shadow-xs hover:border-amber-400 transition-all group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-amber-800 dark:text-[#fce883] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mbyllja Ditore</span>
            <Banknote className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 truncate">
            {formatCurrency(totalCodToClose)}
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
            {data.deliveredForClosing.length} pako COD
          </div>
        </Link>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Outgoing bags panel */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" /> Çantat Dalëse nga Kjo Zyrë
            </h3>
            <Link href="/office/bags" className="text-xs font-bold text-amber-700 dark:text-[#fce883] hover:underline">
              Hap Modulin →
            </Link>
          </div>

          {data.originBags.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Nuk ka çanta të krijuara së fundmi.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.originBags.slice(0, 4).map((bag) => (
                <div
                  key={bag.id}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {bag.barcode}
                    </span>
                    <div className="text-neutral-400 text-[11px]">
                      Krijuar: {new Date(bag.createdAt).toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 font-bold rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] uppercase">
                    {bag.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming bags panel */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-600" /> Çantat Hyrëse për Shkarkim
            </h3>
            <Link href="/office/unloading" className="text-xs font-bold text-amber-700 dark:text-[#fce883] hover:underline">
              Shkarko & Verifiko →
            </Link>
          </div>

          {data.incomingBags.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Nuk ka çanta në ardhje.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.incomingBags.slice(0, 4).map((bag) => (
                <div
                  key={bag.id}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {bag.barcode}
                    </span>
                    <div className="text-neutral-400 text-[11px]">
                      Statusi: {bag.status}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link href={`/office/unloading?bag=${bag.id}`}>
                      Hap Çantën
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
