import { requireAuth } from "@/lib/auth-guards";
import { db } from "@/db";
import { packages, offices, users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { formatCurrency } from "@/lib/currency";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminPackagesPage() {
  const { user } = await requireAuth(["admin"]);
  const allPkgs = await db.select().from(packages).orderBy(desc(packages.createdAt));
  const allOffices = await db.select().from(offices);

  const getOfficeCity = (id: string) => {
    return allOffices.find((o) => o.id === id)?.city || "Zyrë";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="p-2">
          <Link href="/admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Gjurmimi Qendror i të Gjitha Pakove
          </h1>
          <p className="text-xs text-neutral-500">
            Monitorim në kohë reale i qarkullimit të pakove në të gjithë rrjetin postar.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 font-semibold">
                <th className="py-3 px-4">Barkodi</th>
                <th className="py-3 px-4">Itinerari</th>
                <th className="py-3 px-4">Marrësi</th>
                <th className="py-3 px-4">Vlera</th>
                <th className="py-3 px-4">Statusi</th>
                <th className="py-3 px-4">Krijuar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
              {allPkgs.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                  <td className="py-3 px-4">
                    <BarcodeBadge value={pkg.barcode} height={24} width={1} />
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {getOfficeCity(pkg.intakeOfficeId)} →{" "}
                    <span className="font-bold">{getOfficeCity(pkg.destinationOfficeId)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold">{pkg.clientName}</div>
                    <div className="text-[11px] text-neutral-400">📞 {pkg.clientPhone}</div>
                  </td>
                  <td className="py-3 px-4 font-black">
                    {pkg.paymentType === "cod" ? formatCurrency(pkg.amount) : "Prepaid"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                      {pkg.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-400 font-mono text-xs">
                    {new Date(pkg.createdAt).toLocaleDateString("sq-AL")}
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
