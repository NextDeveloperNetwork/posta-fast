import { db } from "@/db";
import { packages, offices, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintLabelPage({ params }: PageProps) {
  const { id } = await params;

  const [pkg] = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!pkg) notFound();

  const [intakeOffice] = await db.select().from(offices).where(eq(offices.id, pkg.intakeOfficeId)).limit(1);
  const [destOffice] = await db.select().from(offices).where(eq(offices.id, pkg.destinationOfficeId)).limit(1);
  const [seller] = await db.select().from(users).where(eq(users.id, pkg.sellerId)).limit(1);

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-8 flex flex-col items-center">
      {/* Control bar (hidden during print) */}
      <div className="print:hidden w-full max-w-md flex items-center justify-between mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/seller/packages">
            <ArrowLeft className="w-4 h-4 mr-1" /> Kthehu
          </Link>
        </Button>

        <PrintButton />
      </div>

      {/* Shipping Label (Thermal 100mm x 150mm style) */}
      <div className="w-[380px] bg-white text-black p-5 rounded-xl border-2 border-dashed border-neutral-300 shadow-xl print:shadow-none print:border-solid print:border-black print:rounded-none">
        {/* Label Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fce883] text-black font-black text-sm border border-black">
              ⚡
            </span>
            <div>
              <span className="font-black text-base tracking-tight block leading-tight">POSTA FAST</span>
              <span className="text-[9px] font-bold tracking-widest uppercase">EXPRESS ALBANIA</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-xs bg-black text-white px-2 py-0.5 rounded">
              {destOffice?.code || "DEST"}
            </span>
          </div>
        </div>

        {/* Big Barcode */}
        <div className="my-4 text-center">
          <BarcodeBadge value={pkg.barcode} height={54} width={1.8} />
          <div className="font-mono font-black text-base tracking-widest mt-1">
            {pkg.barcode}
          </div>
        </div>

        {/* Route Routing */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-neutral-100 border border-black text-xs font-bold mb-3">
          <div>
            <span className="text-[10px] text-neutral-500 block uppercase">Nga (Pritëse):</span>
            <span>{intakeOffice?.city || "Tiranë"}</span>
          </div>
          <div className="border-l border-black pl-2">
            <span className="text-[10px] text-neutral-500 block uppercase">Drejt (Destinacion):</span>
            <span className="text-sm font-black">{destOffice?.city || "Durrës"}</span>
          </div>
        </div>

        {/* Recipient Details */}
        <div className="p-3 border border-black rounded mb-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
            MARRËSI (KLIENTI)
          </span>
          <div className="font-black text-base">{pkg.clientName}</div>
          <div className="font-mono font-bold text-sm">📞 {pkg.clientPhone}</div>
          <div className="text-xs font-semibold mt-1">📍 {pkg.clientAddress}, {pkg.clientCity}</div>
          {pkg.notes && (
            <div className="text-[11px] text-neutral-600 italic mt-1 pt-1 border-t border-neutral-200">
              Shënim: {pkg.notes}
            </div>
          )}
        </div>

        {/* COD Price Highlight */}
        <div className="p-3 bg-neutral-50 border-2 border-black rounded text-center mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block">
            LLOYI I PAGESËS
          </span>
          {pkg.paymentType === "cod" ? (
            <div>
              <span className="text-xs font-bold text-red-600 uppercase block">
                PAGESË NË DORËZIM (COD)
              </span>
              <div className="font-black text-2xl tracking-tight text-black">
                {formatCurrency(pkg.amount)}
              </div>
            </div>
          ) : (
            <div className="font-black text-xl text-emerald-700">
              E PARAPAGUAR (PA PAGESË)
            </div>
          )}
        </div>

        {/* Sender Footer */}
        <div className="text-[10px] text-neutral-500 border-t border-neutral-300 pt-2 flex justify-between">
          <span>Dërguesi: {seller?.name || "Shitës"}</span>
          <span>{new Date(pkg.createdAt).toLocaleDateString("sq-AL")}</span>
        </div>
      </div>
    </div>
  );
}
