import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOut } from "./actions/auth";
import { connection } from "next/server";
import { createClient } from "../lib/supabase/server";

  export default function Home() {
    return (
      <Suspense fallback={<main className="min-h-screen bg-[#f3f5ef]" />}>
        <AuthenticatedHome />
      </Suspense>
    );
  }

  async function AuthenticatedHome() {
    await connection();

  const supabase = await createClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f3f5ef] px-5 py-8 text-[#1c3029] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between border-b border-[#d6ddd4] pb-5">
          <a className="flex items-center gap-3" href="/">
            <span className="grid size-9 place-items-center rounded-md bg-[#174f40] text-sm font-bold text-white">SN</span>
            <span className="text-sm font-semibold tracking-wide">Secure Notes</span>
          </a>
          <span className="text-xs font-medium uppercase text-[#6a7971]">Tutor workspace</span>
        </header>
        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="text-xs font-semibold uppercase text-[#728078]">Private workspace</p>
          <h1 className="mt-3 text-3xl font-semibold">Your account is ready.</h1>
          <p className="mt-3 text-sm text-[#52645b]">
            Signed in as <span className="font-medium text-[#1c3029]">{user.email}</span>
          </p>
          <form action={signOut} className="mt-8">
            <button
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#174f40] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#103d31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f40]"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
