"use client";

import { useActionState } from "react";
import { createNote, type NoteFormState } from "./actions/notes";

const initialState: NoteFormState = {};

type ProjectOption = { id: string; name: string };

export default function NewNoteForm({ projects }: { projects: ProjectOption[] }) {
  const [state, formAction, pending] = useActionState(createNote, initialState);
  const errorMessage = state.error === "Enter a title for your note."
    ? "Enter a title for your note"
    : state.error;

  return (
    <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)_minmax(130px,0.6fr)_minmax(140px,0.7fr)_minmax(110px,0.6fr)_auto] lg:items-end">
      <label className="block text-sm font-medium" htmlFor="note-title">
        Title
        <input
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "note-title-error" : undefined}
          autoComplete="off"
          className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition duration-150 placeholder:text-muted/70 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
          id="note-title"
          name="title"
          placeholder="e.g. Tolu, maths"
          type="text"
        />
      </label>
      <label className="block text-sm font-medium sm:col-span-2 lg:col-span-1" htmlFor="note-body">
        Note
        <textarea
          className="mt-2 min-h-32 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-base leading-6 text-foreground outline-none transition duration-150 placeholder:text-muted/70 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
          id="note-body"
          name="body"
          placeholder="Write a few details to help future you..."
          rows={4}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="note-category">
        Category
        <select
          className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition duration-150 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
          defaultValue="personal"
          id="note-category"
          name="category"
        >
          <option value="projects">Projects</option>
          <option value="business">Business</option>
          <option value="personal">Personal</option>
        </select>
      </label>
      <label className="block text-sm font-medium" htmlFor="note-project">
        Project
        <select
          className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition duration-150 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
          defaultValue=""
          id="note-project"
          name="project_id"
        >
          <option value="">No project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium" htmlFor="note-tags">
        Tags
        <input
          className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition duration-150 placeholder:text-muted/70 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
          id="note-tags"
          maxLength={329}
          name="tags"
          placeholder="e.g. planning, urgent"
          type="text"
        />
        <span className="mt-1 text-xs font-normal text-muted">Comma-separated, up to 10.</span>
      </label>
      <button
        className="min-h-12 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-accent-hover active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60 dark:text-[#102019] sm:col-span-2 lg:col-span-1"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving..." : "Save note"}
      </button>
      {errorMessage && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 sm:col-span-2 lg:col-span-6" id="note-title-error" role="alert">
          {errorMessage}
        </p>
      )}
      {state.message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:col-span-2 lg:col-span-6" role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}