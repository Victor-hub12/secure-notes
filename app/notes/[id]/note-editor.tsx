"use client";

import { useActionState, useState } from "react";
import { deleteNote, updateNote, type NoteFormState } from "../../actions/notes";

const initialState: NoteFormState = {};

export default function NoteEditor({
  noteId,
  initialTitle,
  initialBody,
  initialCategory,
  initialProjectId,
  initialTags,
  projects,
  workspaceSchemaMissing,
}: {
  noteId: string;
  initialTitle: string;
  initialBody: string;
  initialCategory: string;
  initialProjectId: string;
  initialTags: string[];
  projects: { id: string; name: string }[];
  workspaceSchemaMissing: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [saveState, saveAction, saving] = useActionState(updateNote, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteNote, initialState);
  const saveError = saveState.error === "Enter a title for your note."
    ? "Enter a title for your note"
    : saveState.error;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <form action={saveAction} className="space-y-5 p-5 sm:p-7">
        <input name="id" type="hidden" value={noteId} />
        {workspaceSchemaMissing && (
          <p className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" role="status">
            Your note is available from the existing database. Run db/schema.sql in Supabase to enable category and project fields.
          </p>
        )}
        <label className="block text-sm font-medium" htmlFor="edit-title">
          Title
          <input
            aria-invalid={Boolean(saveError)}
            aria-describedby={saveError ? "edit-title-error" : undefined}
            autoComplete="off"
            className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition duration-150 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
            id="edit-title"
            name="title"
            required
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="block text-sm font-medium" htmlFor="edit-body">
          Note
          <textarea
            className="mt-2 min-h-56 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-base leading-7 text-foreground outline-none transition duration-150 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
            id="edit-body"
            name="body"
            placeholder="Write your lesson note..."
            onChange={(event) => setBody(event.target.value)}
            value={body}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium" htmlFor="edit-category">
            Category
            <select
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition duration-150 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
              defaultValue={initialCategory}
              disabled={workspaceSchemaMissing}
              id="edit-category"
              name="category"
            >
              <option value="projects">Projects</option>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>
          </label>
          <label className="block text-sm font-medium" htmlFor="edit-project">
            Project
            <select
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition duration-150 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
              defaultValue={initialProjectId}
              disabled={workspaceSchemaMissing}
              id="edit-project"
              name="project_id"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium" htmlFor="edit-note-tags">
          Tags
          <input
            className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition duration-150 placeholder:text-muted/70 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
            defaultValue={initialTags.join(", ")}
            disabled={workspaceSchemaMissing}
            id="edit-note-tags"
            maxLength={329}
            name="tags"
            placeholder="e.g. planning, urgent"
            type="text"
          />
          <span className="mt-1 block text-xs font-normal text-muted">Comma-separated, up to 10 tags.</span>
        </label>
        {saveError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" id="edit-title-error" role="alert">
            {saveError}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">Changes are saved to your private notebook.</p>
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-accent-hover active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60 dark:text-[#102019]"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <form
        action={deleteAction}
        className="border-t border-red-200/80 bg-red-50/60 p-5 dark:border-red-950 dark:bg-red-950/15 sm:p-7"
        onSubmit={(event) => {
          if (!window.confirm("Delete this note? This cannot be undone.")) {
            event.preventDefault();
          }
        }}
      >
        <input name="id" type="hidden" value={noteId} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-red-900 dark:text-red-200">Delete this note</h2>
            <p className="mt-1 text-sm leading-6 text-red-800/80 dark:text-red-200/80">
              This permanently removes the note from your notebook.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-surface px-4 text-sm font-semibold text-red-800 transition duration-150 hover:bg-red-100 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-wait disabled:opacity-60 dark:border-red-900 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-950/50"
            disabled={deleting}
            type="submit"
          >
            {deleting ? "Deleting..." : "Delete note"}
          </button>
        </div>
        {deleteState.error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-surface px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
            {deleteState.error}
          </p>
        )}
      </form>
    </div>
  );
}