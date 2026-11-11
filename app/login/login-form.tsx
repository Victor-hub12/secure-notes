"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { authenticate, type AuthFormState } from "../actions/auth";

const initialState: AuthFormState = {};

export default function LoginForm({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, formAction, pending] = useActionState(authenticate, initialState);
  const visibleState = state.mode === mode ? state : {};
  const isSignup = mode === "signup";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#f3f5ef] text-[#1c3029]">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(#dce4dc_1px,transparent_1px),linear-gradient(90deg,#dce4dc_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between px-6 pb-10 pt-8 sm:px-10 lg:px-14 lg:py-12">
          <Link className="flex w-fit items-center gap-3" href="/">
            <span className="grid size-10 place-items-center rounded-md bg-[#174f40] text-sm font-bold text-white">
              SN
            </span>
            <span className="text-sm font-semibold tracking-wide">Secure Notes</span>
          </Link>
          <div className="max-w-lg py-12 lg:py-0">
            <p className="text-xs font-semibold uppercase text-[#63766b]">Tutor workspace</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              Keep lesson notes in the right hands.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#52645b]">
              A private workspace for the details behind every WAEC and JAMB lesson.
            </p>
          </div>
          <p className="hidden text-xs text-[#728078] lg:block">A focused place for your teaching work.</p>
        </section>

        <section className="flex items-center justify-center px-5 pb-10 sm:px-10 lg:py-12">
          <div className="w-full max-w-md border border-[#dce3db] bg-white p-6 shadow-[0_16px_48px_-32px_rgba(28,48,41,0.35)] sm:p-9">
            <p className="text-xs font-semibold uppercase text-[#718078]">
              {isSignup ? "Create your account" : "Welcome back"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {isSignup ? "Start a private workspace" : "Sign in to your notes"}
            </h2>

            <div className="mt-6 grid grid-cols-2 border-b border-[#dce3db]" role="tablist" aria-label="Account access">
              <button
                aria-selected={!isSignup}
                className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors ${!isSignup ? "border-[#174f40] text-[#174f40]" : "border-transparent text-[#728078] hover:text-[#1c3029]"}`}
                onClick={() => setMode("login")}
                role="tab"
                type="button"
              >
                Log in
              </button>
              <button
                aria-selected={isSignup}
                className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors ${isSignup ? "border-[#174f40] text-[#174f40]" : "border-transparent text-[#728078] hover:text-[#1c3029]"}`}
                onClick={() => setMode("signup")}
                role="tab"
                type="button"
              >
                Sign up
              </button>
            </div>

            {!configured && (
              <p className="mt-5 border-l-2 border-[#b45a3c] bg-[#fbf2ed] px-3 py-3 text-sm leading-6 text-[#713b2b]" role="status">
                Add the Supabase URL and publishable key to .env.local, then restart the app.
              </p>
            )}

            {visibleState.error && (
              <p className="mt-5 border-l-2 border-[#b45a3c] bg-[#fbf2ed] px-3 py-3 text-sm text-[#713b2b]" role="alert">
                {visibleState.error}
              </p>
            )}
            {visibleState.message && (
              <p className="mt-5 border-l-2 border-[#527b5f] bg-[#eff6ee] px-3 py-3 text-sm text-[#31563a]" role="status">
                {visibleState.message}
              </p>
            )}

            <form action={formAction} className="mt-6 space-y-5">
              <input name="mode" type="hidden" value={mode} />
              <label className="block text-sm font-medium" htmlFor="email">
                Email
                <input
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-md border border-[#cbd5cd] bg-white px-3 text-base outline-none transition focus:border-[#174f40] focus:ring-2 focus:ring-[#174f40]/15 disabled:bg-[#f3f5ef]"
                  disabled={!configured || pending}
                  id="email"
                  name="email"
                  required
                  type="email"
                />
              </label>
              <label className="block text-sm font-medium" htmlFor="password">
                Password
                <input
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="mt-2 h-12 w-full rounded-md border border-[#cbd5cd] bg-white px-3 text-base outline-none transition focus:border-[#174f40] focus:ring-2 focus:ring-[#174f40]/15 disabled:bg-[#f3f5ef]"
                  disabled={!configured || pending}
                  id="password"
                  minLength={6}
                  name="password"
                  required
                  type="password"
                />
              </label>
              <button
                className="flex h-12 w-full items-center justify-center rounded-md bg-[#174f40] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#103d31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f40] disabled:cursor-not-allowed disabled:bg-[#899990]"
                disabled={!configured || pending}
                type="submit"
              >
                {pending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}