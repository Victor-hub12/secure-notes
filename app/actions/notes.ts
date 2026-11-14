"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export type NoteFormState = {
  error?: string;
  message?: string;
};

const noteCategories = ["projects", "business", "personal"] as const;

function needsWorkspaceSchema(error: { code?: string }) {
  return ["PGRST204", "PGRST205", "42P01", "42703"].includes(error.code ?? "");
}

function readTags(value: FormDataEntryValue | null) {
  const tags = String(value ?? "")
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

  if (tags.length > 10) {
    return { tags: [], error: "Use no more than 10 tags per note." };
  }
  if (tags.some((tag) => tag.length > 32)) {
    return { tags: [], error: "Each tag must be 32 characters or fewer." };
  }

  const uniqueTags = tags.filter(
    (tag, index) => tags.findIndex((other) => other.toLocaleLowerCase() === tag.toLocaleLowerCase()) === index,
  );
  return { tags: uniqueTags, error: null };
}

export async function createNote(
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const category = String(formData.get("category") ?? "personal");
  const rawProjectId = String(formData.get("project_id") ?? "").trim();
  const projectId = rawProjectId && /^\d+$/.test(rawProjectId) ? rawProjectId : null;
  const { tags, error: tagsError } = readTags(formData.get("tags"));

  if (!title) {
    return { error: "Enter a title for your note." };
  }
  if (!noteCategories.includes(category as (typeof noteCategories)[number])) {
    return { error: "Choose a valid note category." };
  }
  if (rawProjectId && !projectId) {
    return { error: "Choose a valid project." };
  }
  if (tagsError) {
    return { error: tagsError };
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

  if (projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      return { error: "The selected project could not be verified." };
    }
    if (!project) {
      return { error: "Choose one of your projects." };
    }
  }

  const { error } = await supabase.from("notes").insert({
    title,
    body,
    category,
    project_id: projectId,
    tags,
  });

  if (error) {
    if (needsWorkspaceSchema(error)) {
      const { error: withoutTagsError } = await supabase.from("notes").insert({
        title,
        body,
        category,
        project_id: projectId,
      });
      if (!withoutTagsError) {
        revalidatePath("/");
        return {
          message: "Note saved. Run db/schema.sql in Supabase to save custom tags.",
        };
      }
      if (!needsWorkspaceSchema(withoutTagsError)) {
        return { error: "Your note could not be saved. Please try again." };
      }

      const { error: legacyError } = await supabase.from("notes").insert({ title, body });
      if (!legacyError) {
        revalidatePath("/");
        return {
          message: "Note saved. Run db/schema.sql in Supabase to save tags, categories, and project links.",
        };
      }
    }
    return { error: "Your note could not be saved. Please try again." };
  }

  revalidatePath("/");
  return { message: "Note saved to your notebook." };
}

export async function updateNote(
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const noteId = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const category = String(formData.get("category") ?? "personal");
  const rawProjectId = String(formData.get("project_id") ?? "").trim();
  const projectId = rawProjectId && /^\d+$/.test(rawProjectId) ? rawProjectId : null;
  const { tags, error: tagsError } = readTags(formData.get("tags"));

  if (!/^\d+$/.test(noteId)) {
    return { error: "Note not found." };
  }

  if (!title) {
    return { error: "Enter a title for your note." };
  }
  if (!noteCategories.includes(category as (typeof noteCategories)[number])) {
    return { error: "Choose a valid note category." };
  }
  if (rawProjectId && !projectId) {
    return { error: "Choose a valid project." };
  }
  if (tagsError) {
    return { error: tagsError };
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

  if (projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      return { error: "The selected project could not be verified." };
    }
    if (!project) {
      return { error: "Choose one of your projects." };
    }
  }

  const { data, error } = await supabase
    .from("notes")
    .update({
      title,
      body,
      category,
      project_id: projectId,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .select("id")
    .maybeSingle();

  if (error && needsWorkspaceSchema(error)) {
    const { data: withoutTagsData, error: withoutTagsError } = await supabase
      .from("notes")
      .update({
        title,
        body,
        category,
        project_id: projectId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .select("id")
      .maybeSingle();

    if (!withoutTagsError && !withoutTagsData) {
      return { error: "Note not found." };
    }
    if (withoutTagsError && !needsWorkspaceSchema(withoutTagsError)) {
      return { error: "Your note could not be saved. Please try again." };
    }
    if (withoutTagsError) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("notes")
        .update({ title, body, updated_at: new Date().toISOString() })
        .eq("id", noteId)
        .select("id")
        .maybeSingle();

      if (legacyError) {
        return { error: "Your note could not be saved. Please try again." };
      }
      if (!legacyData) {
        return { error: "Note not found." };
      }
    }
  } else if (error) {
    return { error: "Your note could not be saved. Please try again." };
  } else if (!data) {
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