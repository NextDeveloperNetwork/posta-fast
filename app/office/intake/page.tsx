"use client";

import React, { useState } from "react";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import { intakeScanPackageAction } from "@/app/actions/courier-system";
import { useSession } from "next-auth/react";
import { CheckCircle2, AlertCircle, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";

export default function OfficeIntakePage() {
  const { data: session } = useSession();
  const [lastAccepted, setLastAccepted] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptedList, setAcceptedList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = async (barcode: string) => {
    if (!session?.user?.id) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const officeId = session.user.officeId || "default-office";
    const res = await intakeScanPackageAction(barcode, officeId, session.user.id);

    setIsProcessing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.package) {
      setLastAccepted(res.package);
      setAcceptedList((prev) => [res.package, ...prev]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="p-2">
          <Link href="/office">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Pranimi i Pakove në Zyrë (Scan Barcode)
          </h1>
          <p className="text-xs text-neutral-500">
            Skanoni barkodin e pakos për ta pranuar në magazinë. Pakoja do të bëhet gati për paketim në çantë.
          </p>
        </div>
      </div>

      {/* Barcode Scanner Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-md">
        <BarcodeScanner
          onScan={handleScan}
          disabled={isProcessing}
          placeholder="Skanoni me skaner dore ose shkruani barkodin (psh. PF-948201)..."
        />

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {lastAccepted && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                  Pakoja u pranua me sukses!
                </div>
                <div className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                  {lastAccepted.clientName} • {formatCurrency(lastAccepted.amount)}
                </div>
                <div className="text-xs text-neutral-500">
                  Adresa: {lastAccepted.clientAddress}, {lastAccepted.clientCity}
                </div>
              </div>
            </div>
            <BarcodeBadge value={lastAccepted.barcode} height={32} width={1.2} />
          </div>
        )}
      </div>

      {/* Accepted List Session */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            Pakot e Pranuara në këtë Sesion ({acceptedList.length})
          </h2>
          <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
            <Link href="/office/bags">
              Vazhdo te Ngarkimi i Çantave →
            </Link>
          </Button>
        </div>

        {acceptedList.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            Nuk keni skanuar asnjë pako ende gjatë këtij sesioni.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {acceptedList.map((pkg, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {pkg.barcode}
                  </span>
                  <span className="text-neutral-500">• {pkg.clientName}</span>
                </div>
                <span className="font-bold text-emerald-600">{formatCurrency(pkg.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
