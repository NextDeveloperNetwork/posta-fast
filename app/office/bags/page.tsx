import { requireAuth } from "@/lib/auth-guards";
import { getOfficeData, getOfficesList } from "@/lib/queries";
import { db } from "@/db";
import { bags, bagPackages, packages, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import {
  createBagAction,
  scanPackageIntoBagAction,
  sealAndDispatchBagAction,
} from "@/app/actions/courier-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingBag, ArrowLeft, Truck, Check, Lock } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

interface PageProps {
  searchParams: Promise<{ bag?: string }>;
}

export default async function OfficeBagsPage({ searchParams }: PageProps) {
  const { user } = await requireAuth(["office", "admin"]);
  const officesList = await getOfficesList();
  const { bag: activeBagId } = await searchParams;

  const officeId = user.officeId || officesList[0]?.id;
  const { office, originBags, couriers, acceptedForBagging } = await getOfficeData(officeId);

  // If a bag is active, fetch its packages
  let activeBag: any = null;
  let bagItems: any[] = [];

  if (activeBagId) {
    [activeBag] = await db.select().from(bags).where(eq(bags.id, activeBagId)).limit(1);
    if (activeBag) {
      const links = await db
        .select()
        .from(bagPackages)
        .where(eq(bagPackages.bagId, activeBag.id));

      for (const l of links) {
        const [p] = await db.select().from(packages).where(eq(packages.id, l.packageId)).limit(1);
        if (p) bagItems.push({ ...p, linkId: l.id });
      }
    }
  }

  async function handleCreateBag(formData: FormData) {
    "use server";
    const destOfficeId = String(formData.get("destinationOfficeId") || "");
    const res = await createBagAction(officeId, destOfficeId);
    if (res.success && res.bag) {
      revalidatePath("/office/bags");
    }
  }

  async function handleScanPackage(formData: FormData) {
    "use server";
    const pkgBarcode = String(formData.get("packageBarcode") || "");
    const bId = String(formData.get("bagId") || "");
    await scanPackageIntoBagAction(bId, pkgBarcode, user.id);
    revalidatePath("/office/bags");
  }

  async function handleSealBag(formData: FormData) {
    "use server";
    const bId = String(formData.get("bagId") || "");
    const cId = String(formData.get("courierId") || "");
    await sealAndDispatchBagAction(bId, cId);
    revalidatePath("/office/bags");
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
            Ngarkimi dhe Paketimi i Çantave
          </h1>
          <p className="text-xs text-neutral-500">
            Krijoni çanta për çdo zyrë destinacioni dhe skanoni pakot e pranuara.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Bag / Bag List */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              Krijo Çantë të Re
            </h2>

            <form action={handleCreateBag} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  Zyra e Destinacionit
                </label>
                <select
                  name="destinationOfficeId"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium"
                >
                  {officesList
                    .filter((o) => o.id !== officeId)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.city})
                      </option>
                    ))}
                </select>
              </div>

              <Button type="submit" className="w-full bg-neutral-900 text-[#fce883] font-bold text-xs">
                Krijo Çantë
              </Button>
            </form>
          </div>

          {/* Bag list */}
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Çantat e Zyrës ({originBags.length})
            </h3>

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {originBags.map((b) => (
                <Link
                  key={b.id}
                  href={`/office/bags?bag=${b.id}`}
                  className={`block p-3 rounded-xl border text-xs transition-all ${
                    activeBag?.id === b.id
                      ? "bg-[#fce883]/20 border-[#fce883] shadow-xs"
                      : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/60 hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {b.barcode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-200 dark:bg-neutral-700">
                      {b.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Bag Scanning and Sealing */}
        <div className="lg:col-span-2 space-y-4">
          {activeBag ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-6">
              {/* Bag Info Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xl text-neutral-900 dark:text-neutral-100">
                      {activeBag.barcode}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 uppercase">
                      {activeBag.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Ngarkuar {bagItems.length} pako në këtë çantë
                  </p>
                </div>

                <BarcodeBadge value={activeBag.barcode} height={36} width={1.4} />
              </div>

              {/* Scan package into bag form */}
              {activeBag.status === "open" && (
                <form action={handleScanPackage} className="space-y-3">
                  <input type="hidden" name="bagId" value={activeBag.id} />
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                    Skano Barkodin e Pakos për ta Shtuar në Çantë:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      name="packageBarcode"
                      placeholder="Skano pako (psh. PF-948201)..."
                      required
                      autoFocus
                      className="font-mono h-11 text-base bg-white dark:bg-neutral-800"
                    />
                    <Button type="submit" className="h-11 px-5 bg-neutral-900 text-[#fce883] font-bold">
                      Shto
                    </Button>
                  </div>
                </form>
              )}

              {/* Items loaded in bag */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Pakot e Ngarkuara në Çantë ({bagItems.length})
                </h3>

                {bagItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                    Çanta është bosh. Skanoni pakot e pranuara më lart.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border rounded-xl overflow-hidden">
                    {bagItems.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <BarcodeBadge value={item.barcode} height={24} width={1} />
                          <div>
                            <span className="font-bold">{item.clientName}</span>
                            <div className="text-[11px] text-neutral-400 font-mono">{item.barcode}</div>
                          </div>
                        </div>
                        <span className="font-mono font-bold">{item.amount} ALL</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seal Bag & Assign Courier */}
              {activeBag.status === "open" && bagItems.length > 0 && (
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <form action={handleSealBag} className="space-y-3">
                    <input type="hidden" name="bagId" value={activeBag.id} />
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                      Cakto Korrierin për Transport Zyrash dhe Mbyll Çantën:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        name="courierId"
                        required
                        className="flex-1 h-11 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
                      >
                        {couriers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone || c.email})
                          </option>
                        ))}
                      </select>
                      <Button type="submit" className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                        <Lock className="w-4 h-4 mr-2" />
                        Mbyll & Cakto Korrierin
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-400 text-xs">
              Zgjidhni një çantë nga lista në të majtë ose krijoni një çantë të re për të filluar paketimin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
