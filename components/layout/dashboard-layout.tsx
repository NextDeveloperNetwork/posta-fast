"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Barcode,
  ShoppingBag,
  Truck,
  CheckSquare,
  Wallet,
  Banknote,
  Building2,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  PlusCircle,
  FileCheck,
  Coins,
  ShieldAlert,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    officeId?: string | null;
    officeName?: string | null;
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const { t, language, setLanguage } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user.role || "seller";

  // Build nav links according to active role
  const getNavLinks = () => {
    switch (role) {
      case "admin":
        return [
          { href: "/admin", label: t("nav_dashboard"), icon: LayoutDashboard },
          { href: "/admin/offices", label: t("nav_offices"), icon: Building2 },
          { href: "/admin/users", label: t("nav_users"), icon: Users },
          { href: "/admin/settings", label: t("nav_settings"), icon: Settings },
          { href: "/admin/backup", label: t("nav_backup"), icon: Database },
          { href: "/admin/packages", label: t("nav_packages"), icon: Package },
          { href: "/finance", label: "Pamja Financiare", icon: Coins },
        ];
      case "finance":
        return [
          { href: "/finance", label: t("nav_dashboard"), icon: LayoutDashboard },
          { href: "/finance/cash-intake", label: t("nav_cash_intake"), icon: Banknote },
          { href: "/finance/commissions", label: t("nav_commissions"), icon: Coins },
          { href: "/finance/payouts", label: t("nav_payouts"), icon: Wallet },
        ];
      case "office":
        return [
          { href: "/office", label: t("nav_dashboard"), icon: LayoutDashboard },
          { href: "/office/intake", label: t("nav_intake"), icon: Barcode },
          { href: "/office/bags", label: t("nav_bags"), icon: ShoppingBag },
          { href: "/office/unloading", label: t("nav_unloading"), icon: CheckSquare },
          { href: "/office/delivery", label: t("nav_final_delivery"), icon: Truck },
          { href: "/office/closing", label: t("nav_closing"), icon: Banknote },
        ];
      case "courier":
        return [
          { href: "/courier", label: t("nav_dashboard"), icon: LayoutDashboard },
          { href: "/courier/deliveries", label: t("nav_my_deliveries"), icon: Truck },
          { href: "/courier/bags", label: t("nav_my_bags"), icon: ShoppingBag },
          { href: "/courier/cash-transit", label: t("nav_cash_transit"), icon: Banknote },
        ];
      case "seller":
      default:
        return [
          { href: "/seller", label: t("nav_dashboard"), icon: LayoutDashboard },
          { href: "/seller/new", label: t("nav_new_package"), icon: PlusCircle },
          { href: "/seller/packages", label: t("nav_packages"), icon: Package },
          { href: "/seller/payouts", label: t("nav_payouts"), icon: Wallet },
        ];
    }
  };

  const navLinks = getNavLinks();

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "admin":
        return { label: t("role_admin"), color: "bg-red-500/10 text-red-600 border-red-200" };
      case "finance":
        return { label: t("role_finance"), color: "bg-purple-500/10 text-purple-600 border-purple-200" };
      case "office":
        return { label: t("role_office"), color: "bg-blue-500/10 text-blue-600 border-blue-200" };
      case "courier":
        return { label: t("role_courier"), color: "bg-amber-500/10 text-amber-700 border-amber-300" };
      case "seller":
      default:
        return { label: t("role_seller"), color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" };
    }
  };

  const roleBadge = getRoleBadge(role);

  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950 flex flex-col md:flex-row">
      {/* ========================================================= */}
      {/* MOBILE TOPBAR (Optimized for iPhone 14 Pro Max 430px) */}
      {/* ========================================================= */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fce883] text-neutral-950 font-black shadow-xs">
              ⚡
            </span>
            <span className="font-extrabold text-neutral-900 dark:text-neutral-50">Posta Fast</span>
          </Link>
        </div>

        {/* Quick Language Toggle & Role Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === "sq" ? "en" : "sq")}
            className="px-2 py-1 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase">{language}</span>
          </button>
          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${roleBadge.color}`}>
            {roleBadge.label}
          </span>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE DRAWER OVERLAY */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="w-72 max-w-[85vw] h-full bg-white dark:bg-neutral-900 p-5 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fce883] text-neutral-950 font-black shadow-xs">
                  ⚡
                </span>
                <span className="font-extrabold">Posta Fast</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-neutral-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Përdoruesi
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {user.name || user.email}
              </div>
              {user.officeName && (
                <div className="text-xs text-neutral-500 mt-0.5">
                  📍 {user.officeName}
                </div>
              )}
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto py-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#fce883] text-neutral-950 font-bold shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full justify-start gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="w-4 h-4" />
                {t("nav_logout")}
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================================= */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-r border-neutral-200/80 dark:border-neutral-800">
        {/* Brand Header */}
        <div className="p-5 border-b border-neutral-200/70 dark:border-neutral-800">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fce883] text-neutral-950 font-black shadow-md shadow-[#fce883]/40 ring-1 ring-black/5">
              ⚡
            </span>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-neutral-900 dark:text-neutral-50 block leading-tight">
                Posta Fast
              </span>
              <span className="text-[10px] text-neutral-500 tracking-wider uppercase font-medium">
                Albanian Courier Network
              </span>
            </div>
          </Link>
        </div>

        {/* User Card & Role */}
        <div className="px-5 py-4 border-b border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
            <button
              onClick={() => setLanguage(language === "sq" ? "en" : "sq")}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[#fce883] hover:text-neutral-950 transition-colors uppercase"
              title="Toggle Language (Shqip / English)"
            >
              {language}
            </button>
          </div>
          <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {user.name || user.email}
          </div>
          {user.officeName && (
            <div className="text-xs text-neutral-500 font-medium truncate mt-0.5">
              📍 {user.officeName}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#fce883] text-neutral-950 font-bold shadow-xs shadow-neutral-950/5 translate-x-0.5"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-neutral-950" : "text-neutral-500"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Footer / Logout */}
        <div className="p-3 border-t border-neutral-200/70 dark:border-neutral-800">
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full justify-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("nav_logout")}</span>
          </Button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-8">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
