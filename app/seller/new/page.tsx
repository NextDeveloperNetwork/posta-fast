import { requireAuth } from "@/lib/auth-guards";
import { getOfficesList } from "@/lib/queries";
import { createPackageAction } from "@/app/actions/courier-system";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function NewPackagePage() {
  const { user } = await requireAuth(["seller", "admin"]);
  const officesList = await getOfficesList();

  async function handleCreate(formData: FormData) {
    "use server";
    const res = await createPackageAction(user.id, formData);
    if (res.success && res.id) {
      redirect(`/seller/print/${res.id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="p-2">
          <Link href="/seller">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Krijo Pako të Re
          </h1>
          <p className="text-xs text-neutral-500">
            Plotësoni të dhënat e marrësit dhe mënyrën e pagesës.
          </p>
        </div>
      </div>

      <Card className="border-neutral-200/80 dark:border-neutral-800 shadow-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl">
        <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <CardTitle className="text-lg font-bold">Informacioni i Dërgesës</CardTitle>
          <CardDescription className="text-xs">
            Barkodi unik do të gjenerohet automatikisht për printim.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form action={handleCreate} className="space-y-4">
            {/* Payment Type & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Lloji i Pagesës
                </label>
                <select
                  name="paymentType"
                  defaultValue="cod"
                  className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium focus:ring-2 focus:ring-[#fce883]"
                >
                  <option value="cod">Pagesë në Dorëzim (COD)</option>
                  <option value="prepaid">E Parapaguar (Prepaid)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Vlera COD për t&apos;u mbledhur (ALL)
                </label>
                <Input
                  type="number"
                  name="amount"
                  defaultValue="1500"
                  min="0"
                  step="50"
                  placeholder="psh. 2500"
                  className="h-10 font-mono font-bold text-base"
                />
              </div>
            </div>

            {/* Offices routing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Zyra Pritëse (Dorëzimi i Pakos) *
                </label>
                <select
                  name="intakeOfficeId"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium focus:ring-2 focus:ring-[#fce883]"
                >
                  {officesList.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} ({off.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Zyra e Destinacionit (Qyteti Marrës) *
                </label>
                <select
                  name="destinationOfficeId"
                  required
                  defaultValue={officesList[1]?.id || officesList[0]?.id}
                  className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium focus:ring-2 focus:ring-[#fce883]"
                >
                  {officesList.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} ({off.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Client Info */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Të Dhënat e Klientit (Marrësit)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Emri dhe Mbiemri *
                  </label>
                  <Input
                    name="clientName"
                    placeholder="psh. Arben Hoxha"
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Numri i Telefonit *
                  </label>
                  <Input
                    name="clientPhone"
                    type="tel"
                    placeholder="psh. 069 123 4567"
                    required
                    className="h-10 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Adresa e Plotë *
                  </label>
                  <Input
                    name="clientAddress"
                    placeholder="psh. Lagjja 1, Rruga Taulantia, Pallati 5"
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Qyteti
                  </label>
                  <Input
                    name="clientCity"
                    placeholder="psh. Durrës"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Shënime për Korrierin (Opsionale)
                </label>
                <Input
                  name="notes"
                  placeholder="psh. Klienti kërkon dorëzim pas orës 16:00"
                  className="h-10"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-11 font-bold bg-neutral-900 text-[#fce883] hover:bg-neutral-800 shadow-md transition-all text-base"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gjenero Pakon & Printo Etiketën
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
