import { requireAuth } from "@/lib/auth-guards";
import { getOfficesList } from "@/lib/queries";
import { createOfficeAction } from "@/app/actions/courier-system";
import { Building2, PlusCircle, ArrowLeft, MapPin, Phone, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminOfficesPage() {
  const { user } = await requireAuth(["admin"]);
  const officesList = await getOfficesList();

  async function handleCreateOffice(formData: FormData) {
    "use server";
    await createOfficeAction(formData);
    revalidatePath("/admin/offices");
  }

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
            Menaxhimi i Zyrave Postare & Komisioneve
          </h1>
          <p className="text-xs text-neutral-500">
            Krijoni zyra të reja dhe caktoni përqindjen e tarifës që përfiton zyra pritëse për çdo pako.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Create Office */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-600" />
            Shto Zyrë të Re
          </h2>

          <form action={handleCreateOffice} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Emri i Zyrës *
              </label>
              <Input
                name="name"
                placeholder="psh. Dega Shkodër"
                required
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Kodi i Zyrës *
                </label>
                <Input
                  name="code"
                  placeholder="SHK-01"
                  required
                  className="h-10 text-xs uppercase font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Qyteti *
                </label>
                <Input
                  name="city"
                  placeholder="Shkodër"
                  required
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-800 dark:text-[#fce883] flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" /> Përqindja e Zyrës Pritëse nga Tarifa (%) *
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="100"
                name="intakeCommissionPercent"
                defaultValue="15.00"
                required
                className="h-10 text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-neutral-400 block">
                psh. 15% do të thotë zyra merr 15% të tarifës postare të çdo pakoje të pranuar.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Adresa Fizike
              </label>
              <Input
                name="address"
                placeholder="Rruga Kryesore, Nr. 1"
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Numri i Telefonit
              </label>
              <Input
                name="phone"
                placeholder="+355 69 ..."
                className="h-10 text-xs font-mono"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 font-bold bg-neutral-900 text-[#fce883] hover:bg-neutral-800 text-xs mt-2"
            >
              Krijo Zyrën
            </Button>
          </form>
        </div>

        {/* Existing Offices List */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              Zyrat Aktive në Rrjet ({officesList.length})
            </h2>
          </div>

          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {officesList.map((off) => (
              <div
                key={off.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                      {off.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {off.code}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-3">
                    <span>📍 {off.city}</span>
                    {off.address && <span>{off.address}</span>}
                    {off.phone && <span>📞 {off.phone}</span>}
                  </div>
                </div>

                <div className="text-left sm:text-right p-2.5 rounded-xl bg-amber-50 dark:bg-neutral-800/60 border border-amber-200/60 dark:border-neutral-700 sm:border-0 sm:bg-transparent">
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-[#fce883] block">
                    Përqindja Pritëse
                  </span>
                  <span className="font-mono font-black text-xl text-neutral-900 dark:text-neutral-50">
                    {off.intakeCommissionPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
