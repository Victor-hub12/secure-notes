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

function isSchemaError(error: { code?: string }) {
  return ["PGRST204", "PGRST205", "42P01", "42703"].includes(error.code ?? "");
}

export default function NotePage({ params }: NotePageProps) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
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

  const { data: enhancedNote, error } = await supabase
    .from("notes")
    .select("id, title, body, category, project_id, tags, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  let note = enhancedNote;
  let workspaceSchemaMissing = false;

  if (error && isSchemaError(error)) {
    const { data: noteWithoutTags, error: noteWithoutTagsError } = await supabase
      .from("notes")
      .select("id, title, body, category, project_id, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (!noteWithoutTagsError && noteWithoutTags) {
      note = { ...noteWithoutTags, tags: [] };
    } else if (noteWithoutTagsError && isSchemaError(noteWithoutTagsError)) {
      const { data: legacyNote, error: legacyError } = await supabase
        .from("notes")
        .select("id, title, body, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();

      if (legacyError || !legacyNote) {
        notFound();
      }

      note = { ...legacyNote, category: "personal", project_id: null, tags: [] };
    } else if (noteWithoutTagsError) {
      throw new Error("The note could not be loaded from the database.");
    } else {
      notFound();
    }

    workspaceSchemaMissing = true;
  } else if (error || !enhancedNote) {
    notFound();
  }

  if (!note) {
    notFound();
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .order("name", { ascending: true });

  if (projectsError && isSchemaError(projectsError)) {
    workspaceSchemaMissing = true;
  } else if (projectsError) {
    throw new Error("Projects could not be loaded for the note editor.");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:min-h-[4.5rem] sm:px-6 lg:px-8">
          <Link className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" href="/">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-xs font-bold tracking-wide text-white shadow-sm dark:text-[#102019]">
              SN
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">Secure Notes</span>
          </Link>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-5">
            <p className="flex min-w-0 items-center gap-1 truncate text-xs text-muted sm:text-sm">
              <span className="shrink-0">Logged in as</span>
              <span className="truncate font-medium text-foreground">{user.email}</span>
            </p>
            <form action={signOut}>
              <button
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-border px-3.5 text-sm font-medium transition duration-150 hover:bg-background active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-medium text-muted transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          href="/"
        >
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.5 5-7 7 7 7" />
          </svg>
          Back to my notes
        </Link>

        <section className="mb-6 mt-5 sm:mb-8 sm:mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Your notebook</p>
          <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl">Edit note</h1>
          <p className="mt-2 text-sm text-muted">
            Last updated{" "}
            {new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(note.updated_at))}
          </p>
        </section>

        <NoteEditor
          noteId={String(note.id)}
          initialTitle={note.title}
          initialBody={note.body}
          initialCategory={note.category}
          initialProjectId={!note.project_id ? "" : String(note.project_id)}
          initialTags={note.tags ?? []}
          workspaceSchemaMissing={workspaceSchemaMissing}
          projects={(projects ?? []).map((project) => ({ id: String(project.id), name: project.name }))}
        />
      </div>
    </main>
  );
}
