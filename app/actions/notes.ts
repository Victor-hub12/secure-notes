"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export type NoteFormState = {
  error?: string;
};

export async function createNote(
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");

  if (!title) {
    return { error: "Enter a title for your note." };
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

  const { error } = await supabase.from("notes").insert({ title, body });

  if (error) {
    return { error: "Your note could not be saved. Please try again." };
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateNote(
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const noteId = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");

  if (!/^\d+$/.test(noteId)) {
    return { error: "Note not found." };
  }

  if (!title) {
    return { error: "Enter a title for your note." };
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

  const { data, error } = await supabase
    .from("notes")
    .update({ title, body, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Your note could not be saved. Please try again." };
  }

  if (!data) {
    return { error: "Note not found." };
  }

  revalidatePath("/");
  revalidatePath(`/notes/${noteId}`);
  redirect(`/notes/${noteId}`);
}

export async function deleteNote(
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const noteId = String(formData.get("id") ?? "");

  if (!/^\d+$/.test(noteId)) {
    return { error: "Note not found." };
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

  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Your note could not be deleted. Please try again." };
  }

  if (!data) {
    return { error: "Note not found." };
  }

  revalidatePath("/");
  redirect("/");
}