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