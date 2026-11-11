"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteNote, type NoteFormState } from "./actions/notes";

const initialState: NoteFormState = {};

export default function NoteListActions({ noteId }: { noteId: string }) {
  const [state, deleteAction, deleting] = useActionState(deleteNote, initialState);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Link
        className="inline-flex min-h-10 items-center rounded-md bg-[#174f40] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#103d31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f40]"
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
          className="inline-flex min-h-10 items-center rounded-md border border-[#b45a3c] px-4 text-sm font-medium text-[#8b3c2a] transition-colors hover:bg-[#fbf2ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45a3c] disabled:cursor-wait disabled:opacity-60"
          disabled={deleting}
          type="submit"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </form>
      {state.error && (
        <p className="w-full text-sm text-[#8b3c2a]" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
