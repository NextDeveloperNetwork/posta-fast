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
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
  Phone,
  MapPin,
  User,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";

export default function OfficeIntakePage() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  // Data state
  const [allPackages, setAllPackages] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Office selection (defaults to user's office or "all")
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all");

  // Scanner & Result states
  const [lastAccepted, setLastAccepted] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [acceptedList, setAcceptedList] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "destination" | "all">("pending");

  // Fetch packages from server
  const loadPackages = async () => {
    setIsLoading(true);
    const res = await getIntakePackagesAction();
    if (res.success && res.packages) {
      setAllPackages(res.packages);
      if (res.offices) setOffices(res.offices);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPackages();
  }, []);

  // Update selected office once session is loaded
  useEffect(() => {
    if (session?.user?.officeId) {
      setSelectedOfficeId(session.user.officeId);
    }
  }, [session?.user?.officeId]);

  // Execute intake scan action
  const handleScan = async (barcode: string) => {
    const clean = barcode.trim();
    if (!clean) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const actorId = session?.user?.id || "";
    // If selectedOfficeId is "all", pass the session officeId or empty to let action resolve
    const officeIdToUse =
      selectedOfficeId !== "all"
        ? selectedOfficeId
        : session?.user?.officeId || "";

    const res = await intakeScanPackageAction(clean, officeIdToUse, actorId);

    setIsProcessing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.package) {
      setLastAccepted(res.package);
      setSuccessMessage(`Pakoja ${res.package.barcode} u pranua me sukses në magazinë!`);
      setAcceptedList((prev) => [res.package, ...prev]);

      // Update package status in local state immediately
      setAllPackages((prev) =>
        prev.map((p) =>
          p.id === res.package.id ? { ...p, status: "accepted_at_intake" } : p
        )
      );
    }
  };

  // Filter packages according to office, tab, and search query
  const filteredPackages = useMemo(() => {
    return allPackages.filter((pkg) => {
      // 1. Office filter
      if (selectedOfficeId !== "all") {
        if (activeTab === "pending" && pkg.intakeOfficeId !== selectedOfficeId) {
          return false;
        }
        if (activeTab === "destination" && pkg.destinationOfficeId !== selectedOfficeId) {
          return false;
        }
        if (
          activeTab === "all" &&
          pkg.intakeOfficeId !== selectedOfficeId &&
          pkg.destinationOfficeId !== selectedOfficeId
        ) {
          return false;
        }
      }

      // 2. Tab status filter
      if (activeTab === "pending" && pkg.status !== "created") {
        return false;
      }
      if (activeTab === "destination") {
        // Destination packages can be in any transit status
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBarcode = pkg.barcode?.toLowerCase().includes(q);
        const matchClient = pkg.clientName?.toLowerCase().includes(q);
        const matchPhone = pkg.clientPhone?.toLowerCase().includes(q);
        const matchCity = pkg.clientCity?.toLowerCase().includes(q);
        const matchSeller = pkg.sellerName?.toLowerCase().includes(q);
        if (!matchBarcode && !matchClient && !matchPhone && !matchCity && !matchSeller) {
          return false;
        }
      }

      return true;
    });
  }, [allPackages, selectedOfficeId, activeTab, searchQuery]);

  // Count metrics for tabs
  const pendingCount = useMemo(() => {
    return allPackages.filter((p) => {
      if (selectedOfficeId !== "all" && p.intakeOfficeId !== selectedOfficeId) return false;
      return p.status === "created";
    }).length;
  }, [allPackages, selectedOfficeId]);

  const destinationCount = useMemo(() => {
    return allPackages.filter((p) => {
      if (selectedOfficeId !== "all" && p.destinationOfficeId !== selectedOfficeId) return false;
      return true;
    }).length;
  }, [allPackages, selectedOfficeId]);

  const currentOfficeName = useMemo(() => {
    if (selectedOfficeId === "all") return "Të Gjitha Zyrat";
    const found = offices.find((o) => o.id === selectedOfficeId);
    return found ? found.name : "Zyra Postare";
  }, [offices, selectedOfficeId]);

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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fce883]/30 text-neutral-900 dark:text-neutral-100 text-xs font-bold mb-1">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentOfficeName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              Pranimi i Pakove në Zyrë (Intake Scanner)
            </h1>
            <p className="text-xs text-neutral-500">
              Skanoni ose përzgjidhni pakot për t'i pranuar në magazinë gati për paketim në çantë.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Office selector dropdown */}
          <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1.5 border border-neutral-200 dark:border-neutral-700">
            <Building2 className="w-4 h-4 text-neutral-500 ml-1" />
            <select
              value={selectedOfficeId}
              onChange={(e) => setSelectedOfficeId(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer pr-2"
            >
              <option value="all">Të Gjitha Zyrat</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.code})
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={loadPackages}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-xs font-semibold gap-1.5"
            title="Rifresko listën e pakove"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Rifresko</span>
          </Button>
        </div>
      </div>

      {/* 1. Barcode Scanner Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-200 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            Skanimi i Barkodit të Pakos
          </h2>
          <span className="text-[11px] text-neutral-400 font-medium">
            Mbështet skaner fizik, kamerë, ose shkrim manual
          </span>
        </div>

        <BarcodeScanner
          onScan={handleScan}
          disabled={isProcessing}
          placeholder="Shkruani barkodin (psh. PF-276188 ose thjesht 276188)..."
        />

        {/* Live error and success alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

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

      {/* 2. Visual Packages Section */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
        {/* Section Top Header with Tabs */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                Pakot e Pritshme në këtë Zyrë
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Gjeni pakon vizualisht me kërkim të menjëhershëm ose klikoni butonin për ta pranuar pa pasur nevojë të shkruani.
              </p>
            </div>

            <Button asChild size="sm" variant="outline" className="text-xs font-bold self-start sm:self-auto">
              <Link href="/office/bags">
                Vazhdo te Çantat <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === "pending"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                <span>Për Pranim (Krijuar)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px]">
                  {pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("destination")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === "destination"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                <span>Me Destinacion Këtë Zyrë</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px]">
                  {destinationCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "all"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                Të Gjitha ({allPackages.length})
              </button>
            </div>

            {/* Instant Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtro barkodin, klientin, qytetin..."
                className="pl-9 h-9 text-xs bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Packages List / Cards */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-neutral-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500" />
            <div>Duke ngarkuar pakot e zyrës...</div>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Nuk u gjet asnjë pako sipas këtij filtri
            </div>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {searchQuery
                ? `Asnjë pako nuk përputhet me kërkimin '${searchQuery}'. Provoni të fshini kërkimin ose zgjidhni 'Të Gjitha Zyrat'.`
                : activeTab === "pending"
                ? "Nuk ka pako me status 'krijuar' që presin pranimin fizik për këtë zyrë."
                : "Nuk ka pako të regjistruara për këtë kategori."}
            </p>
            {selectedOfficeId !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOfficeId("all")}
                className="text-xs font-semibold mt-2"
              >
                Shfaq Pakot nga Të Gjitha Zyrat
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredPackages.map((pkg) => {
              const isCreated = pkg.status === "created";
              return (
                <div
                  key={pkg.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 ${
                    isCreated ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                  }`}
                >
                  {/* Left Column: Barcode & Client Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleScan(pkg.barcode)}
                        title="Kliko për ta skanuar"
                        className="font-mono text-sm font-black text-neutral-900 dark:text-neutral-100 bg-[#fce883]/40 hover:bg-[#fce883] px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-amber-300/60"
                      >
                        {pkg.barcode}
                      </button>

                      {/* Status Tag */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          pkg.status === "created"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : pkg.status === "accepted_at_intake"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : pkg.status === "bagged"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                            : pkg.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                        }`}
                      >
                        {pkg.status === "created"
                          ? "Në Pritje të Pranimit (Krijuar)"
                          : pkg.status === "accepted_at_intake"
                          ? "Pranuar në Zyrë"
                          : pkg.status === "bagged"
                          ? "Në Çantë"
                          : pkg.status}
                      </span>

                      {/* Payment Type */}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {pkg.paymentType === "cod" ? "Me Pagesë COD" : "E Parapaguar"}
                      </span>
                    </div>

                    {/* Recipient & Phone */}
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
                        <span>Dërguesi: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{pkg.sellerName || "Shitës"}</span></span>
                      </div>
                    </div>

                    {/* Routing Offices */}
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-0.5">
                      <span className="font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                        Nga: {pkg.intakeOfficeName}
                      </span>
                      <span>&rarr;</span>
                      <span className="font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                        Te: {pkg.destinationOfficeName}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Amount & 1-Click Action Button */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                    <div className="text-right">
                      <div className="text-base font-black text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(pkg.amount)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {pkg.paymentType === "cod" ? "Vlera COD për mbledhje" : "Pako e parapaguar"}
                      </div>
                    </div>

                    {isCreated ? (
                      <Button
                        type="button"
                        onClick={() => handleScan(pkg.barcode)}
                        disabled={isProcessing}
                        className="bg-neutral-900 hover:bg-neutral-800 text-[#fce883] font-bold text-xs px-4 py-2 rounded-xl shadow-xs gap-1.5"
                      >
                        <Check className="w-4 h-4 text-[#fce883]" />
                        Prano Pakon (Scan)
                      </Button>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        Pranuar
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Session Accepted History */}
      {acceptedList.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pakot e Pranuara në këtë Sesion ({acceptedList.length})
            </h2>
            <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
              <Link href="/office/bags">
                Vazhdo te Ngarkimi i Çantave &rarr;
              </Link>
            </Button>
          </div>

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
        </div>
      )}
    </div>
  );
}
