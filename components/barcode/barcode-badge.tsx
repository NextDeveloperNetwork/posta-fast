"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeBadgeProps {
  value: string;
  format?: "CODE128" | "EAN13" | "UPC";
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export function BarcodeBadge({
  value,
  format = "CODE128",
  width = 1.6,
  height = 42,
  displayValue = true,
  className = "",
}: BarcodeBadgeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize: 13,
          font: "monospace",
          textMargin: 2,
          margin: 6,
          background: "transparent",
          lineColor: "#171717",
        });
      } catch (err) {
        console.error("JsBarcode render error:", err);
      }
    }
  }, [value, format, width, height, displayValue]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white dark:bg-neutral-100 p-1.5 rounded-lg border border-neutral-200 shadow-xs ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
}
