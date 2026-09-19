"use client";

import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, CameraOff, Barcode, CheckCircle2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/context";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCodeChange?: (code: string) => void;
  value?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function BarcodeScanner({
  onScan,
  onCodeChange,
  value,
  placeholder,
  autoFocus = true,
  disabled = false,
  className = "",
}: BarcodeScannerProps) {
  const { t } = useTranslation();
  const [internalCode, setInternalCode] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const currentCode = value !== undefined ? value : internalCode;

  const handleInputChange = (val: string) => {
    if (value === undefined) {
      setInternalCode(val);
    }
    onCodeChange?.(val);
  };

  // Play subtle feedback beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context may be restricted before user interaction
    }
  };

  const handleScanSubmit = (codeToProcess: string) => {
    const trimmed = codeToProcess.trim();
    if (!trimmed || disabled) return;

    playBeep();
    setLastScanned(trimmed);
    onScan(trimmed);
    if (value === undefined) {
      setInternalCode("");
    }
    onCodeChange?.("");

    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Keyboard wedge / hardware barcode scanner listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScanSubmit(currentCode);
    }
  };

  // Toggle Camera Scanner
  const toggleCamera = () => {
    if (isCameraActive) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      setIsCameraActive(true);
    }
  };

  useEffect(() => {
    if (isCameraActive) {
      const scanner = new Html5QrcodeScanner(
        "barcode-reader-viewport",
        {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.777778,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          handleScanSubmit(decodedText);
          // Optional: pause briefly to prevent duplicate immediate scans
        },
        () => {
          // ignore scan frame errors
        }
      );

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [isCameraActive]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Barcode className="w-5 h-5 text-[#fce883]/90" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={currentCode}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t("scan_barcode")}
            autoFocus={autoFocus}
            disabled={disabled}
            className="pl-10 h-11 text-base font-mono tracking-wide bg-white/90 dark:bg-neutral-900/90 border-neutral-300 dark:border-neutral-700 focus-visible:ring-[#fce883]"
          />
        </div>

        <Button
          type="button"
          onClick={() => handleScanSubmit(currentCode)}
          disabled={disabled || !currentCode.trim()}
          className="h-11 px-5 font-semibold bg-neutral-900 text-neutral-50 dark:bg-[#fce883] dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-[#f5dd6c] shadow-xs"
        >
          {t("submit_scan")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={toggleCamera}
          className={`h-11 px-3 border-neutral-300 dark:border-neutral-700 ${
            isCameraActive ? "bg-[#fce883] text-neutral-950 border-[#fce883]" : ""
          }`}
          title={isCameraActive ? t("stop_camera") : t("camera_scan")}
        >
          {isCameraActive ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </Button>
      </div>

      {isCameraActive && (
        <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black/90 p-2 shadow-lg">
          <div id="barcode-reader-viewport" className="w-full max-w-md mx-auto" />
          <p className="text-center text-xs text-neutral-400 mt-2">
            Drejtoni kamerën drejt barkodit të pakos ose çantës
          </p>
        </div>
      )}

      {lastScanned && (
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>I skanuar së fundmi:</span>
          <span className="font-mono font-bold">{lastScanned}</span>
        </div>
      )}
    </div>
  );
}
