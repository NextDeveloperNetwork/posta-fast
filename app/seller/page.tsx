import { requireAuth } from "@/lib/auth-guards";
import { getSellerData } from "@/lib/queries";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import { PlusCircle, Package, Truck, CheckCircle2, XCircle, Wallet, ArrowRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";

export default async function SellerDashboardPage() {
  const { user } = await requireAuth(["seller", "admin"]);
  const { packages: sellerPkgs, payouts, pendingCod, paidCod } = await getSellerData(user.id);

  const totalDelivered = sellerPkgs.filter((p) => p.status === "delivered").length;
  const totalInTransit = sellerPkgs.filter((p) => !["delivered", "refused", "created"].includes(p.status)).length;
  const totalRefused = sellerPkgs.filter((p) => p.status === "refused").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Dorëzuar</span>;
      case "refused":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">Refuzuar</span>;
      case "accepted_at_intake":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Në Zyrë</span>;
      case "bagged":
      case "in_transit_interoffice":
      case "out_for_delivery":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Në Tranzit</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">Krijuar</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Paneli i Shitësit
          </h1>
          <p className="text-sm text-neutral-500">
            Mirësevini, {user.name}. Menaxhoni dërgesat tuaja dhe pagesat COD.
          </p>
        </div>

        <Button asChild className="font-bold bg-neutral-900 text-[#fce883] hover:bg-neutral-800 shadow-md">
          <Link href="/seller/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            Krijo Pako të Re
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Totali i Pakove</span>
            <Package className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">{sellerPkgs.length}</div>
          <div className="text-xs text-neutral-400 mt-1">Dërgesa të regjistruara</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dorëzuar me Sukses</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">{totalDelivered}</div>
          <div className="text-xs text-neutral-400 mt-1">{totalRefused} të refuzuara</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Në Tranzit</span>
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">{totalInTransit}</div>
          <div className="text-xs text-neutral-400 mt-1">Rrugës te klienti</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100/50 dark:from-neutral-900 dark:to-neutral-800 border border-amber-200/60 dark:border-neutral-700 shadow-xs">
          <div className="flex items-center justify-between text-amber-900 dark:text-[#fce883] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pagesat COD në Pritje</span>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-50">
            {formatCurrency(pendingCod)}
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">
            {formatCurrency(paidCod)} të likuiduara
          </div>
        </div>
      </div>

      {/* Recent Packages Table / Mobile Cards */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Pakot e Fundit
          </h2>
          <Link
            href="/seller/packages"
            className="text-xs font-bold text-amber-700 dark:text-[#fce883] hover:underline flex items-center gap-1"
          >
            Shiko të gjitha <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {sellerPkgs.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="font-bold text-neutral-700 dark:text-neutral-300">Nuk keni asnjë pako ende</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-4">Krijoni pakon tuaj të parë për ta nisur me Posta Fast.</p>
            <Button asChild className="bg-neutral-900 text-[#fce883]">
              <Link href="/seller/new">Krijo Pako</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {sellerPkgs.slice(0, 8).map((pkg) => (
              <div
                key={pkg.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="shrink-0">
                    <BarcodeBadge value={pkg.barcode} height={32} width={1.2} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {pkg.clientName}
                      </span>
                      {getStatusBadge(pkg.status)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      📞 {pkg.clientPhone} • 📍 {pkg.clientAddress}, {pkg.clientCity}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                  <div className="text-left sm:text-right">
                    <div className="font-black text-sm text-neutral-900 dark:text-neutral-50">
                      {pkg.paymentType === "cod" ? formatCurrency(pkg.amount) : "E Parapaguar"}
                    </div>
                    <div className="text-[10px] text-neutral-400 uppercase font-medium">
                      {pkg.paymentType.toUpperCase()}
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                    <Link href={`/seller/print/${pkg.id}`} target="_blank">
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Etiketë
                    </Link>
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
