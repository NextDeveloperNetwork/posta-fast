"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="bg-neutral-900 text-[#fce883] hover:bg-neutral-800 font-bold shadow-md"
    >
      <Printer className="w-4 h-4 mr-2" /> Printo Etiketën
    </Button>
  );
}
