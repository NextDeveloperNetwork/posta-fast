import { requireAuth } from "@/lib/auth-guards";
import { getOfficeData, getOfficesList } from "@/lib/queries";
import { db } from "@/db";
import { bags, bagPackages, packages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import {
  verifyAndUnloadPackageAction,
  completeBagUnloadingAction,
} from "@/app/actions/courier-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, ArrowLeft, CheckCircle2, AlertCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

interface PageProps {
  searchParams: Promise<{ bag?: string }>;
}

export default async function OfficeUnloadingPage({ searchParams }: PageProps) {
  const { user } = await requireAuth(["office", "admin"]);
  const officesList = await getOfficesList();
  const { bag: activeBagId } = await searchParams;

  const officeId = user.officeId || officesList[0]?.id;
  const { incomingBags } = await getOfficeData(officeId);

  let activeBag: any = null;
  let bagItems: any[] = [];

  if (activeBagId) {
    [activeBag] = await db.select().from(bags).where(eq(bags.id, activeBagId)).limit(1);
    if (activeBag) {
      const links = await db.select().from(bagPackages).where(eq(bagPackages.bagId, activeBag.id));
      for (const l of links) {
        const [p] = await db.select().from(packages).where(eq(packages.id, l.packageId)).limit(1);
        if (p) {
          bagItems.push({ ...p, verifiedAt: l.verifiedAt });
        }
      }
    }
  }

  const allVerified = bagItems.length > 0 && bagItems.every((i) => i.verifiedAt);

  async function handleVerifyPackage(formData: FormData) {
    "use server";
    const bId = String(formData.get("bagId") || "");
    const pkgBarcode = String(formData.get("packageBarcode") || "");
    await verifyAndUnloadPackageAction(bId, pkgBarcode, user.id);
    revalidatePath("/office/unloading");
  }

  async function handleAcceptBag(formData: FormData) {
    "use server";
    const bId = String(formData.get("bagId") || "");
    await completeBagUnloadingAction(bId);
    revalidatePath("/office/unloading");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="p-2">
          <Link href="/office">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Shkarkimi dhe Kontrolli i Çantave Hyrëse
          </h1>
          <p className="text-xs text-neutral-500">
            Skanoni pakot e mbërritura nga çanta për të verifikuar manifestin para pranimit përfundimtar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Incoming Bags to Unload */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            Çantat e Mbërritura ({incomingBags.length})
          </h2>

          <div className="space-y-2">
            {incomingBags.map((b) => (
              <Link
                key={b.id}
                href={`/office/unloading?bag=${b.id}`}
                className={`block p-3 rounded-xl border text-xs transition-all ${
                  activeBag?.id === b.id
                    ? "bg-[#fce883]/20 border-[#fce883]"
                    : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">{b.barcode}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
                    {b.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Checklist & Scanning */}
        <div className="lg:col-span-2 space-y-4">
          {activeBag ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="font-mono font-black text-xl text-neutral-900 dark:text-neutral-100">
                    Çanta: {activeBag.barcode}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {bagItems.filter((i) => i.verifiedAt).length} nga {bagItems.length} pako të verifikuara
                  </p>
                </div>
                <BarcodeBadge value={activeBag.barcode} height={32} width={1.2} />
              </div>

              {/* Scan package to verify */}
              {activeBag.status !== "unloaded" && (
                <form action={handleVerifyPackage} className="space-y-3">
                  <input type="hidden" name="bagId" value={activeBag.id} />
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                    Skano Barkodin e Pakos që po Nxjerr nga Çanta:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      name="packageBarcode"
                      placeholder="Skano pako (psh. PF-948201)..."
                      required
                      autoFocus
                      className="font-mono h-11 text-base bg-white dark:bg-neutral-800"
                    />
                    <Button type="submit" className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold">
                      Verifiko
                    </Button>
                  </div>
                </form>
              )}

              {/* Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Manifesti i Pakove brenda Çantës
                </h4>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border rounded-xl overflow-hidden">
                  {bagItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 flex items-center justify-between text-xs transition-colors ${
                        item.verifiedAt
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                          : "bg-neutral-50/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.verifiedAt ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-neutral-300 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-neutral-900 dark:text-neutral-100">
                            {item.clientName}
                          </div>
                          <div className="font-mono text-neutral-400 text-[11px]">
                            {item.barcode} • 📞 {item.clientPhone}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold">{item.amount} ALL</div>
                        <span className="text-[10px] text-neutral-400 uppercase font-medium">
                          {item.verifiedAt ? "E Kontrolluar" : "Pa skanuar"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accept Bag Button */}
              {allVerified && activeBag.status !== "unloaded" && (
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mb-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Të gjitha pakot u verifikuan me sukses! Klikoni më poshtë për ta pranuar çantën dhe për të kaluar pakot në fazën e dorëzimit përfundimtar.
                    </span>
                  </div>

                  <form action={handleAcceptBag}>
                    <input type="hidden" name="bagId" value={activeBag.id} />
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                    >
                      Prano Çantën & Liro Pakot për Dorëzim
                    </Button>
                  </form>
                </div>
              )}

              {activeBag.status === "unloaded" && (
                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  ✓ Kjo çantë është shkarkuar dhe pranuar plotësisht.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-400 text-xs">
              Zgjidhni një çantë të mbërritur nga lista në të majtë për ta shkarkuar dhe kontrolluar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
