"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import {
  intakeScanPackageAction,
  getIntakePackagesAction,
  intakeBatchAcceptAction,
} from "@/app/actions/courier-system";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowLeft,
  Building2,
  Search,
  Check,
  RefreshCw,
  Phone,
  MapPin,
  User,
  ArrowRight,
  ClipboardCheck,
  Layers,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";

export default function OfficeIntakePage() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  // Data state
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active office state
  const [activeOfficeId, setActiveOfficeId] = useState<string>("");
  const [activeOfficeName, setActiveOfficeName] = useState<string>("");

  // Input states
  const [scannerTypedCode, setScannerTypedCode] = useState("");
  const [manualSearchQuery, setManualSearchQuery] = useState("");

  // Multi-select for batch manual accept
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);

  // Scanner & Result feedback
  const [lastAccepted, setLastAccepted] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [acceptedSessionList, setAcceptedSessionList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  // Play audio beep on acceptance
  const playSuccessBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted
    }
  };

  // 1. Determine active office from session
  useEffect(() => {
    if (session?.user?.officeId) {
      setActiveOfficeId(session.user.officeId);
    }
  }, [session?.user?.officeId]);

  // 2. Fetch packages strictly for active office
  const loadPackages = async (officeIdToQuery: string) => {
    if (!officeIdToQuery) return;
    setIsLoading(true);
    setErrorMessage(null);

    const res = await getIntakePackagesAction(officeIdToQuery);
    if (res.success) {
      // STRICT FILTER: Only packages where intakeOfficeId === officeIdToQuery and status === 'created'
      const strictPackages = (res.packages || []).filter(
        (p: any) => p.intakeOfficeId === officeIdToQuery && p.status === "created"
      );
      setPackagesList(strictPackages);

      if (res.offices) {
        setOffices(res.offices);
        const current = res.offices.find((o: any) => o.id === officeIdToQuery);
        if (current) {
          setActiveOfficeName(current.name);
        }
      }
    } else {
      setErrorMessage(res.error || "Ndodhi një gabim gjatë marrjes së pakove.");
    }
    setIsLoading(false);
  };

  // Initial load when activeOfficeId is set or when offices load
  useEffect(() => {
    if (activeOfficeId) {
      loadPackages(activeOfficeId);
    } else if (isAdmin) {
      // If admin has no assigned office, load offices first and select the first office
      getIntakePackagesAction().then((res) => {
        if (res.offices && res.offices.length > 0) {
          setOffices(res.offices);
          const firstOffice = res.offices[0];
          setActiveOfficeId(firstOffice.id);
          setActiveOfficeName(firstOffice.name);
          loadPackages(firstOffice.id);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, [activeOfficeId, isAdmin]);

  // Handle office switch (for Admin testing)
  const handleOfficeChange = (newOfficeId: string) => {
    setActiveOfficeId(newOfficeId);
    const found = offices.find((o) => o.id === newOfficeId);
    if (found) setActiveOfficeName(found.name);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedPackageIds([]);
    loadPackages(newOfficeId);
  };

  // 3. Handle Scan / Intake Action
  const handleScan = async (rawBarcode: string) => {
    const clean = rawBarcode.trim();
    if (!clean) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const actorId = session?.user?.id || "";
    const res = await intakeScanPackageAction(clean, activeOfficeId, actorId);

    setIsProcessing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.package) {
      playSuccessBeep();
      setLastAccepted(res.package);
      setSuccessMessage(`Pakoja ${res.package.barcode} u pranua me sukses në magazinë!`);
      setAcceptedSessionList((prev) => [res.package, ...prev]);

      // Remove accepted package from visual pending list immediately
      setPackagesList((prev) => prev.filter((p) => p.id !== res.package.id));
      setSelectedPackageIds((prev) => prev.filter((id) => id !== res.package.id));
      setScannerTypedCode("");
    }
  };

  // 4. Handle Manual Single Accept
  const handleManualAccept = async (pkgId: string, barcode: string) => {
    await handleScan(barcode);
  };

  // 5. Handle Batch Manual Accept
  const handleBatchAccept = async () => {
    if (selectedPackageIds.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const actorId = session?.user?.id || "";
    const res = await intakeBatchAcceptAction(selectedPackageIds, activeOfficeId, actorId);

    setIsProcessing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.success && res.accepted) {
      playSuccessBeep();
      setSuccessMessage(`U pranuan me sukses ${res.count} pako në magazinë!`);
      setAcceptedSessionList((prev) => [...res.accepted, ...prev]);

      const acceptedIds = new Set(selectedPackageIds);
      setPackagesList((prev) => prev.filter((p) => !acceptedIds.has(p.id)));
      setSelectedPackageIds([]);
    }
  };

  // Toggle selection for batch accept
  const toggleSelectPackage = (id: string) => {
    setSelectedPackageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPackageIds.length === filteredPackages.length) {
      setSelectedPackageIds([]);
    } else {
      setSelectedPackageIds(filteredPackages.map((p) => p.id));
    }
  };

  // 6. Live filter for the Manual Acceptance section
  const filteredPackages = useMemo(() => {
    const q = manualSearchQuery.toLowerCase().trim();
    if (!q) return packagesList;

    return packagesList.filter((pkg) => {
      const matchBarcode = pkg.barcode?.toLowerCase().includes(q);
      const matchNumberOnly = pkg.barcode?.replace(/[^0-9]/g, "").includes(q.replace(/[^0-9]/g, ""));
      const matchClient = pkg.clientName?.toLowerCase().includes(q);
      const matchPhone = pkg.clientPhone?.toLowerCase().includes(q);
      const matchCity = pkg.clientCity?.toLowerCase().includes(q);
      const matchSeller = pkg.sellerName?.toLowerCase().includes(q);

      return matchBarcode || matchNumberOnly || matchClient || matchPhone || matchCity || matchSeller;
    });
  }, [packagesList, manualSearchQuery]);

  // Match preview for scanner input
  const scannerMatch = useMemo(() => {
    const query = scannerTypedCode.toUpperCase().trim();
    if (!query) return null;
    const cleanNum = query.replace(/[^0-9]/g, "");

    return packagesList.find(
      (p) =>
        p.barcode?.toUpperCase() === query ||
        p.barcode?.toUpperCase() === `PF-${query}` ||
        (cleanNum.length >= 4 && p.barcode?.replace(/[^0-9]/g, "") === cleanNum)
    );
  }, [packagesList, scannerTypedCode]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="p-2">
            <Link href="/office">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fce883]/40 text-neutral-900 dark:text-neutral-100 text-xs font-bold mb-1 border border-amber-300/60">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Zyra Pritëse: {activeOfficeName || "Duke u ngarkuar..."}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              Pranimi i Pakove në Zyrë (Intake)
            </h1>
            <p className="text-xs text-neutral-500">
              Pranoni pakot e dorëzuara nga shitësit me skanim barkodi ose përmes kërkimit manual.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Office Switcher */}
          {isAdmin && offices.length > 0 && (
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1.5 border border-neutral-200 dark:border-neutral-700">
              <Building2 className="w-4 h-4 text-amber-600 ml-1" />
              <select
                value={activeOfficeId}
                onChange={(e) => handleOfficeChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer pr-2"
              >
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={() => loadPackages(activeOfficeId)}
            variant="outline"
            size="sm"
            disabled={isLoading || !activeOfficeId}
            className="text-xs font-semibold gap-1.5"
            title="Rifresko listën"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Rifresko</span>
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200 border border-red-200 dark:border-red-900 flex items-start gap-3 text-xs font-semibold animate-in fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                Sukses!
              </div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {successMessage}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-neutral-400 hover:text-neutral-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==========================================
          METODA 1: SKANIMI ME BARKOD / KAMERË
          ========================================== */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-neutral-800 text-[#fce883] flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                Skanimi me Barkod / Kamerë
              </h2>
              <p className="text-[11px] text-neutral-500">
                Përdorni skanerin fizik me lazer, kamerën, ose shkruani barkodin shpejt.
              </p>
            </div>
          </div>
        </div>

        <BarcodeScanner
          onScan={(code) => handleScan(code)}
          onCodeChange={(val) => setScannerTypedCode(val)}
          value={scannerTypedCode}
          disabled={isProcessing}
          placeholder="Skanoni barkodin (psh. PF-276188)..."
        />

        {/* Live Match Notification */}
        {scannerMatch && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fce883] text-neutral-950 flex items-center justify-center font-bold font-mono text-xs">
                OK
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Pakoja u gjet:</span>
                  <span className="font-mono bg-white dark:bg-neutral-800 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                    {scannerMatch.barcode}
                  </span>
                  <span>• {scannerMatch.clientName}</span>
                </div>
                <div className="text-[11px] text-neutral-500">
                  Destinacioni: {scannerMatch.destinationOfficeName} • Vlera: {formatCurrency(scannerMatch.amount)}
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleScan(scannerMatch.barcode)}
              disabled={isProcessing}
              className="bg-neutral-900 hover:bg-neutral-800 text-[#fce883] font-bold text-xs px-4 py-2 rounded-xl shadow-xs shrink-0 self-end sm:self-auto"
            >
              <Check className="w-4 h-4 mr-1 text-[#fce883]" />
              Prano Tani (Enter)
            </Button>
          </div>
        )}
      </div>

      {/* ==========================================
          METODA 2: PRANIMI MANUAL I PAKOVE (ME SEARCH BAR)
          ========================================== */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border-2 border-neutral-200/90 dark:border-neutral-800 shadow-sm overflow-hidden space-y-0">
        {/* Section Header */}
        <div className="p-5 bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100">
                    Pranimi Manual i Pakove
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    {packagesList.length} në pritje
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Gjeni dhe pranoni pakot fizike të dorëzuara te <strong>{activeOfficeName}</strong>.
                </p>
              </div>
            </div>

            <Button asChild size="sm" variant="outline" className="text-xs font-bold self-start sm:self-auto">
              <Link href="/office/bags">
                Vazhdo te Çantat <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {/* DEDICATED SEARCH BAR FOR MANUAL SECTION */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                placeholder="Kërko me barkod (psh. 276188), emër klienti, telefon, qytet, shitës..."
                className="pl-10 h-10 text-xs sm:text-sm bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 shadow-xs focus-visible:ring-[#fce883]"
              />
              {manualSearchQuery && (
                <button
                  type="button"
                  onClick={() => setManualSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Batch Action Button if packages are selected */}
            {selectedPackageIds.length > 0 && (
              <Button
                type="button"
                onClick={handleBatchAccept}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs gap-1.5 shrink-0 animate-in zoom-in-95"
              >
                <ClipboardCheck className="w-4 h-4" />
                Prano të Zgjedhurat ({selectedPackageIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* Batch Selection Toolbar */}
        {packagesList.length > 0 && (
          <div className="px-5 py-2.5 bg-neutral-100/60 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:text-neutral-900 dark:hover:text-neutral-200 font-semibold cursor-pointer"
            >
              {selectedPackageIds.length === filteredPackages.length && filteredPackages.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-neutral-400" />
              )}
              <span>
                {selectedPackageIds.length === filteredPackages.length && filteredPackages.length > 0
                  ? "Hiq përzgjedhjen e të gjithave"
                  : `Zgjidh të gjitha (${filteredPackages.length})`}
              </span>
            </button>

            <span>
              Po shfaqen {filteredPackages.length} nga {packagesList.length} pako
            </span>
          </div>
        )}

        {/* Packages List */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-neutral-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500" />
            <div>Duke ngarkuar pakot e zyrës {activeOfficeName}...</div>
          </div>
        ) : packagesList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Nuk ka asnjë pako në pritje për pranim në këtë zyrë
            </div>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Pakot e reja të krijuara nga shitësit për <strong>{activeOfficeName}</strong> do të shfaqen automatikisht këtu.
            </p>
            {isAdmin && offices.length > 1 && (
              <div className="pt-2">
                <span className="text-xs text-neutral-500 mr-2">Shiko një zyrë tjetër:</span>
                <select
                  value={activeOfficeId}
                  onChange={(e) => handleOfficeChange(e.target.value)}
                  className="bg-neutral-100 dark:bg-neutral-800 text-xs font-bold p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                >
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Nuk u gjet asnjë pako sipas kërkimit "{manualSearchQuery}"
            </div>
            <p className="text-xs text-neutral-400">
              Kontrolloni saktësinë e kodit ose fshini kërkimin për të parë të gjitha pakot.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManualSearchQuery("")}
              className="text-xs font-semibold"
            >
              Pastro Kërkimin
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredPackages.map((pkg) => {
              const isSelected = selectedPackageIds.includes(pkg.id);
              return (
                <div
                  key={pkg.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isSelected
                      ? "bg-amber-100/40 dark:bg-amber-950/30"
                      : "hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  {/* Left Column: Checkbox, Barcode Badge & Details */}
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectPackage(pkg.id)}
                      className="mt-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Clickable Barcode Badge */}
                        <button
                          type="button"
                          onClick={() => handleManualAccept(pkg.id, pkg.barcode)}
                          title="Kliko për ta pranuar menjëherë"
                          className="font-mono text-sm font-black text-neutral-900 dark:text-neutral-100 bg-[#fce883] hover:bg-amber-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-amber-300 shadow-2xs"
                        >
                          {pkg.barcode}
                        </button>

                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Në Pritje të Pranimit (Krijuar)
                        </span>

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {pkg.paymentType === "cod" ? "COD" : "E Parapaguar"}
                        </span>
                      </div>

                      {/* Recipient Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Marrësi: {pkg.clientName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="font-mono">{pkg.clientPhone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Adresa: {pkg.clientAddress}{pkg.clientCity ? `, ${pkg.clientCity}` : ""}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <span>Dërguesi: <strong className="text-neutral-700 dark:text-neutral-300">{pkg.sellerName || "Shitës"}</strong></span>
                        </div>
                      </div>

                      {/* Routing details */}
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-0.5">
                        <span className="font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                          Zyrë Pritëse: {pkg.intakeOfficeName}
                        </span>
                        <span>&rarr;</span>
                        <span className="font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                          Destinacioni: {pkg.destinationOfficeName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Amount & Manual Accept Button */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                    <div className="text-right">
                      <div className="text-base font-black text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(pkg.amount)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {pkg.paymentType === "cod" ? "Për t'u arkëtuar" : "E parapaguar"}
                      </div>
                    </div>

                    {/* MANUAL ACCEPT BUTTON */}
                    <Button
                      type="button"
                      onClick={() => handleManualAccept(pkg.id, pkg.barcode)}
                      disabled={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Prano Manualisht
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          HISTORIKU I PAKOVE TË PRANUARA NË KËTË SESION
          ========================================== */}
      {acceptedSessionList.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pakot e Pranuara në këtë Sesion ({acceptedSessionList.length})
            </h2>
            <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
              <Link href="/office/bags">
                Vazhdo te Ngarkimi i Çantave &rarr;
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
            {acceptedSessionList.map((pkg, idx) => (
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
        </div>
      )}
    </div>
  );
}
