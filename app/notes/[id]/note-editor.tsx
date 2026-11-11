"use client";

import { useActionState, useState } from "react";
import { deleteNote, updateNote, type NoteFormState } from "../../actions/notes";

const initialState: NoteFormState = {};

export default function NoteEditor({
  noteId,
  initialTitle,
  initialBody,
}: {
  noteId: string;
  initialTitle: string;
  initialBody: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [saveState, saveAction, saving] = useActionState(updateNote, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteNote, initialState);

  return (
    <div className="border-t border-[#d6ddd4] pt-6">
      <form action={saveAction} className="space-y-5">
        <input name="id" type="hidden" value={noteId} />
        <label className="block text-sm font-medium" htmlFor="edit-title">
          Title
          <input
            aria-invalid={Boolean(saveState.error)}
            aria-describedby={saveState.error ? "edit-title-error" : undefined}
            autoComplete="off"
            className="mt-2 h-12 w-full rounded-md border border-[#cbd5cd] bg-white px-3 text-base outline-none transition focus:border-[#174f40] focus:ring-2 focus:ring-[#174f40]/15"
            id="edit-title"
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="block text-sm font-medium" htmlFor="edit-body">
          Note
          <textarea
            className="mt-2 min-h-56 w-full resize-y rounded-md border border-[#cbd5cd] bg-white px-3 py-2 text-base leading-6 outline-none transition focus:border-[#174f40] focus:ring-2 focus:ring-[#174f40]/15"
            id="edit-body"
            name="body"
            onChange={(event) => setBody(event.target.value)}
            value={body}
          />
        </label>
        {saveState.error && (
          <p className="text-sm text-[#8b3c2a]" id="edit-title-error" role="alert">
            {saveState.error}
          </p>
        )}
        <button
          className="h-11 rounded-md bg-[#174f40] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#103d31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f40] disabled:cursor-wait disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <form
        action={deleteAction}
        className="mt-10 border-t border-[#d6ddd4] pt-6"
        onSubmit={(event) => {
          if (!window.confirm("Delete this note? This cannot be undone.")) {
            event.preventDefault();
          }
        }}
      >
        <input name="id" type="hidden" value={noteId} />
        {deleteState.error && <p className="mb-4 text-sm text-[#8b3c2a]" role="alert">{deleteState.error}</p>}
        <button
          className="h-10 rounded-md border border-[#b45a3c] px-4 text-sm font-medium text-[#8b3c2a] transition-colors hover:bg-[#fbf2ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45a3c] disabled:cursor-wait disabled:opacity-60"
          disabled={deleting}
          type="submit"
        >
          {deleting ? "Deleting..." : "Delete note"}
        </button>
      </form>
    </div>
  );
}