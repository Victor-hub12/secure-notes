import Link from "next/link";

export default function NoteNotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-9">
        <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-background text-accent">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5.75h8M8 9.75h8m-8 4h5m-8 5.5h14a1.75 1.75 0 0 0 1.75-1.75V6.5A1.75 1.75 0 0 0 19 4.75H5A1.75 1.75 0 0 0 3.25 6.5v11A1.75 1.75 0 0 0 5 19.25Z" />
          </svg>
        </span>
        <Link className="mt-4 inline-flex rounded-md text-sm font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" href="/">
          Secure Notes
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Private notebook</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Note not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          This note may have been deleted, or it may not belong to your account.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-accent-hover active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-[#102019]"
          href="/"
        >
          Back to My notes
        </Link>
      </section>
    </main>
  );
}
