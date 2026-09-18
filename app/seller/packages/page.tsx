import { requireAuth } from "@/lib/auth-guards";
import { getSellerData } from "@/lib/queries";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import { PlusCircle, ArrowLeft, Printer, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";

export default async function SellerPackagesPage() {
  const { user } = await requireAuth(["seller", "admin"]);
  const { packages: sellerPkgs } = await getSellerData(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Të Gjitha Pakot e Mia
          </h1>
          <p className="text-xs text-neutral-500">
            Lista e plotë e dërgesave tuaja dhe gjurmimi në kohë reale.
          </p>
        </div>

        <Button asChild className="bg-neutral-900 text-[#fce883] font-bold">
          <Link href="/seller/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            Krijo Pako të Re
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-500 font-semibold">
                <th className="py-3 px-4">Barkodi</th>
                <th className="py-3 px-4">Marrësi</th>
                <th className="py-3 px-4">Adresa / Qyteti</th>
                <th className="py-3 px-4">Vlera COD</th>
                <th className="py-3 px-4">Statusi</th>
                <th className="py-3 px-4 text-right">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
              {sellerPkgs.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                  <td className="py-3 px-4">
                    <BarcodeBadge value={pkg.barcode} height={26} width={1} />
                  </td>
                  <td className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100">
                    <div>{pkg.clientName}</div>
                    <div className="text-xs text-neutral-400 font-mono">{pkg.clientPhone}</div>
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                    <div>{pkg.clientAddress}</div>
                    <div className="text-xs text-neutral-400">{pkg.clientCity || "Shqipëri"}</div>
                  </td>
                  <td className="py-3 px-4 font-black">
                    {pkg.paymentType === "cod" ? formatCurrency(pkg.amount) : "Prepaid"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 capitalize">
                      {pkg.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                      <Link href={`/seller/print/${pkg.id}`} target="_blank">
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        Printo
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
