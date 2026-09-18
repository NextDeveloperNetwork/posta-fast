"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { SocialButtons } from "@/components/auth/social-buttons";
import { loginWithCredentials, AuthActionResult } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    loginWithCredentials,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight text-neutral-900 dark:text-neutral-50">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fce883] text-neutral-950 font-black shadow-md shadow-[#fce883]/50 ring-1 ring-black/10">
              ⚡
            </span>
            Posta Fast
          </Link>
        </div>

        <Card className="shadow-2xl shadow-neutral-950/5 dark:shadow-black/60 border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-xl bg-white/90 dark:bg-neutral-900/90">
          <CardHeader className="space-y-1.5 text-center pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">Kyçu në Llogari</CardTitle>
            <CardDescription className="text-sm text-neutral-500 dark:text-neutral-400">
              Shkruani kredencialet ose zgjidhni një rol më lart
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <SocialButtons />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-neutral-900 px-3 text-neutral-400 dark:text-neutral-500 font-medium">
                  Ose vazhdo me email
                </span>
              </div>
            </div>

            {state?.error && (
              <div className="p-3 text-sm rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300" htmlFor="email">
                  Adresa Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300" htmlFor="password">
                    Fjalëkalimi
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Password reset instructions will be sent to your email.");
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:underline"
                  >
                    Keni harruar fjalëkalimin?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-medium bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors shadow-sm"
                disabled={isPending}
              >
                {isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-2 pb-4 text-center justify-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-neutral-900 dark:text-neutral-100 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
