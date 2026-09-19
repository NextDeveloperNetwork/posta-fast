"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";
import { BarcodeBadge } from "@/components/barcode/barcode-badge";
import {
  intakeScanPackageAction,
  getIntakePackagesAction,
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
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";

export default function OfficeIntakePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [isPending, startTransition] = useTransition();

  // Data state
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active office state
  const [activeOfficeId, setActiveOfficeId] = useState<string>("");
  const [activeOfficeName, setActiveOfficeName] = useState<string>("");

  // Input & search state
  const [typedCode, setTypedCode] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  // Scanner & Result feedback
  const [lastAccepted, setLastAccepted] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [acceptedSessionList, setAcceptedSessionList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  // 1. Determine active office from session or default office
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
      setLastAccepted(res.package);
      setSuccessMessage(`Pakoja ${res.package.barcode} u pranua me sukses në magazinë!`);
      setAcceptedSessionList((prev) => [res.package, ...prev]);

      // Remove accepted package from visual pending list immediately
      setPackagesList((prev) => prev.filter((p) => p.id !== res.package.id));
      setTypedCode("");
    }
  };

  // 4. Live filtering of packages based on typed barcode or search input
  const filteredPackages = useMemo(() => {
    const query = (typedCode || searchFilter).toLowerCase().trim();
    if (!query) return packagesList;

    return packagesList.filter((pkg) => {
      const matchBarcode = pkg.barcode?.toLowerCase().includes(query);
      const matchNumberOnly = pkg.barcode?.replace(/[^0-9]/g, "").includes(query.replace(/[^0-9]/g, ""));
      const matchClient = pkg.clientName?.toLowerCase().includes(query);
      const matchPhone = pkg.clientPhone?.toLowerCase().includes(query);
      const matchCity = pkg.clientCity?.toLowerCase().includes(query);
      const matchSeller = pkg.sellerName?.toLowerCase().includes(query);

      return matchBarcode || matchNumberOnly || matchClient || matchPhone || matchCity || matchSeller;
    });
  }, [packagesList, typedCode, searchFilter]);

  // Check if typed code matches an exact package
  const exactMatch = useMemo(() => {
    const query = typedCode.toUpperCase().trim();
    if (!query) return null;
    const cleanNum = query.replace(/[^0-9]/g, "");

    return packagesList.find(
      (p) =>
        p.barcode?.toUpperCase() === query ||
        p.barcode?.toUpperCase() === `PF-${query}` ||
        (cleanNum.length >= 4 && p.barcode?.replace(/[^0-9]/g, "") === cleanNum)
    );
  }, [packagesList, typedCode]);

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
              Pranimi i Pakove (Intake Scanner)
            </h1>
            <p className="text-xs text-neutral-500">
              Kjo faqe shfaq <strong>vetëm pakot e regjistruara për pranim në këtë zyrë</strong> nga shitësit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Office Switcher (only for Administrator) */}
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

      {/* 1. Barcode Scanner / Manual Input Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            Skanimi ose Kërkimi i Barkodit
          </h2>
          <span className="text-[11px] text-neutral-400 font-medium">
            Shkruani kodin për ta gjetur dhe pranuar
          </span>
        </div>

        {/* Barcode Scanner Component synced with typedCode */}
        <BarcodeScanner
          onScan={(code) => handleScan(code)}
          onCodeChange={(val) => setTypedCode(val)}
          value={typedCode}
          disabled={isProcessing}
          placeholder="Shkruani barkodin (psh. PF-276188 ose 276188)..."
        />

        {/* Live Exact Match Banner right under input */}
        {exactMatch && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fce883] text-neutral-950 flex items-center justify-center font-bold font-mono text-xs">
                OK
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Pakoja u gjet:</span>
                  <span className="font-mono bg-white dark:bg-neutral-800 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                    {exactMatch.barcode}
                  </span>
                  <span>• {exactMatch.clientName}</span>
                </div>
                <div className="text-[11px] text-neutral-500">
                  Destinacioni: {exactMatch.destinationOfficeName} • Vlera: {formatCurrency(exactMatch.amount)}
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleScan(exactMatch.barcode)}
              disabled={isProcessing}
              className="bg-neutral-900 hover:bg-neutral-800 text-[#fce883] font-bold text-xs px-4 py-2 rounded-xl shadow-xs shrink-0 self-end sm:self-auto"
            >
              <Check className="w-4 h-4 mr-1 text-[#fce883]" />
              Prano Tani (Enter)
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && lastAccepted && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                  Pakoja u pranua me sukses në Zyrë!
                </div>
                <div className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                  {lastAccepted.clientName} • {formatCurrency(lastAccepted.amount)}
                </div>
                <div className="text-xs text-neutral-500">
                  Barkodi: <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{lastAccepted.barcode}</span> • Adresa: {lastAccepted.clientAddress}, {lastAccepted.clientCity}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <BarcodeBadge value={lastAccepted.barcode} height={30} width={1.2} />
            </div>
          </div>
        )}
      </div>

      {/* 2. Strict Visual Packages List for this Intake Office */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100">
                Pakot në Pritje për Pranim Fizik në këtë Zyrë
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
                {packagesList.length} pako
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Këto pako janë regjistruar nga shitësit për t'u dorëzuar te <strong>{activeOfficeName}</strong>.
            </p>
          </div>

          <Button asChild size="sm" variant="outline" className="text-xs font-bold self-start sm:self-auto">
            <Link href="/office/bags">
              Vazhdo te Ngarkimi i Çantave <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Content */}
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
              Nuk ka asnjë pako në pritje për këtë zyrë
            </div>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Aktualisht nuk ka pako të reja me status "krijuar" që presin pranim te <strong>{activeOfficeName}</strong>.
            </p>
            {isAdmin && offices.length > 1 && (
              <div className="pt-2">
                <span className="text-xs text-neutral-500 mr-2">Zgjidhni një zyrë tjetër:</span>
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
          <div className="p-8 text-center text-xs text-neutral-400">
            Nuk u gjet asnjë pako që përputhet me kërkimin <span className="font-bold font-mono text-neutral-700 dark:text-neutral-300">"{typedCode}"</span>.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors bg-amber-50/15 dark:bg-amber-950/5"
              >
                {/* Left Info Column */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleScan(pkg.barcode)}
                      title="Kliko për ta skanuar menjëherë"
                      className="font-mono text-sm font-black text-neutral-900 dark:text-neutral-100 bg-[#fce883]/50 hover:bg-[#fce883] px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-amber-300/60"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
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
                      <span>Dërguesi (Shitësi): <strong className="text-neutral-700 dark:text-neutral-300">{pkg.sellerName || "Shitës"}</strong></span>
                    </div>
                  </div>

                  {/* Routing Info */}
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

                {/* Right Action Column */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                  <div className="text-right">
                    <div className="text-base font-black text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(pkg.amount)}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {pkg.paymentType === "cod" ? "Për t'u arkëtuar" : "E parapaguar"}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleScan(pkg.barcode)}
                    disabled={isProcessing}
                    className="bg-neutral-900 hover:bg-neutral-800 text-[#fce883] font-bold text-xs px-4 py-2 rounded-xl shadow-xs gap-1.5"
                  >
                    <Check className="w-4 h-4 text-[#fce883]" />
                    Prano Pakon (Scan)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Session Accepted History */}
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
