"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export type WorkspaceActionState = {
  error?: string;
  message?: string;
};

const categories = ["projects", "business", "personal"] as const;
type ProjectCategory = (typeof categories)[number];

function needsWorkspaceSchema(error: { code?: string }) {
  return ["PGRST204", "PGRST205", "42P01", "42703"].includes(error.code ?? "");
}

function actionError(error: { code?: string }, fallback: string) {
  return needsWorkspaceSchema(error)
    ? "Workspace tables are not set up yet. Run db/schema.sql in the Supabase SQL Editor, then refresh."
    : fallback;
}

function readId(value: FormDataEntryValue | null) {
  const id = String(value ?? "");
  return /^[1-9]\d*$/.test(id) ? id : null;
}

function readProjectId(value: FormDataEntryValue | null) {
  const rawId = String(value ?? "").trim();
  if (!rawId) {
    return { id: null, error: null };
  }

  const id = readId(rawId);
  return id
    ? { id, error: null }
    : { id: null, error: "Choose a valid project." };
}

function readCategory(value: FormDataEntryValue | null): ProjectCategory | null {
  const category = String(value ?? "");
  return categories.includes(category as ProjectCategory)
    ? category as ProjectCategory
    : null;
}

function readTags(value: FormDataEntryValue | null) {
  const tags = String(value ?? "")
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

  if (tags.length > 10) {
    return { tags: [], error: "Use no more than 10 tags per item." };
  }
  if (tags.some((tag) => tag.length > 32)) {
    return { tags: [], error: "Each tag must be 32 characters or fewer." };
  }

  const uniqueTags = tags.filter(
    (tag, index) => tags.findIndex((other) => other.toLocaleLowerCase() === tag.toLocaleLowerCase()) === index,
  );
  return { tags: uniqueTags, error: null };
}

function readDate(value: FormDataEntryValue | null) {
  const date = String(value ?? "").trim();
  if (!date) {
    return { date: null, error: null };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { date: null, error: "Choose a valid due date." };
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return { date: null, error: "Choose a valid due date." };
  }

  return { date, error: null };
}

async function getAuthenticatedClient() {
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

  return supabase;
}

async function validateProject(supabase: Awaited<ReturnType<typeof getAuthenticatedClient>>, projectId: string | null) {
  if (!projectId) {
    return null;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    return needsWorkspaceSchema(error)
      ? "Workspace tables are not set up yet. Run db/schema.sql in the Supabase SQL Editor, then refresh."
      : "The selected project could not be verified.";
  }

  return data ? null : "Choose one of your projects.";
}

export async function saveProject(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const rawId = String(formData.get("id") ?? "").trim();
  const projectId = rawId ? readId(rawId) : null;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = readCategory(formData.get("category"));
  const { tags, error: tagsError } = readTags(formData.get("tags"));

  if (rawId && !projectId) {
    return { error: "Project not found." };
  }
  if (!name) {
    return { error: "Enter a project name." };
  }
  if (!category) {
    return { error: "Choose a project category." };
  }
  if (tagsError) {
    return { error: tagsError };
  }

  const supabase = await getAuthenticatedClient();
  const values = { name, description, category, tags, updated_at: new Date().toISOString() };

  if (projectId) {
    const { data, error } = await supabase
      .from("projects")
      .update(values)
      .eq("id", projectId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: actionError(error, "Your project could not be saved. Please try again.") };
    }
    if (!data) {
      return { error: "Project not found." };
    }
  } else {
    const { error } = await supabase.from("projects").insert(values);
    if (error) {
      return { error: actionError(error, "Your project could not be created. Please try again.") };
    }
  }

  revalidatePath("/");
  return { message: projectId ? "Project updated." : "Project created." };
}

export async function deleteProject(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const projectId = readId(formData.get("id"));
  if (!projectId) {
    return { error: "Project not found." };
  }

  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: actionError(error, "The project could not be deleted. Please try again.") };
  }
  if (!data) {
    return { error: "Project not found." };
  }

  revalidatePath("/");
  return { message: "Project deleted. Its tasks and files are still available without a project." };
}

