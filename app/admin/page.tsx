import { requireAuth } from "@/lib/auth-guards";
import { getAdminOverview, getSystemSettings } from "@/lib/queries";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import {
  Building2,
  Users,
  Settings,
  Package,
  ShoppingBag,
  Coins,
  Truck,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const { user } = await requireAuth(["admin"]);
  const overview = await getAdminOverview();
  const settings = await getSystemSettings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Paneli i Administratorit
          </h1>
          <p className="text-xs text-neutral-500">
            Menaxhimi qendror i rrjetit të Posta Fast, zyrave, tarifave dhe roleve.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="text-xs font-semibold">
            <Link href="/admin/settings">
              <Settings className="w-4 h-4 mr-2" />
              Cilësimet e Tarifave
            </Link>
          </Button>
          <Button asChild className="bg-neutral-900 text-[#fce883] font-bold text-xs">
            <Link href="/admin/offices">
              <Building2 className="w-4 h-4 mr-2" />
              Shto Zyrë të Re
            </Link>
          </Button>
        </div>
      </div>

      {/* Global Network Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Zyra Postare</span>
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">{overview.officeCount}</div>
          <div className="text-xs text-neutral-400 mt-1">Dega në të gjithë Shqipërinë</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Totali i Pakove</span>
            <Package className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600">{overview.packageCount}</div>
          <div className="text-xs text-neutral-400 mt-1">
            {overview.deliveredCount} të dorëzuara • {overview.refusedCount} të refuzuara
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Çanta në Tranzit</span>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600">{overview.bagCount}</div>
          <div className="text-xs text-neutral-400 mt-1">Lidhje inter-office aktive</div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100/50 dark:from-neutral-900 dark:to-neutral-850 border border-amber-200/80 dark:border-neutral-700 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 dark:text-[#fce883] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">COD në Qarkullim</span>
            <Coins className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-50">
            {formatCurrency(overview.totalCodCirculating)}
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">
            {formatCurrency(overview.totalCodCollected)} mbledhur gjithsej
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/offices"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#fce883] transition-all"
        >
          <Building2 className="w-7 h-7 text-amber-600 mb-3" />
          <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mb-1">
            Zyrat & Përqindjet
          </h2>
          <p className="text-xs text-neutral-500 mb-3">
            Shtoni zyra të reja, konfiguroni përqindjen e komisionit të zyrës pritëse.
          </p>
          <span className="text-xs font-bold text-amber-700 dark:text-[#fce883] flex items-center">
            Menaxho Zyrat <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </Link>

        <Link
          href="/admin/settings"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#fce883] transition-all"
        >
          <Settings className="w-7 h-7 text-blue-600 mb-3" />
          <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mb-1">
            Cilësimet e Tarifave
          </h2>
          <p className="text-xs text-neutral-500 mb-3">
            Tarifa e përgjithshme: <strong>{formatCurrency(settings.totalTariffPerPackage)}</strong> • Cut dorëzimi: <strong>{formatCurrency(settings.deliveryOfficeCut)}</strong>
          </p>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center">
            Ndrysho Tarifat <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </Link>

        <Link
          href="/admin/users"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#fce883] transition-all"
        >
          <Users className="w-7 h-7 text-emerald-600 mb-3" />
          <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mb-1">
            Përdoruesit & Rolet
          </h2>
          <p className="text-xs text-neutral-500 mb-3">
            Caktoni role: Administrator, Financë, Zyrë, Korrier dhe Shitës.
          </p>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
            Cakto Rolet <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </Link>
      </div>
    </div>
  );
}
