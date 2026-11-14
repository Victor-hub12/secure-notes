"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { signOut } from "./actions/auth";
import NewNoteForm from "./new-note-form";
import NoteListActions from "./note-list-actions";
import {
  DocumentDeleteForm,
  DocumentForm,
  ProjectDeleteForm,
  ProjectForm,
  TaskDeleteForm,
  TaskForm,
  TaskStatusForm,
} from "./workspace-forms";

type Category = "projects" | "business" | "personal";
type View = "overview" | "tasks" | "documents" | "notes" | "projects" | "project" | "output" | "support" | "search" | "tag";
type TaskFilter = "all" | "open" | "completed" | "due";

type Project = {
  id: string;
  name: string;
  description: string;
  category: Category;
  tags: string[];
  created_at: string;
};

type Task = {
  id: string;
  title: string;
  details: string;
  project_id: string | null;
  due_date: string | null;
  is_complete: boolean;
  tags: string[];
  created_at: string;
};

type DocumentRecord = {
  id: string;
  title: string;
  content: string;
  project_id: string | null;
  tags: string[];
  created_at: string;
};

type Note = {
  id: string;
  title: string;
  body: string;
  category: Category;
  project_id: string | null;
  tags: string[];
  created_at: string;
};

type LoadIssue = "schema" | "permissions" | "connection" | null;
type WorkspaceErrors = {
  notes: LoadIssue;
  projects: LoadIssue;
  tasks: LoadIssue;
  documents: LoadIssue;
};

const categoryLabels: Record<Category, string> = {
  projects: "Projects",
  business: "Business",
  personal: "Personal",
};

const categoryColors: Record<Category, string> = {
  projects: "violet",
  business: "orange",
  personal: "blue",
};

const dateLabel = (value: string) => new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date(value));

function dueLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function searchMatch(query: string, ...values: (string | null | undefined)[]) {
  const search = query.trim().toLocaleLowerCase();
  return !search || values.some((value) => value?.toLocaleLowerCase().includes(search));
}

function downloadFile(filename: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function NavIcon({ name }: { name: View | "add" }) {
  const paths: Record<View | "add", string> = {
    overview: "M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-7h6v7",
    tasks: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    documents: "M7 3.75h7l5 5V20a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5.75a2 2 0 0 1 2-2ZM14 4v5h5M8.5 13h7m-7 3.5h7",
    notes: "M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Zm2 5h6m-6 4h6m-6 4h3",
    projects: "M3.5 7.5h7l2 2h8v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Zm0 0v-2a2 2 0 0 1 2-2h3l2 2",
    project: "M3.5 7.5h7l2 2h8v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z",
    output: "M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3",
    support: "M12 18h.01M9.1 9a3 3 0 1 1 5.2 2c-1.2 1.1-2.3 1.7-2.3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    search: "M10.8 4.5a6.3 6.3 0 1 0 0 12.6 6.3 6.3 0 0 0 0-12.6ZM15.5 15.5l4 4",
    tag: "M20.5 13.5 13 21l-10-10V3h8l9.5 10.5ZM7.5 7.5h.01",
    add: "M12 5v14m7-7H5",
  };

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d={paths[name]} />
    </svg>
  );
}

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="workspace-section-heading">
      <div>
        <p className="workspace-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function DataError({ message }: { message: string }) {
  return <p className="workspace-error" role="alert">{message}</p>;
}

function loadErrorMessage(resource: string, issue: LoadIssue) {
  if (issue === "schema") {
    return `${resource} storage is missing. Run db/schema.sql in the Supabase SQL Editor, then refresh.`;
  }
  if (issue === "permissions") {
    return `Supabase denied access to ${resource.toLocaleLowerCase()}. Check the table grants and row-level security policies.`;
  }
  return `Supabase could not load ${resource.toLocaleLowerCase()}. Check the configured URL, network connection, and try again.`;
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="workspace-empty">
      <span aria-hidden="true">✦</span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}

function PageHeading({ kicker, title, detail, action }: { kicker: string; title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="workspace-page-heading">
      <div>
        <p className="workspace-eyebrow">{kicker}</p>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
      {action}
    </div>
  );
}

