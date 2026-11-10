"use client";

import { useActionState } from "react";
import { createNote, type NoteFormState } from "./actions/notes";

const initialState: NoteFormState = {};

export default function NewNoteForm() {
  const [state, formAction, pending] = useActionState(createNote, initialState);

  return (
    <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end">
      <label className="block text-sm font-medium" htmlFor="note-title">
        Title
        <input
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "note-title-error" : undefined}
          autoComplete="off"
          className="mt-2 h-11 w-full rounded-md border border-[#cbd5cd] bg-white px-3 text-base outline-none transition focus:border-[#174f40] focus:ring-2 focus:ring-[#174f40]/15"
          id="note-title"
          name="title"
          type="text"
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="note-body">
        Note
        <textarea
          className="mt-2 min-h-11 w-full resize-y rounded-md border border-[#cbd5cd] bg-white px-3 py-2 text-base outline-none transition focus:border-[#174f40] focus:ring-2 focus:ring-[#174f40]/15"
          id="note-body"
          name="body"
          rows={1}
        />
      </label>
      <button
        className="h-11 rounded-md bg-[#174f40] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#103d31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f40] disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving..." : "Save note"}
      </button>
      {state.error && (
        <p className="text-sm text-[#8b3c2a] sm:col-span-3" id="note-title-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}