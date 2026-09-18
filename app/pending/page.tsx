import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, ShieldAlert, LogOut, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PendingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "pending";

  // If already assigned a role, redirect to corresponding dashboard
  if (role !== "pending") {
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
      default:
        redirect("/seller");
    }
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-[#fffdf5] via-[#fefce8] to-[#fce883]/30 dark:from-[#09090b] dark:via-[#141208] dark:to-[#0c0a00]">
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

      {/* Subtle dot pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] dark:opacity-[0.04] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight text-neutral-900 dark:text-neutral-50">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fce883] text-neutral-950 font-black shadow-md shadow-[#fce883]/50 ring-1 ring-black/10">
              ⚡
            </span>
            Posta Fast
          </Link>
        </div>

        {/* Pending Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl shadow-neutral-950/5 dark:shadow-black/60 text-center space-y-6">
          {/* Animated Status Icon */}
          <div className="relative inline-flex">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#fce883] to-amber-400 flex items-center justify-center text-neutral-950 shadow-lg shadow-[#fce883]/50">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3 border border-amber-200 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Llogaria në Shqyrtim
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              Mirësevini, {session.user.name || "Përdorues"}!
            </h1>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
              Llogaria juaj është regjistruar me sukses. Aktualisht nuk ju është caktuar ende një rol nga Administratori.
            </p>
          </div>

          {/* User Details Box */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-neutral-500 font-medium">Email:</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{session.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 font-medium">Statusi:</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">Pritje për Caktim Roli</span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400">
            Sapo Administratori t&apos;ju caktojë rolin (Shitës, Korrier, Zyrë Postare, apo Financë), do të keni akses të plotë në panelin përkatës.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              asChild
              className="flex-1 h-11 font-bold bg-neutral-900 text-[#fce883] hover:bg-neutral-800 shadow-md text-xs"
            >
              <Link href="/pending">
                <RefreshCw className="w-4 h-4 mr-2" />
                Rifresko Statusin
              </Link>
            </Button>

            <form action={handleSignOut} className="flex-1">
              <Button
                type="submit"
                variant="outline"
                className="w-full h-11 font-semibold border-neutral-300 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Dil nga Llogaria
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
