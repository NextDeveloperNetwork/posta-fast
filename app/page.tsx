import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Coins,
  Building2,
  Truck,
  ShoppingBag,
  ArrowRight,
  Package,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role || "pending";
    switch (role) {
      case "admin":
        redirect("/admin");
      case "finance":
        redirect("/finance");
      case "office":
        redirect("/office");
      case "courier":
        redirect("/courier");
      case "seller":
        redirect("/seller");
      case "pending":
      default:
        redirect("/pending");
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-[#fffdf5] via-[#fefce8] to-[#fce883]/30 dark:from-[#09090b] dark:via-[#141208] dark:to-[#0c0a00]">
      {/* Decorative gradient blur orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[500px] bg-gradient-to-b from-[#fce883] via-[#fce883]/70 to-transparent rounded-full blur-[130px] opacity-75 dark:opacity-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -left-32 w-[420px] h-[420px] bg-[#fce883]/50 dark:bg-[#fce883]/10 rounded-full blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -right-32 w-[400px] h-[400px] bg-amber-200/60 dark:bg-amber-500/10 rounded-full blur-[100px]"
      />

      {/* Dot Pattern Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] dark:opacity-[0.04] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      <div className="relative z-10 w-full max-w-4xl py-12 px-4 text-center">
        {/* Brand Header */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 shadow-xs mb-6">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#fce883] text-neutral-950 font-black text-xs">
            ⚡
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
            Posta Fast • Sistemi Postar Shqiptar
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 mb-4">
          Rrjeti Postar dhe i Korrierëve{" "}
          <span className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
            Më i Shpejtë në Shqipëri
          </span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
          Sistemi i dedikuar me ndërfaqe të veçanta për Administratorin, Financën, Zyrat Postare,
          Korrierët dhe Shitësit. Llogaritje automatike e tarifave në monedhën <strong>ALL</strong>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="h-12 px-8 font-bold text-base bg-neutral-950 text-[#fce883] hover:bg-neutral-900 shadow-lg shadow-neutral-950/10"
          >
            <Link href="/login">
              Kyçu në Llogari <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 px-6 font-semibold bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-neutral-300 dark:border-neutral-700"
          >
            <Link href="/register">Regjistrohu</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
