import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOut } from "../../actions/auth";
import { createClient } from "../../../lib/supabase/server";
import NoteEditor from "./note-editor";

type NotePageProps = {
  params: Promise<{ id: string }>;
};

export default function NotePage({ params }: NotePageProps) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f3f5ef]" />}>
      <NoteContent params={params} />
    </Suspense>
  );
}

async function NoteContent({ params }: NotePageProps) {
  await connection();
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

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

  const { data: note, error } = await supabase
    .from("notes")
    .select("id, title, body, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !note) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f3f5ef] px-5 py-6 text-[#1c3029] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-3xl">
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

        <section className="py-8 sm:py-10">
          <Link className="text-sm font-medium text-[#426455] hover:underline" href="/">
            Back to my notes
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase text-[#718078]">Edit note</p>
          <h1 className="mt-2 text-3xl font-semibold">{note.title}</h1>
          <p className="mt-2 text-sm text-[#718078]">
            Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(note.updated_at))}
          </p>
        </section>

        <NoteEditor noteId={String(note.id)} initialTitle={note.title} initialBody={note.body} />
      </div>
    </main>
  );
}