export async function saveTask(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const rawId = String(formData.get("id") ?? "").trim();
  const taskId = rawId ? readId(rawId) : null;
  const title = String(formData.get("title") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const { tags, error: tagsError } = readTags(formData.get("tags"));
  const { id: projectId, error: projectIdError } = readProjectId(formData.get("project_id"));
  const { date: dueDate, error: dueDateError } = readDate(formData.get("due_date"));

  if (rawId && !taskId) {
    return { error: "Task not found." };
  }
  if (!title) {
    return { error: "Enter a task title." };
  }
  if (projectIdError || dueDateError) {
    return { error: projectIdError ?? dueDateError ?? "Check the task details." };
  }
  if (tagsError) {
    return { error: tagsError };
  }

  const supabase = await getAuthenticatedClient();
  const projectError = await validateProject(supabase, projectId);
  if (projectError) {
    return { error: projectError };
  }

  const values = {
    title,
    details,
    tags,
    project_id: projectId,
    due_date: dueDate,
    updated_at: new Date().toISOString(),
  };

  if (taskId) {
    const { data, error } = await supabase
      .from("tasks")
      .update(values)
      .eq("id", taskId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: actionError(error, "The task could not be saved. Please try again.") };
    }
    if (!data) {
      return { error: "Task not found." };
    }
  } else {
    const { error } = await supabase.from("tasks").insert(values);
    if (error) {
      return { error: actionError(error, "The task could not be created. Please try again.") };
    }
  }

  revalidatePath("/");
  return { message: taskId ? "Task updated." : "Task created." };
}

export async function setTaskCompletion(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const taskId = readId(formData.get("id"));
  const completedValue = String(formData.get("is_complete") ?? "");

  if (!taskId) {
    return { error: "Task not found." };
  }
  if (completedValue !== "true" && completedValue !== "false") {
    return { error: "Choose a valid task status." };
  }

  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ is_complete: completedValue === "true", updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: actionError(error, "The task status could not be changed. Please try again.") };
  }
  if (!data) {
    return { error: "Task not found." };
  }

  revalidatePath("/");
  return { message: "Task status updated." };
}

export async function deleteTask(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const taskId = readId(formData.get("id"));
  if (!taskId) {
    return { error: "Task not found." };
  }

  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: actionError(error, "The task could not be deleted. Please try again.") };
  }
  if (!data) {
    return { error: "Task not found." };
  }

  revalidatePath("/");
  return { message: "Task deleted." };
}

export async function saveDocument(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const rawId = String(formData.get("id") ?? "").trim();
  const documentId = rawId ? readId(rawId) : null;
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const { tags, error: tagsError } = readTags(formData.get("tags"));
  const { id: projectId, error: projectIdError } = readProjectId(formData.get("project_id"));

  if (rawId && !documentId) {
    return { error: "Document not found." };
  }
  if (!title) {
    return { error: "Enter a document title." };
  }
  if (!content) {
    return { error: "Add some content to your document." };
  }
  if (projectIdError) {
    return { error: projectIdError };
  }
  if (tagsError) {
    return { error: tagsError };
  }

  const supabase = await getAuthenticatedClient();
  const projectError = await validateProject(supabase, projectId);
  if (projectError) {
    return { error: projectError };
  }

  const values = {
    title,
    content,
    tags,
    project_id: projectId,
    updated_at: new Date().toISOString(),
  };

  if (documentId) {
    const { data, error } = await supabase
      .from("documents")
      .update(values)
      .eq("id", documentId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: actionError(error, "The document could not be saved. Please try again.") };
    }
    if (!data) {
      return { error: "Document not found." };
    }
  } else {
    const { error } = await supabase.from("documents").insert(values);
    if (error) {
      return { error: actionError(error, "The document could not be created. Please try again.") };
    }
  }

  revalidatePath("/");
  return { message: documentId ? "Document updated." : "Document created." };
}

export async function deleteDocument(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const documentId = readId(formData.get("id"));
  if (!documentId) {
    return { error: "Document not found." };
  }

  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: actionError(error, "The document could not be deleted. Please try again.") };
  }
  if (!data) {
    return { error: "Document not found." };
  }

  revalidatePath("/");
  return { message: "Document deleted." };
}
