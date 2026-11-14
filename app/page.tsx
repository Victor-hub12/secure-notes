import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import WorkspaceDashboard from "./workspace-dashboard";
import { createClient } from "../lib/supabase/server";

type Category = "projects" | "business" | "personal";

type LoadIssue = "schema" | "permissions" | "connection" | null;
type DatabaseError = { code?: string } | null;

function classifyLoadIssue(error: DatabaseError): LoadIssue {
  if (!error) return null;
  if (["PGRST204", "PGRST205", "42P01", "42703"].includes(error.code ?? "")) return "schema";
  if (["42501", "PGRST301", "401", "403"].includes(error.code ?? "")) return "permissions";
  return "connection";
}

function readCategory(value: string): Category {
  return value === "projects" || value === "business" || value === "personal"
    ? value
    : "personal";
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <AuthenticatedHome />
    </Suspense>
  );
}

async function AuthenticatedHome() {
  await connection();

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

  const [notesResult, projectsResult, tasksResult, documentsResult] = await Promise.all([
    supabase
      .from("notes")
      .select("id, title, body, category, project_id, tags, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, description, category, tags, created_at")
      .order("name", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, details, tags, project_id, due_date, is_complete, created_at")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id, title, content, tags, project_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const notesWithoutTagsResult = classifyLoadIssue(notesResult.error) === "schema"
    ? await supabase
      .from("notes")
      .select("id, title, body, category, project_id, created_at")
      .order("created_at", { ascending: false })
    : null;
  const legacyNotesResult = notesWithoutTagsResult && classifyLoadIssue(notesWithoutTagsResult.error) === "schema"
    ? await supabase
      .from("notes")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false })
    : null;
  const projectsWithoutTagsResult = classifyLoadIssue(projectsResult.error) === "schema"
    ? await supabase.from("projects").select("id, name, description, category, created_at").order("name", { ascending: true })
    : null;
  const tasksWithoutTagsResult = classifyLoadIssue(tasksResult.error) === "schema"
    ? await supabase
      .from("tasks")
      .select("id, title, details, project_id, due_date, is_complete, created_at")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
    : null;
  const documentsWithoutTagsResult = classifyLoadIssue(documentsResult.error) === "schema"
    ? await supabase.from("documents").select("id, title, content, project_id, created_at").order("created_at", { ascending: false })
    : null;

  const noteRows = notesResult.data
    ? notesResult.data.map((note) => ({
      id: String(note.id),
      title: note.title,
      body: note.body,
      category: readCategory(note.category),
      project_id: note.project_id === null ? null : String(note.project_id),
      tags: note.tags ?? [],
      created_at: note.created_at,
    }))
    : notesWithoutTagsResult?.data
      ? notesWithoutTagsResult.data.map((note) => ({
        id: String(note.id),
        title: note.title,
        body: note.body,
        category: readCategory(note.category),
        project_id: note.project_id === null ? null : String(note.project_id),
        tags: [],
        created_at: note.created_at,
      }))
      : (legacyNotesResult?.data ?? []).map((note) => ({
        id: String(note.id),
        title: note.title,
        body: note.body,
        category: "personal" as const,
        project_id: null,
        tags: [],
        created_at: note.created_at,
      }));

  const projectRows = projectsResult.data
    ? projectsResult.data.map((project) => ({
      id: String(project.id),
      name: project.name,
      description: project.description,
      category: readCategory(project.category),
      tags: project.tags ?? [],
      created_at: project.created_at,
    }))
    : (projectsWithoutTagsResult?.data ?? []).map((project) => ({
      id: String(project.id),
      name: project.name,
      description: project.description,
      category: readCategory(project.category),
      tags: [],
      created_at: project.created_at,
    }));

  const taskRows = tasksResult.data
    ? tasksResult.data.map((task) => ({
      id: String(task.id),
      title: task.title,
      details: task.details,
      tags: task.tags ?? [],
      project_id: task.project_id === null ? null : String(task.project_id),
      due_date: task.due_date,
      is_complete: task.is_complete,
      created_at: task.created_at,
    }))
    : (tasksWithoutTagsResult?.data ?? []).map((task) => ({
      id: String(task.id),
      title: task.title,
      details: task.details,
      tags: [],
      project_id: task.project_id === null ? null : String(task.project_id),
      due_date: task.due_date,
      is_complete: task.is_complete,
      created_at: task.created_at,
    }));

  const documentRows = documentsResult.data
    ? documentsResult.data.map((document) => ({
      id: String(document.id),
      title: document.title,
      content: document.content,
      tags: document.tags ?? [],
      project_id: document.project_id === null ? null : String(document.project_id),
      created_at: document.created_at,
    }))
    : (documentsWithoutTagsResult?.data ?? []).map((document) => ({
      id: String(document.id),
      title: document.title,
      content: document.content,
      tags: [],
      project_id: document.project_id === null ? null : String(document.project_id),
      created_at: document.created_at,
    }));

  const notesFinalError = legacyNotesResult
    ? legacyNotesResult.error
    : notesWithoutTagsResult
      ? notesWithoutTagsResult.error
      : notesResult.error;
  const projectsFinalError = projectsWithoutTagsResult ? projectsWithoutTagsResult.error : projectsResult.error;
  const tasksFinalError = tasksWithoutTagsResult ? tasksWithoutTagsResult.error : tasksResult.error;
  const documentsFinalError = documentsWithoutTagsResult ? documentsWithoutTagsResult.error : documentsResult.error;
  const issues = {
    notes: classifyLoadIssue(notesFinalError),
    projects: classifyLoadIssue(projectsFinalError),
    tasks: classifyLoadIssue(tasksFinalError),
    documents: classifyLoadIssue(documentsFinalError),
  };
  const schemaMissing = Object.values(issues).includes("schema") || Boolean(legacyNotesResult?.data);
  const notesNeedMigration = Boolean(
    legacyNotesResult && !legacyNotesResult.error,
  );
  const tagsNeedMigration = Boolean(
    (notesWithoutTagsResult && !notesWithoutTagsResult.error)
    || (projectsWithoutTagsResult && !projectsWithoutTagsResult.error)
    || (tasksWithoutTagsResult && !tasksWithoutTagsResult.error)
    || (documentsWithoutTagsResult && !documentsWithoutTagsResult.error),
  );

  return (
    <WorkspaceDashboard
      email={user.email ?? ""}
      workspaceSchemaMissing={schemaMissing}
      notesNeedMigration={notesNeedMigration}
      tagsNeedMigration={tagsNeedMigration}
      errors={issues}
      notes={noteRows}
      projects={projectRows}
      tasks={taskRows}
      documents={documentRows}
    />
  );
}