export default function WorkspaceDashboard({
  email,
  notes,
  projects,
  tasks,
  documents,
  errors,
  workspaceSchemaMissing,
  notesNeedMigration,
  tagsNeedMigration,
}: {
  email: string;
  notes: Note[];
  projects: Project[];
  tasks: Task[];
  documents: DocumentRecord[];
  errors: WorkspaceErrors;
  workspaceSchemaMissing: boolean;
  notesNeedMigration: boolean;
  tagsNeedMigration: boolean;
}) {
  const [view, setView] = useState<View>("overview");
  const [activeCategory, setActiveCategory] = useState<Category>("projects");
  const [noteCategory, setNoteCategory] = useState<Category | "all">("all");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("open");
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target;
      const isTyping = target instanceof HTMLElement
        && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        setView("overview");
        searchRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const incompleteTasks = tasks.filter((task) => !task.is_complete);
  const dueTasks = incompleteTasks.filter((task) => task.due_date && task.due_date <= today);
  const projectName = useCallback(
    (id: string | null) => projects.find((project) => project.id === id)?.name ?? "No project",
    [projects],
  );
  const initials = email.slice(0, 1).toLocaleUpperCase() || "U";
  const tagCounts = new Map<string, number>();
  for (const tag of [
    ...projects.flatMap((project) => project.tags),
    ...tasks.flatMap((task) => task.tags),
    ...documents.flatMap((document) => document.tags),
    ...notes.flatMap((note) => note.tags),
  ]) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const availableTags = Array.from(tagCounts.keys()).sort((left, right) => left.localeCompare(right));

  const searchedProjects = useMemo(
    () => projects.filter((project) => searchMatch(query, project.name, project.description, project.tags.join(" "))),
    [projects, query],
  );
  const searchedTasks = useMemo(
    () => tasks.filter((task) => searchMatch(query, task.title, task.details, projectName(task.project_id), task.tags.join(" "))),
    [tasks, query, projectName],
  );
  const searchedDocuments = useMemo(
    () => documents.filter((document) => searchMatch(query, document.title, document.content, projectName(document.project_id), document.tags.join(" "))),
    [documents, query, projectName],
  );
  const searchedNotes = useMemo(
    () => notes.filter((note) => searchMatch(query, note.title, note.body, categoryLabels[note.category], projectName(note.project_id), note.tags.join(" "))),
    [notes, query, projectName],
  );

  function navigate(nextView: View) {
    setView(nextView);
    setQuery("");
  }

  function showCategory(category: Category) {
    setActiveCategory(category);
    setActiveProjectId(null);
    setProjectFormOpen(false);
    navigate("projects");
  }

  function showProject(projectId: string) {
    setActiveProjectId(projectId);
    navigate("project");
  }

  function showTag(tag: string) {
    setActiveTag(tag);
    navigate("tag");
  }

  function exportJson() {
    downloadFile(
      "secure-notes-workspace.json",
      "application/json",
      JSON.stringify({ exportedAt: new Date().toISOString(), projects, tasks, documents, notes }, null, 2),
    );
  }

  function exportCsv() {
    const header = ["type", "title", "details", "project", "category", "tags", "status", "due_date", "created_at"];
    const rows = [
      ...projects.map((project) => ["project", project.name, project.description, project.name, project.category, project.tags.join("; "), "", "", project.created_at]),
      ...tasks.map((task) => ["task", task.title, task.details, projectName(task.project_id), "", task.tags.join("; "), task.is_complete ? "completed" : "open", task.due_date ?? "", task.created_at]),
      ...documents.map((document) => ["document", document.title, document.content, projectName(document.project_id), "", document.tags.join("; "), "", "", document.created_at]),
      ...notes.map((note) => ["note", note.title, note.body, projectName(note.project_id), note.category, note.tags.join("; "), "", "", note.created_at]),
    ];
    downloadFile(
      "secure-notes-workspace.csv",
      "text/csv;charset=utf-8",
      [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n"),
    );
  }

  const categoryCounts = {
    projects: projects.filter((project) => project.category === "projects").length,
    business: projects.filter((project) => project.category === "business").length,
    personal: projects.filter((project) => project.category === "personal").length,
  };

  const dueButton = (
    <button
      aria-label={`View ${dueTasks.length} tasks due`}
      className={`workspace-notification${dueTasks.length ? " has-alert" : ""}`}
      onClick={() => { setTaskFilter("due"); navigate("tasks"); }}
      title={dueTasks.length ? `${dueTasks.length} tasks due` : "No tasks due"}
      type="button"
    >
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
      </svg>
      {dueTasks.length > 0 && <span>{dueTasks.length}</span>}
    </button>
  );

  return (
    <main className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link aria-label="Secure Notes overview" className="workspace-brand" href="/">
          <span className="workspace-brand-mark">S</span>
          <span className="workspace-brand-word">Secure<span>Notes</span></span>
        </Link>

        <nav aria-label="Main navigation" className="workspace-nav">
          <p className="workspace-nav-label">Workspace</p>
          {([
            ["overview", "Overview"],
            ["tasks", "Tasks"],
            ["documents", "Documents"],
            ["notes", "Notes"],
            ["output", "Output"],
            ["support", "Support"],
          ] as [View, string][]).map(([item, label]) => (
            <button
              aria-current={view === item ? "page" : undefined}
              className={`workspace-nav-link${view === item ? " active" : ""}`}
              key={item}
              onClick={() => navigate(item)}
              type="button"
            >
              <NavIcon name={item} />
              <span>{label}</span>
              {item === "tasks" && <span className="workspace-nav-count">{incompleteTasks.length}</span>}
            </button>
          ))}
        </nav>

        <div className="workspace-sidebar-rule" />
        <div className="workspace-category-head">
          <p className="workspace-nav-label">Projects</p>
          <button aria-label="Add project" className="workspace-sidebar-add" onClick={() => { setActiveCategory("projects"); setProjectFormOpen(true); navigate("projects"); }} type="button">+</button>
        </div>
        <nav aria-label="Project categories" className="workspace-category-nav">
          {(["projects", "business", "personal"] as Category[]).map((category) => (
            <button
              className={`workspace-category-link${view === "projects" && activeCategory === category ? " selected" : ""}`}
              key={category}
              onClick={() => showCategory(category)}
              type="button"
            >
              <span className={`workspace-category-dot ${categoryColors[category]}`} />
              <span>{categoryLabels[category]}</span>
              <span className="workspace-category-count">{categoryCounts[category]}</span>
            </button>
          ))}
          {projects.length > 0 && (
            <div className="workspace-project-shortcuts">
              {projects.slice(0, 4).map((project) => (
                <button className="workspace-project-shortcut" key={project.id} onClick={() => showProject(project.id)} type="button">
                  <span>{project.name}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {availableTags.length > 0 && (
          <div className="workspace-sidebar-tags">
            <p className="workspace-nav-label">Tags</p>
            <nav aria-label="Tags">
              {availableTags.map((tag) => (
                <button
                  aria-current={view === "tag" && activeTag === tag ? "page" : undefined}
                  className={`workspace-sidebar-tag${view === "tag" && activeTag === tag ? " selected" : ""}`}
                  key={tag}
                  onClick={() => showTag(tag)}
                  type="button"
                >
                  <NavIcon name="tag" />
                  <span>{tag}</span>
                  <span>{tagCounts.get(tag)}</span>
                </button>
              ))}
            </nav>
          </div>
        )}

        <button className="workspace-new-project" onClick={() => { setActiveCategory("projects"); setProjectFormOpen(true); navigate("projects"); }} type="button">
          <NavIcon name="add" />
          Add new project
        </button>

        <div className="workspace-sidebar-bottom">
          <div className="workspace-private-note">
            <span aria-hidden="true">✦</span>
            <div><strong>Your space, your way</strong><small>Private and organized</small></div>
          </div>
          <div className="workspace-account">
            <span aria-hidden="true" className="workspace-avatar">{initials}</span>
            <span className="workspace-account-copy"><strong>{email || "Your account"}</strong><small>Personal workspace</small></span>
            <form action={signOut}>
              <button aria-label="Log out" className="workspace-icon-button" title="Log out" type="submit">↗</button>
            </form>
          </div>
        </div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-topbar">
          <label className="workspace-search">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.3" />
              <path d="m15.5 15.5 4 4" />
            </svg>
            <input
              aria-label="Search your workspace"
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                if (value.trim()) setView("search");
                else if (view === "search") setView("overview");
              }}
              placeholder="Search"
              ref={searchRef}
              type="search"
              value={query}
            />
            <kbd>/</kbd>
          </label>
          <div className="workspace-top-actions">
            <button className="workspace-add-note" onClick={() => navigate("notes")} type="button">
              <NavIcon name="add" /> Add new note
            </button>
            <span className="workspace-greeting">Hello, {email.split("@")[0] || "there"}!</span>
            {dueButton}
            <span aria-hidden="true" className="workspace-avatar">{initials}</span>
            <form action={signOut} className="workspace-mobile-signout">
              <button aria-label="Log out" className="workspace-icon-button" title="Log out" type="submit">↗</button>
            </form>
          </div>
        </header>

        <div className="workspace-content">
          {(workspaceSchemaMissing || tagsNeedMigration) && (
            <div className="workspace-setup-notice" role="status">
              <strong>Workspace database update needed</strong>
              <p>
                {notesNeedMigration
                  ? "Your previously saved notes are still available. Run db/schema.sql in the Supabase SQL Editor to enable project links, tasks, documents, and note categories."
                  : workspaceSchemaMissing
                    ? "Run db/schema.sql in the Supabase SQL Editor to create the project, task, and document tables, then refresh this page."
                    : "Run db/schema.sql in the Supabase SQL Editor to enable custom tags, then refresh this page."}
              </p>
            </div>
          )}
          {!workspaceSchemaMissing && Object.values(errors).some(Boolean) && (
            <div className="workspace-load-notice" role="alert">
              Some workspace data could not be loaded. Check your Supabase connection, table permissions, and row-level security policies, then refresh.
            </div>
          )}
          {view === "overview" && (
            <>
              <PageHeading
                kicker="YOUR WORKSPACE"
                title="Overview"
                detail="A clear view of what you're working on."
                action={<button className="workspace-button primary" onClick={() => navigate("notes")} type="button"><NavIcon name="add" /> New note</button>}
              />
              <div className="workspace-stats">
                <button className="workspace-stat-card" onClick={() => navigate("projects")} type="button">
                  <span className="workspace-stat-icon violet"><NavIcon name="projects" /></span>
                  <span><small>Projects</small><strong>{projects.length}</strong></span>
                  <span className="workspace-stat-caption">Across your workspace</span>
                </button>
                <button className="workspace-stat-card" onClick={() => { setTaskFilter("open"); navigate("tasks"); }} type="button">
                  <span className="workspace-stat-icon blue"><NavIcon name="tasks" /></span>
                  <span><small>Open tasks</small><strong>{incompleteTasks.length}</strong></span>
                  <span className="workspace-stat-caption">Ready for your attention</span>
                </button>
                <button className="workspace-stat-card" onClick={() => navigate("documents")} type="button">
                  <span className="workspace-stat-icon orange"><NavIcon name="documents" /></span>
                  <span><small>Documents</small><strong>{documents.length}</strong></span>
                  <span className="workspace-stat-caption">Reference and planning</span>
                </button>
                <button className="workspace-stat-card" onClick={() => navigate("notes")} type="button">
                  <span className="workspace-stat-icon green"><NavIcon name="notes" /></span>
                  <span><small>Notes</small><strong>{notes.length}</strong></span>
                  <span className="workspace-stat-caption">Thoughts worth keeping</span>
                </button>
              </div>

              <section className="workspace-panel">
                <SectionTitle
                  eyebrow="KEEP THINGS MOVING"
                  title="Tasks to focus on"
                  action={<button className="workspace-text-link" onClick={() => { setTaskFilter("open"); navigate("tasks"); }} type="button">View all tasks →</button>}
                />
                {errors.tasks ? <DataError message={loadErrorMessage("Tasks", errors.tasks)} /> : (
                  <TaskList tasks={searchedTasks.filter((task) => !task.is_complete).slice(0, 4)} projects={projects} projectName={projectName} emptyTitle="You're all caught up" emptyDetail="Add a task when something needs your attention." />
                )}
              </section>

              <section className="workspace-panel">
                <SectionTitle
                  eyebrow="RECENT WORK"
                  title="Latest documents"
                  action={<button className="workspace-text-link" onClick={() => navigate("documents")} type="button">View documents →</button>}
                />
                {errors.documents ? <DataError message={loadErrorMessage("Documents", errors.documents)} /> : (
                  <DocumentList documents={searchedDocuments.slice(0, 4)} projects={projects} projectName={projectName} emptyTitle="No documents yet" emptyDetail="Create a document to keep longer reference material in one place." />
                )}
              </section>

              <section className="workspace-panel">
                <SectionTitle
                  eyebrow="YOUR NOTEBOOK"
                  title="Latest notes"
                  action={<button className="workspace-text-link" onClick={() => navigate("notes")} type="button">View all notes →</button>}
                />
                {errors.notes ? <DataError message={loadErrorMessage("Notes", errors.notes)} /> : (
                  <NoteList notes={searchedNotes.slice(0, 4)} projects={projects} emptyTitle="No notes yet" emptyDetail="Save a detail or idea to see it here." />
                )}
              </section>

              <section className="workspace-panel">
                <SectionTitle
                  eyebrow="ORGANIZED WORK"
                  title="Recent projects"
                  action={<button className="workspace-text-link" onClick={() => navigate("projects")} type="button">View projects →</button>}
                />
                {errors.projects ? <DataError message={loadErrorMessage("Projects", errors.projects)} /> : (
                  <ProjectList projects={searchedProjects.slice(0, 4)} onOpen={showProject} emptyTitle="No projects yet" emptyDetail="Create a project to bring related work together." />
                )}
              </section>
            </>
          )}

          {view === "tasks" && (
            <>
              <PageHeading kicker="PLAN YOUR NEXT STEPS" title="Tasks" detail="Capture action items, add due dates, and keep projects moving." />
              <section className="workspace-panel workspace-create-panel">
                <SectionTitle eyebrow="GET IT OUT OF YOUR HEAD" title="Add a task" />
                <TaskForm projects={projects} />
              </section>
              <section className="workspace-panel">
                <SectionTitle eyebrow="YOUR ACTION LIST" title="All tasks" />
                <div aria-label="Filter tasks" className="workspace-filter-row" role="group">
                  {([
                    ["open", "Open"],
                    ["due", "Due"],
                    ["completed", "Completed"],
                    ["all", "All"],
                  ] as [TaskFilter, string][]).map(([id, label]) => (
                    <button aria-pressed={taskFilter === id} className={`workspace-filter${taskFilter === id ? " active" : ""}`} key={id} onClick={() => setTaskFilter(id)} type="button">{label}</button>
                  ))}
                </div>
                {errors.tasks ? <DataError message={loadErrorMessage("Tasks", errors.tasks)} /> : (
                  <TaskList
                    tasks={searchedTasks.filter((task) => {
                      if (taskFilter === "open") return !task.is_complete;
                      if (taskFilter === "completed") return task.is_complete;
                      if (taskFilter === "due") return !task.is_complete && Boolean(task.due_date && task.due_date <= today);
                      return true;
                    })}
                    projects={projects}
                    projectName={projectName}
                    emptyTitle="No tasks in this view"
                    emptyDetail="Try another filter or add a new task above."
                  />
                )}
              </section>
            </>
          )}

          {view === "documents" && (
            <>
              <PageHeading kicker="REFERENCE AND PLANNING" title="Documents" detail="Keep plans, resources, and longer-form writing easy to find." />
              <section className="workspace-panel workspace-create-panel">
                <SectionTitle eyebrow="CREATE A RESOURCE" title="New document" />
                <DocumentForm projects={projects} />
              </section>
              <section className="workspace-panel">
                <SectionTitle eyebrow="YOUR LIBRARY" title={`Documents (${searchedDocuments.length})`} />
                {errors.documents ? <DataError message={loadErrorMessage("Documents", errors.documents)} /> : (
                  <DocumentList documents={searchedDocuments} projects={projects} projectName={projectName} emptyTitle="No documents found" emptyDetail="Create a document or change your search." editable projectsForForms={projects} />
                )}
              </section>
            </>
          )}

          {view === "notes" && (
            <>
              <PageHeading kicker="QUICK THOUGHTS AND REMINDERS" title="Notes" detail="Keep useful details close, and connect them to a project when it helps." />
              <section className="workspace-panel workspace-create-panel">
                <SectionTitle eyebrow="CAPTURE A THOUGHT" title="Add a note" />
                <NewNoteForm projects={projects.map(({ id, name }) => ({ id, name }))} />
              </section>
              <section className="workspace-panel">
                <SectionTitle eyebrow="YOUR NOTEBOOK" title={`All notes (${searchedNotes.length})`} />
                <div aria-label="Filter notes" className="workspace-filter-row" role="group">
                  {(["all", "projects", "business", "personal"] as const).map((category) => (
                    <button
                      aria-pressed={noteCategory === category}
                      className={`workspace-filter${noteCategory === category ? " active" : ""}`}
                      key={category}
                      onClick={() => setNoteCategory(category)}
                      type="button"
                    >
                      {category === "all" ? "All" : categoryLabels[category]}
                    </button>
                  ))}
                </div>
                {errors.notes ? <DataError message={loadErrorMessage("Notes", errors.notes)} /> : (
                  <NoteList notes={searchedNotes.filter((note) => noteCategory === "all" || note.category === noteCategory)} projects={projects} emptyTitle="No notes found" emptyDetail="Add a note or adjust your search and category." />
                )}
              </section>
            </>
          )}

          {view === "projects" && (
            <>
              <PageHeading
                kicker="ORGANIZE YOUR WORK"
                title={categoryLabels[activeCategory]}
                detail={`Projects and workspaces filed under ${categoryLabels[activeCategory].toLocaleLowerCase()}.`}
                action={<button className="workspace-button primary" onClick={() => setProjectFormOpen((open) => !open)} type="button"><NavIcon name="add" /> New project</button>}
              />
              {projectFormOpen && (
                <section className="workspace-panel workspace-create-panel">
                  <SectionTitle eyebrow="START SOMETHING NEW" title="Create a project" />
                  <ProjectForm defaultCategory={activeCategory} />
                </section>
              )}
              <section className="workspace-panel">
                <SectionTitle eyebrow="YOUR WORKSPACES" title={`${categoryLabels[activeCategory]} (${searchedProjects.filter((project) => project.category === activeCategory).length})`} />
                {errors.projects ? <DataError message={loadErrorMessage("Projects", errors.projects)} /> : (
                  <ProjectList
                    projects={searchedProjects.filter((project) => project.category === activeCategory)}
                    onOpen={showProject}
                    emptyTitle="No projects here yet"
                    emptyDetail="Create a project to group tasks, documents, and notes."
                  />
                )}
              </section>
            </>
          )}

          {view === "project" && activeProject && (
            <>
              <PageHeading
                kicker={categoryLabels[activeProject.category].toLocaleUpperCase()}
                title={activeProject.name}
                detail={activeProject.description || "A focused space for related tasks, notes, and reference documents."}
                action={<button className="workspace-button secondary" onClick={() => { setActiveCategory(activeProject.category); navigate("projects"); }} type="button">← All projects</button>}
              />
              <section className="workspace-panel">
                <SectionTitle eyebrow="PROJECT TASKS" title="Tasks" action={<button className="workspace-text-link" onClick={() => navigate("tasks")} type="button">Manage tasks →</button>} />
                <TaskList tasks={searchedTasks.filter((task) => task.project_id === activeProject.id)} projects={projects} projectName={projectName} emptyTitle="No tasks linked" emptyDetail="Tasks connected to this project will show here." />
              </section>
              <section className="workspace-panel">
                <SectionTitle eyebrow="PROJECT FILES" title="Documents" action={<button className="workspace-text-link" onClick={() => navigate("documents")} type="button">Manage documents →</button>} />
                <DocumentList documents={searchedDocuments.filter((document) => document.project_id === activeProject.id)} projects={projects} projectName={projectName} emptyTitle="No documents linked" emptyDetail="Documents connected to this project will show here." />
              </section>
              <section className="workspace-panel">
                <SectionTitle eyebrow="QUICK REFERENCE" title="Notes" action={<button className="workspace-text-link" onClick={() => navigate("notes")} type="button">Manage notes →</button>} />
                <NoteList notes={searchedNotes.filter((note) => note.project_id === activeProject.id)} projects={projects} emptyTitle="No notes linked" emptyDetail="Notes connected to this project will show here." />
              </section>
              <section className="workspace-panel">
                <SectionTitle eyebrow="PROJECT SETTINGS" title="Edit project" />
                <details className="workspace-details">
                  <summary>Edit name, category, or description</summary>
                  <ProjectForm project={activeProject} />
                </details>
                <ProjectDeleteForm projectId={activeProject.id} />
              </section>
            </>
          )}

          {view === "project" && !activeProject && (
            <EmptyState title="Project not found" detail="It may have been deleted. Choose a category to see your projects." action={<button className="workspace-button primary" onClick={() => navigate("projects")} type="button">Browse projects</button>} />
          )}

          {view === "output" && (
            <>
              <PageHeading kicker="YOUR DATA, YOUR CHOICE" title="Output" detail="Download a copy of your workspace whenever you need it." />
              <section className="workspace-export-grid">
                <article className="workspace-export-card">
                  <span className="workspace-export-icon violet">JSON</span>
                  <h2>Complete workspace backup</h2>
                  <p>Download projects, tasks, documents, and notes together as a structured JSON file.</p>
                  <button className="workspace-button primary" onClick={exportJson} type="button">Download JSON</button>
                </article>
                <article className="workspace-export-card">
                  <span className="workspace-export-icon blue">CSV</span>
                  <h2>Spreadsheet export</h2>
                  <p>Export the workspace as a CSV that you can open in spreadsheet software.</p>
                  <button className="workspace-button secondary" onClick={exportCsv} type="button">Download CSV</button>
                </article>
              </section>
              <p className="workspace-export-count">
                This export includes {projects.length} projects, {tasks.length} tasks, {documents.length} documents, and {notes.length} notes.
              </p>
            </>
          )}

          {view === "support" && (
            <>
              <PageHeading kicker="HERE WHEN YOU NEED A HAND" title="Help & support" detail="Quick answers for the things you can do in your workspace." />
              <section className="workspace-help-grid">
                <details className="workspace-help-card" open>
                  <summary>How do I organize my work?</summary>
                  <p>Create a project from the sidebar. Choose Projects, Business, or Personal, then link tasks, documents, and notes to it.</p>
                </details>
                <details className="workspace-help-card">
                  <summary>How do I keep track of deadlines?</summary>
                  <p>Add a due date to a task. Tasks due today or earlier appear in the notification count and the Due filter.</p>
                </details>
                <details className="workspace-help-card">
                  <summary>How do I organize with tags?</summary>
                  <p>Add up to 10 comma-separated tags to a project, task, document, or note. Select a tag in the sidebar to see every matching record.</p>
                </details>
                <details className="workspace-help-card">
                  <summary>Can I change or remove something?</summary>
                  <p>Open a task or document&apos;s edit panel, or use Edit on a note. Deleting a project keeps its contents and unlinks them.</p>
                </details>
                <details className="workspace-help-card">
                  <summary>How do I make a backup?</summary>
                  <p>Open Output and download a JSON backup or CSV spreadsheet. Exports are generated in your browser and are not sent to a third party.</p>
                </details>
                <div className="workspace-help-actions">
                  <button className="workspace-button secondary" onClick={() => navigate("tasks")} type="button">Go to tasks</button>
                  <button className="workspace-button secondary" onClick={() => navigate("output")} type="button">Open exports</button>
                </div>
              </section>
            </>
          )}

          {view === "tag" && activeTag && (
            <>
              <PageHeading kicker="CUSTOM TAG" title={`#${activeTag}`} detail="Every project, task, document, and note using this tag." />
              {projects.some((project) => project.tags.includes(activeTag)) && (
                <section className="workspace-panel">
                  <SectionTitle eyebrow="PROJECTS" title="Projects" />
                  <ProjectList projects={projects.filter((project) => project.tags.includes(activeTag))} onOpen={showProject} emptyTitle="No projects" emptyDetail="" />
                </section>
              )}
              {tasks.some((task) => task.tags.includes(activeTag)) && (
                <section className="workspace-panel">
                  <SectionTitle eyebrow="TASKS" title="Tasks" />
                  <TaskList tasks={tasks.filter((task) => task.tags.includes(activeTag))} projects={projects} projectName={projectName} emptyTitle="No tasks" emptyDetail="" />
                </section>
              )}
              {documents.some((document) => document.tags.includes(activeTag)) && (
                <section className="workspace-panel">
                  <SectionTitle eyebrow="DOCUMENTS" title="Documents" />
                  <DocumentList documents={documents.filter((document) => document.tags.includes(activeTag))} projects={projects} projectName={projectName} emptyTitle="No documents" emptyDetail="" editable projectsForForms={projects} />
                </section>
              )}
              {notes.some((note) => note.tags.includes(activeTag)) && (
                <section className="workspace-panel">
                  <SectionTitle eyebrow="NOTES" title="Notes" />
                  <NoteList notes={notes.filter((note) => note.tags.includes(activeTag))} projects={projects} emptyTitle="No notes" emptyDetail="" />
                </section>
              )}
              {!availableTags.includes(activeTag) && (
                <EmptyState title="No records use this tag" detail="This tag may have been removed from all records." />
              )}
            </>
          )}

          {view === "tag" && !activeTag && (
            <EmptyState title="Choose a tag" detail="Add tags to projects, tasks, documents, or notes, then use the sidebar to browse them." />
          )}

          {view === "search" && (
            <>
              <PageHeading kicker="WORKSPACE SEARCH" title="Search results" detail={`Matches for “${query.trim()}”.`} />
              {!searchedProjects.length && !searchedTasks.length && !searchedDocuments.length && !searchedNotes.length ? (
                <EmptyState title="No matches found" detail="Try a different title, project name, or keyword." />
              ) : (
                <>
                  {searchedProjects.length > 0 && (
                    <section className="workspace-panel">
                      <SectionTitle eyebrow="PROJECTS" title={`${searchedProjects.length} result${searchedProjects.length === 1 ? "" : "s"}`} />
                      <div className="workspace-search-results">
                        {searchedProjects.map((project) => (
                          <button key={project.id} onClick={() => showProject(project.id)} type="button">
                            <span className={`workspace-category-dot ${categoryColors[project.category]}`} />
                            <span><strong>{project.name}</strong><small>{categoryLabels[project.category]}{project.description ? ` · ${project.description}` : ""}</small></span>
                            <span aria-hidden="true">→</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                  {searchedTasks.length > 0 && (
                    <section className="workspace-panel">
                      <SectionTitle eyebrow="TASKS" title={`${searchedTasks.length} result${searchedTasks.length === 1 ? "" : "s"}`} />
                      <div className="workspace-search-results">
                        {searchedTasks.map((task) => (
                          <button key={task.id} onClick={() => { setTaskFilter("all"); navigate("tasks"); }} type="button">
                            <span className={`search-result-status${task.is_complete ? " done" : ""}`} />
                            <span><strong>{task.title}</strong><small>{task.details || projectName(task.project_id)}</small></span>
                            <span aria-hidden="true">→</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                  {searchedDocuments.length > 0 && (
                    <section className="workspace-panel">
                      <SectionTitle eyebrow="DOCUMENTS" title={`${searchedDocuments.length} result${searchedDocuments.length === 1 ? "" : "s"}`} />
                      <div className="workspace-search-results">
                        {searchedDocuments.map((document) => (
                          <button key={document.id} onClick={() => navigate("documents")} type="button">
                            <NavIcon name="documents" />
                            <span><strong>{document.title}</strong><small>{projectName(document.project_id)}</small></span>
                            <span aria-hidden="true">→</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                  {searchedNotes.length > 0 && (
                    <section className="workspace-panel">
                      <SectionTitle eyebrow="NOTES" title={`${searchedNotes.length} result${searchedNotes.length === 1 ? "" : "s"}`} />
                      <div className="workspace-search-results">
                        {searchedNotes.map((note) => (
                          <Link href={`/notes/${note.id}`} key={note.id}>
                            <NavIcon name="notes" />
                            <span><strong>{note.title}</strong><small>{categoryLabels[note.category]}</small></span>
                            <span aria-hidden="true">→</span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function TaskList({
  tasks,
  projects,
  projectName,
  emptyTitle,
  emptyDetail,
}: {
  tasks: Task[];
  projects: Project[];
  projectName: (id: string | null) => string;
  emptyTitle: string;
  emptyDetail: string;
}) {
  if (!tasks.length) {
    return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  }

  return (
    <ul className="workspace-task-list">
      {tasks.map((task) => (
        <li className={`workspace-task${task.is_complete ? " completed" : ""}`} key={task.id}>
          <TaskStatusForm task={task} />
          <div className="workspace-task-copy">
            <strong>{task.title}</strong>
            {task.details && <p>{task.details}</p>}
            <div className="workspace-card-meta">
              {task.project_id && <span className="workspace-tag">{projectName(task.project_id)}</span>}
              <TagChips tags={task.tags} />
              {task.due_date && <time className={task.due_date < new Date().toISOString().slice(0, 10) && !task.is_complete ? "overdue" : ""} dateTime={task.due_date}>Due {dueLabel(task.due_date)}</time>}
            </div>
          </div>
          <details className="workspace-inline-edit">
            <summary aria-label={`Edit ${task.title}`} title="Edit task">Edit</summary>
            <div className="workspace-inline-panel"><TaskForm projects={projects} task={task} /></div>
          </details>
          <TaskDeleteForm taskId={task.id} />
        </li>
      ))}
    </ul>
  );
}

function DocumentList({
  documents,
  projects,
  projectName,
  emptyTitle,
  emptyDetail,
  editable = false,
  projectsForForms = projects,
}: {
  documents: DocumentRecord[];
  projects: Project[];
  projectName: (id: string | null) => string;
  emptyTitle: string;
  emptyDetail: string;
  editable?: boolean;
  projectsForForms?: Project[];
}) {
  if (!documents.length) {
    return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  }

  return (
    <ul className="workspace-document-grid">
      {documents.map((document, index) => (
        <li className={`workspace-document-card document-tone-${index % 4}`} key={document.id}>
          <div className="workspace-document-top">
            <span className="workspace-document-type">DOCUMENT</span>
            <span aria-hidden="true" className="workspace-document-symbol">▤</span>
          </div>
          <h3>{document.title}</h3>
          <p className="workspace-document-excerpt">{document.content}</p>
          <div className="workspace-card-meta">
            {document.project_id && <span className="workspace-tag">{projectName(document.project_id)}</span>}
            <TagChips tags={document.tags} />
            <time dateTime={document.created_at}>{dateLabel(document.created_at)}</time>
          </div>
          <details className="workspace-document-actions">
            <summary>{editable ? "Read / edit" : "Read document"}</summary>
            <div className="workspace-inline-panel">
              <p className="workspace-document-full-text">{document.content}</p>
              {editable && <DocumentForm document={document} projects={projectsForForms} />}
              {editable && <DocumentDeleteForm documentId={document.id} />}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

function NoteList({
  notes,
  projects,
  emptyTitle,
  emptyDetail,
}: {
  notes: Note[];
  projects: Project[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  const projectName = (id: string | null) => projects.find((project) => project.id === id)?.name;
  if (!notes.length) {
    return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  }

  return (
    <ul className="workspace-note-grid">
      {notes.map((note, index) => (
        <li className={`workspace-note-card note-tone-${index % 4}`} key={note.id}>
          <Link className="workspace-note-card-main" href={`/notes/${note.id}`}>
            <span className="workspace-note-date">{dateLabel(note.created_at)}</span>
            <span className="workspace-note-title"><i />{note.title}</span>
            <span className="workspace-note-body">{note.body || "No details added yet."}</span>
            <span className="workspace-note-meta">
              {categoryLabels[note.category]}
              {note.project_id && ` · ${projectName(note.project_id)}`}
            </span>
            <TagChips tags={note.tags} />
          </Link>
          <NoteListActions noteId={note.id} />
        </li>
      ))}
    </ul>
  );
}

function ProjectList({
  projects,
  onOpen,
  emptyTitle,
  emptyDetail,
}: {
  projects: Project[];
  onOpen: (projectId: string) => void;
  emptyTitle: string;
  emptyDetail: string;
}) {
  if (!projects.length) {
    return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  }

  return (
    <ul className="workspace-project-grid">
      {projects.map((project) => (
        <li className="workspace-project-card" key={project.id}>
          <span className={`workspace-project-color ${categoryColors[project.category]}`} />
          <span className="workspace-project-category">{categoryLabels[project.category]}</span>
          <h3>{project.name}</h3>
          <p>{project.description || "No description yet."}</p>
          <TagChips tags={project.tags} />
          <div className="workspace-project-card-actions">
            <button className="workspace-button secondary" onClick={() => onOpen(project.id)} type="button">Open project</button>
            <details className="workspace-inline-edit">
              <summary aria-label={`Edit ${project.name}`} title="Edit project">Edit</summary>
              <div className="workspace-inline-panel"><ProjectForm project={project} /></div>
            </details>
            <ProjectDeleteForm projectId={project.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <span className="workspace-custom-tags" aria-label={`Tags: ${tags.join(", ")}`}>
      {tags.map((tag) => <span className="workspace-custom-tag" key={tag}>{tag}</span>)}
    </span>
  );
}
