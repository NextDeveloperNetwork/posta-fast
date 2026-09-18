import { requireAuth } from "@/lib/auth-guards";
import { getSystemSettings } from "@/lib/queries";
import { updateSystemSettingsAction } from "@/app/actions/courier-system";
import { formatCurrency } from "@/lib/currency";
import { Settings, ArrowLeft, Save, Coins, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminSettingsPage() {
  const { user } = await requireAuth(["admin"]);
  const settings = await getSystemSettings();

  async function handleUpdateSettings(formData: FormData) {
    "use server";
    await updateSystemSettingsAction(formData);
    revalidatePath("/admin/settings");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="p-2">
          <Link href="/admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Cilësimet e Përgjithshme të Tarifave
          </h1>
          <p className="text-xs text-neutral-500">
            Përcaktoni tarifën bazë postare dhe shpërblimin fiks për zyrën e destinacionit që kryen dorëzimin.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-md">
        <form action={handleUpdateSettings} className="space-y-5">
          {/* Total Postal Tariff */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
            <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600" />
              Tarifa Totale Postare për Pako (ALL) *
            </label>
            <p className="text-xs text-neutral-500">
              Kjo është vlera e plotë e shërbimit postar që i zbritet pagesës COD të shitësit (ose paguhet paraprakisht).
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                name="totalTariffPerPackage"
                defaultValue={settings.totalTariffPerPackage}
                min="0"
                step="10"
                required
                className="h-11 font-mono font-black text-lg w-48 bg-white dark:bg-neutral-900"
              />
              <span className="font-bold text-sm text-neutral-600 dark:text-neutral-300">
                ALL për çdo pako
              </span>
            </div>
          </div>

          {/* Delivery Office Cut */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
            <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Pjesa (Cut) e Zyrës Dorëzuese (ALL) *
            </label>
            <p className="text-xs text-neutral-500">
              Shuma fikse në Lekë që i takon zyrës së destinacionit për çdo pako të dorëzuar me sukses te klienti.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                name="deliveryOfficeCut"
                defaultValue={settings.deliveryOfficeCut}
                min="0"
                step="10"
                required
                className="h-11 font-mono font-black text-lg w-48 bg-white dark:bg-neutral-900"
              />
              <span className="font-bold text-sm text-neutral-600 dark:text-neutral-300">
                ALL për pako të dorëzuar
              </span>
            </div>
          </div>

          {/* Currency Information */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-neutral-800/30 text-xs text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-neutral-700">
            Monedha zyrtare e sistemit është <strong>Albanian Lek (ALL)</strong>. Të gjitha transaksionet, mbylljet e kasës dhe pagesat COD llogariten në këtë monedhë.
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-bold bg-neutral-900 text-[#fce883] hover:bg-neutral-800 text-sm shadow-md"
          >
            <Save className="w-4 h-4 mr-2" />
            Ruaj Ndryshimet në Cilësime
          </Button>
        </form>
      </div>
    </div>
  );
}
