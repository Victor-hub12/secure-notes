import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOut } from "./actions/auth";
import { createClient } from "../lib/supabase/server";
import NewNoteForm from "./new-note-form";

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

  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#f3f5ef] px-5 py-6 text-[#1c3029] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d6ddd4] pb-5">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid size-9 place-items-center rounded-md bg-[#174f40] text-sm font-bold text-white">SN</span>
            <span className="text-sm font-semibold tracking-wide">Secure Notes</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="max-w-[min(60vw,20rem)] truncate text-sm text-[#52645b]">{user.email}</span>
            <form action={signOut}>
              <button
                className="rounded-md border border-[#cbd5cd] px-3 py-2 text-sm font-medium transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f40]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section className="py-9 sm:py-12">
          <p className="text-xs font-semibold uppercase text-[#718078]">Tutor workspace</p>
          <h1 className="mt-2 text-3xl font-semibold">My notes</h1>
        </section>

        <section aria-labelledby="new-note-heading" className="border-y border-[#d6ddd4] py-6 sm:py-8">
          <h2 className="text-lg font-semibold" id="new-note-heading">New note</h2>
          <NewNoteForm />
        </section>

        <section aria-labelledby="notes-heading" className="pb-16 pt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold" id="notes-heading">Recent notes</h2>
            <span className="text-sm text-[#718078]">{notes?.length ?? 0}</span>
          </div>

          {error ? (
            <p className="mt-5 text-sm text-[#8b3c2a]" role="alert">Your notes could not be loaded. Refresh the page to try again.</p>
          ) : notes?.length ? (
            <ul className="mt-3 divide-y divide-[#d6ddd4]">
              {notes.map((note) => (
                <li className="py-5" key={note.id}>
                  <article>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="text-base font-semibold">
                        <Link className="hover:underline" href={`/notes/${note.id}`}>
                          {note.title}
                        </Link>
                      </h3>
                      <time className="text-xs text-[#718078]" dateTime={note.created_at}>
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(note.created_at))}
                      </time>
                    </div>
                    {note.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#52645b]">{note.body}</p>}
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-[#718078]">No notes yet. Add your first lesson note above.</p>
          )}
        </section>
      </div>
    </main>
  );
}
