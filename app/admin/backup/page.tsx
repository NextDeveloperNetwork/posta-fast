"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTranslation } from "@/lib/i18n/context";
import {
  getDatabaseStatsAction,
  restoreDatabaseAction,
  resetDatabaseAction,
} from "@/app/actions/backup";
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  RotateCcw,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  Package,
  ShoppingBag,
  Banknote,
  Wallet,
  RefreshCw,
  FileCode,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminBackupPage() {
  const { t } = useTranslation();

  // State
  const [stats, setStats] = useState({
    users: 0,
    offices: 0,
    packages: 0,
    bags: 0,
    closings: 0,
    payouts: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Alert state
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info" | null;
    message: string | null;
  }>({ type: null, message: null });

  // Restore State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{
    version?: string;
    exportedAt?: string;
    exportedBy?: string;
    counts?: Record<string, number>;
  } | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Reset State
  const [resetModalMode, setResetModalMode] = useState<"operational" | "full" | null>(null);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Load stats
  const fetchStats = async () => {
    setIsLoadingStats(true);
    const res = await getDatabaseStatsAction();
    if (res.success && res.stats) {
      setStats(res.stats);
    }
    setIsLoadingStats(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle Export Download
  const handleExport = () => {
    setAlert({
      type: "info",
      message: "Duke përgatitur skedarin e backup-it...",
    });
    // Direct link to the API route triggers browser native download
    window.location.href = "/api/admin/backup/export";
    setTimeout(() => {
      setAlert({
        type: "success",
        message: "Skedari i backup-it u gjenerua me sukses!",
      });
    }, 1500);
  };

  // Handle File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setAlert({
        type: "error",
        message: "Ju lutemi ngarkoni vetëm skedarë me format .json",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setFileContent(text);
        const parsed = JSON.parse(text);
        setFilePreview({
          version: parsed.meta?.version || "1.0",
          exportedAt: parsed.meta?.exportedAt || "E panjohur",
          exportedBy: parsed.meta?.exportedBy || "E panjohur",
          counts: parsed.meta?.counts || null,
        });
        setAlert({ type: null, message: null });
      } catch (err) {
        setAlert({
          type: "error",
          message: "Skedari i zgjedhur nuk është një JSON i vlefshëm.",
        });
        setSelectedFile(null);
        setFilePreview(null);
        setFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  // Trigger Restore
  const handleConfirmRestore = async () => {
    if (!fileContent) return;
    setIsRestoring(true);
    setShowRestoreModal(false);

    startTransition(async () => {
      const res = await restoreDatabaseAction(fileContent);
      setIsRestoring(false);
      if (res.success) {
        setAlert({
          type: "success",
          message: res.message || "Rikthimi i të dhënave u krye me sukses!",
        });
        setSelectedFile(null);
        setFilePreview(null);
        setFileContent(null);
        await fetchStats();
      } else {
        setAlert({
          type: "error",
          message: res.error || "Ndodhi një gabim gjatë rikthimit të të dhënave.",
        });
      }
    });
  };

  // Trigger Reset
  const handleConfirmReset = async () => {
    if (!resetModalMode || confirmationInput.trim() !== "RESET") return;
    setIsResetting(true);

    startTransition(async () => {
      const res = await resetDatabaseAction(resetModalMode, confirmationInput);
      setIsResetting(false);
      setResetModalMode(null);
      setConfirmationInput("");

      if (res.success) {
        setAlert({
          type: "success",
          message: res.message || "Resetimi u krye me sukses!",
        });
        await fetchStats();
      } else {
        setAlert({
          type: "error",
          message: res.error || "Ndodhi një gabim gjatë resetimit.",
        });
      }
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fce883]/30 text-neutral-900 dark:text-neutral-100 text-xs font-bold mb-2">
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>{t("nav_backup")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            {t("backup_title")}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {t("backup_subtitle")}
          </p>
        </div>

        <Button
          onClick={fetchStats}
          variant="outline"
          size="sm"
          disabled={isLoadingStats}
          className="self-start sm:self-auto gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? "animate-spin" : ""}`} />
          Rifresko Statistikat
        </Button>
      </div>

      {/* Dynamic Feedback Alert */}
      {alert.type && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border text-sm font-medium animate-in fade-in duration-200 ${
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
              : alert.type === "error"
              ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
              : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
          }`}
        >
          {alert.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />}
          {alert.type === "error" && <XCircle className="w-5 h-5 shrink-0 text-red-600" />}
          {alert.type === "info" && <Info className="w-5 h-5 shrink-0 text-blue-600" />}
          <div className="flex-1">{alert.message}</div>
          <button
            onClick={() => setAlert({ type: null, message: null })}
            className="text-neutral-400 hover:text-neutral-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Database State Summary Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          {t("backup_stats_title")}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-semibold">{t("backup_stat_users")}</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.users}</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-semibold">{t("backup_stat_offices")}</span>
              <Building2 className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.offices}</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-semibold">{t("backup_stat_packages")}</span>
              <Package className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.packages}</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-semibold">{t("backup_stat_bags")}</span>
              <ShoppingBag className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.bags}</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-semibold">{t("backup_stat_closings")}</span>
              <Banknote className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.closings}</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-xs font-semibold">{t("backup_stat_payouts")}</span>
              <Wallet className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.payouts}</div>
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Export / Create Backup */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50">
              {t("backup_export_title")}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              {t("backup_export_desc")}
            </p>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                Përmbajtja e kopjes rezervë:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-neutral-500 dark:text-neutral-400 pl-1">
                <li>Të gjitha cilësimet, tarifat dhe komisionet</li>
                <li>Llogaritë e përdoruesve dhe zyrat postare</li>
                <li>Të gjitha pakot, historiku i skanimeve dhe manifestet</li>
                <li>Çantat, mbylljet ditore të parave dhe shpërndarjet e fitimit</li>
              </ul>
            </div>
          </div>

          <div className="pt-6">
            <Button
              onClick={handleExport}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-[#fce883] font-bold py-6 rounded-xl shadow-md gap-2"
            >
              <Download className="w-5 h-5" />
              {t("backup_export_btn")}
            </Button>
          </div>
        </div>

        {/* Section 2: Restore from Backup */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50">
              {t("backup_restore_title")}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              {t("backup_restore_desc")}
            </p>

            {/* File Input */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                {t("backup_restore_select_file")}
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full text-xs text-neutral-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#fce883] file:text-neutral-900 hover:file:bg-amber-300 file:cursor-pointer border border-neutral-200 dark:border-neutral-700 rounded-xl p-2 bg-neutral-50 dark:bg-neutral-800"
              />
            </div>

            {/* Preview Selected File */}
            {filePreview && (
              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 text-xs space-y-1.5 animate-in fade-in">
                <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                  <span>Skedari i Zgjedhur: {selectedFile?.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-800/60 text-blue-800 dark:text-blue-200">
                    v{filePreview.version}
                  </span>
                </div>
                <div className="text-neutral-600 dark:text-neutral-300 text-[11px]">
                  Eksportuar më: <span className="font-mono">{filePreview.exportedAt}</span>
                </div>
                {filePreview.counts && (
                  <div className="text-neutral-500 dark:text-neutral-400 text-[11px] grid grid-cols-3 gap-1 pt-1 font-mono">
                    <div>Pako: {filePreview.counts.packages ?? 0}</div>
                    <div>Zyra: {filePreview.counts.offices ?? 0}</div>
                    <div>Përdorues: {filePreview.counts.users ?? 0}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-6">
            <Button
              onClick={() => setShowRestoreModal(true)}
              disabled={!fileContent || isRestoring}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl shadow-md gap-2 disabled:opacity-50"
            >
              <RotateCcw className={`w-5 h-5 ${isRestoring ? "animate-spin" : ""}`} />
              {isRestoring ? "Duke rikthyer..." : t("backup_restore_btn")}
            </Button>
          </div>
        </div>
      </div>

      {/* Section 3: Danger Zone - Database Reset */}
      <div className="p-6 rounded-2xl bg-red-50/40 dark:bg-red-950/10 border-2 border-red-200 dark:border-red-900/40 shadow-xs space-y-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="text-lg font-black text-red-700 dark:text-red-400">
              {t("backup_reset_title")}
            </h3>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">
              Veprimet në këtë zonë janë të pakthyeshme. Rekomandohet të shkarkoni një backup më parë!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Operational Data Reset */}
          <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-red-200/80 dark:border-red-900/30 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                Rekomandohet për rifillim të testimit
              </div>
              <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                {t("backup_reset_operational_title")}
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {t("backup_reset_operational_desc")}
              </p>
            </div>

            <div className="pt-5">
              <Button
                onClick={() => {
                  setResetModalMode("operational");
                  setConfirmationInput("");
                }}
                variant="outline"
                className="w-full border-amber-300 hover:bg-amber-50 text-amber-900 dark:border-amber-700 dark:hover:bg-amber-950/40 dark:text-amber-300 font-bold text-xs py-5"
              >
                <Trash2 className="w-4 h-4 mr-2 text-amber-600" />
                {t("backup_reset_operational_btn")}
              </Button>
            </div>
          </div>

          {/* Option B: Full Factory Reset */}
          <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-red-300 dark:border-red-900 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 text-[11px] font-bold">
                Fshirje e Plotë e Sistemit
              </div>
              <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                {t("backup_reset_full_title")}
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {t("backup_reset_full_desc")}
              </p>
            </div>

            <div className="pt-5">
              <Button
                onClick={() => {
                  setResetModalMode("full");
                  setConfirmationInput("");
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-5 shadow-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("backup_reset_full_btn")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL: RESTORE */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50">
                Konfirmo Rikthimin e Bazës
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {t("backup_restore_confirm")}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-xs space-y-1 font-mono text-neutral-600 dark:text-neutral-300">
              <div>Skedari: {selectedFile?.name}</div>
              <div>Data e Backup-it: {filePreview?.exportedAt}</div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRestoreModal(false)}
                className="flex-1 text-xs"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                {isRestoring ? "Duke u zbatuar..." : "Po, Rikthe Tani"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESET */}
      {resetModalMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border-2 border-red-300 dark:border-red-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-red-600 dark:text-red-400">
                {resetModalMode === "operational"
                  ? "Konfirmo Resetimin e Pakove"
                  : "Konfirmo Resetimin e Plotë të Sistemit"}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                {resetModalMode === "operational"
                  ? "Të gjitha pakot, çantat, mbylljet e arkave dhe pagesat do të fshihen. Ky veprim është i pakthyeshëm."
                  : "KUJDES: Të gjitha zyrat dhe llogaritë do të fshihen plotësisht. Vetëm llogaria juaj si administrator do të ruhet."}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {t("backup_confirm_prompt")}
              </label>
              <Input
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Shkruani RESET"
                className="text-xs font-mono font-bold tracking-wider"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResetModalMode(null);
                  setConfirmationInput("");
                }}
                className="flex-1 text-xs"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleConfirmReset}
                disabled={confirmationInput.trim() !== "RESET" || isResetting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs disabled:opacity-40"
              >
                {isResetting ? "Duke fshirë..." : "Konfirmo dhe Fshi"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
