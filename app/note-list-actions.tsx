"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteNote, type NoteFormState } from "./actions/notes";

const initialState: NoteFormState = {};

export default function NoteListActions({ noteId }: { noteId: string }) {
  const [state, deleteAction, deleting] = useActionState(deleteNote, initialState);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-border pt-3">
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-[#102019]"
        href={`/notes/${noteId}`}
      >
        Edit
      </Link>
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm("Delete this note? This cannot be undone.")) {
            event.preventDefault();
          }
        }}
      >
        <input name="id" type="hidden" value={noteId} />
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-medium text-red-700 transition duration-150 hover:bg-red-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-wait disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
          disabled={deleting}
          type="submit"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </form>
      {state.error && (
        <p className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
