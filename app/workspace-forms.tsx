"use client";

import { useActionState } from "react";
import {
  deleteDocument,
  deleteProject,
  deleteTask,
  saveDocument,
  saveProject,
  saveTask,
  setTaskCompletion,
  type WorkspaceActionState,
} from "./actions/workspace";

type Project = {
  id: string;
  name: string;
  description: string;
  category: "projects" | "business" | "personal";
  tags: string[];
};

type Task = {
  id: string;
  title: string;
  details: string;
  project_id: string | null;
  due_date: string | null;
  is_complete: boolean;
  tags: string[];
};

type DocumentRecord = {
  id: string;
  title: string;
  content: string;
  project_id: string | null;
  tags: string[];
};

const initialState: WorkspaceActionState = {};

function Feedback({ state }: { state: WorkspaceActionState }) {
  if (state.error) {
    return <p className="workspace-form-error" role="alert">{state.error}</p>;
  }
  if (state.message) {
    return <p className="workspace-form-success" role="status">{state.message}</p>;
  }
  return null;
}

function ProjectSelect({ projects, defaultValue = "" }: { projects: Pick<Project, "id" | "name">[]; defaultValue?: string }) {
  return (
    <select className="workspace-input" defaultValue={defaultValue} name="project_id">
      <option value="">No project</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
  );
}

function TagsField({ tags = [] }: { tags?: string[] }) {
  return (
    <label className="workspace-form-wide">
      Tags
      <input className="workspace-input" defaultValue={tags.join(", ")} maxLength={329} name="tags" placeholder="e.g. planning, urgent" />
      <small className="workspace-field-hint">Comma-separated. Add up to 10 tags; edit them anytime.</small>
    </label>
  );
}

export function ProjectForm({
  project,
  defaultCategory = "projects",
}: {
  project?: Project;
  defaultCategory?: Project["category"];
}) {
  const [state, action, pending] = useActionState(saveProject, initialState);

  return (
    <form action={action} className="workspace-form">
      {project && <input name="id" type="hidden" value={project.id} />}
      <label>
        Project name
        <input className="workspace-input" defaultValue={project?.name} maxLength={100} name="name" placeholder="e.g. Spring term" required />
      </label>
      <label>
        Category
        <select className="workspace-input" defaultValue={project?.category ?? defaultCategory} name="category">
          <option value="projects">Projects</option>
          <option value="business">Business</option>
          <option value="personal">Personal</option>
        </select>
      </label>
      <label className="workspace-form-wide">
        Description
        <textarea className="workspace-input" defaultValue={project?.description} maxLength={1200} name="description" placeholder="What are you working on?" rows={3} />
      </label>
      <TagsField tags={project?.tags} />
      <button className="workspace-button primary" disabled={pending} type="submit">
        {pending ? "Saving..." : project ? "Save project" : "Create project"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ProjectDeleteForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(deleteProject, initialState);
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm("Delete this project? Its tasks, notes, and documents will stay in your workspace without a project.")) {
        event.preventDefault();
      }
    }}>
      <input name="id" type="hidden" value={projectId} />
      <button className="workspace-button danger subtle" disabled={pending} type="submit">
        {pending ? "Deleting..." : "Delete"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function TaskForm({
  task,
  projects,
}: {
  task?: Task;
  projects: Pick<Project, "id" | "name">[];
}) {
  const [state, action, pending] = useActionState(saveTask, initialState);
  return (
    <form action={action} className="workspace-form">
      {task && <input name="id" type="hidden" value={task.id} />}
      <label>
        Task
        <input className="workspace-input" defaultValue={task?.title} maxLength={160} name="title" placeholder="What needs to get done?" required />
      </label>
      <label>
        Due date
        <input className="workspace-input" defaultValue={task?.due_date ?? ""} name="due_date" type="date" />
      </label>
      <label>
        Project
        <ProjectSelect defaultValue={task?.project_id ?? ""} projects={projects} />
      </label>
      <label className="workspace-form-wide">
        Details
        <textarea className="workspace-input" defaultValue={task?.details} maxLength={3000} name="details" placeholder="Add helpful context (optional)" rows={3} />
      </label>
      <TagsField tags={task?.tags} />
      <button className="workspace-button primary" disabled={pending} type="submit">
        {pending ? "Saving..." : task ? "Save task" : "Add task"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function TaskStatusForm({ task }: { task: Task }) {
  const [state, action, pending] = useActionState(setTaskCompletion, initialState);
  return (
    <form action={action} className="task-status-form">
      <input name="id" type="hidden" value={task.id} />
      <input name="is_complete" type="hidden" value={String(!task.is_complete)} />
      <button aria-label={task.is_complete ? `Reopen ${task.title}` : `Complete ${task.title}`} className={`task-check${task.is_complete ? " checked" : ""}`} disabled={pending} type="submit">
        {task.is_complete ? "✓" : ""}
      </button>
      {state.error && <span className="workspace-form-error" role="alert">{state.error}</span>}
    </form>
  );
}

export function TaskDeleteForm({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(deleteTask, initialState);
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm("Delete this task?")) event.preventDefault();
    }}>
      <input name="id" type="hidden" value={taskId} />
      <button aria-label="Delete task" className="workspace-icon-button" disabled={pending} title="Delete task" type="submit">×</button>
      <Feedback state={state} />
    </form>
  );
}

export function DocumentForm({
  document,
  projects,
}: {
  document?: DocumentRecord;
  projects: Pick<Project, "id" | "name">[];
}) {
  const [state, action, pending] = useActionState(saveDocument, initialState);
  return (
    <form action={action} className="workspace-form">
      {document && <input name="id" type="hidden" value={document.id} />}
      <label className="workspace-form-wide">
        Document title
        <input className="workspace-input" defaultValue={document?.title} maxLength={160} name="title" placeholder="Name this document" required />
      </label>
      <label>
        Project
        <ProjectSelect defaultValue={document?.project_id ?? ""} projects={projects} />
      </label>
      <label className="workspace-form-wide">
        Content
        <textarea className="workspace-input document-content-input" defaultValue={document?.content} maxLength={20000} name="content" placeholder="Write your document..." required rows={7} />
      </label>
      <TagsField tags={document?.tags} />
      <button className="workspace-button primary" disabled={pending} type="submit">
        {pending ? "Saving..." : document ? "Save document" : "Create document"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function DocumentDeleteForm({ documentId }: { documentId: string }) {
  const [state, action, pending] = useActionState(deleteDocument, initialState);
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm("Delete this document?")) event.preventDefault();
    }}>
      <input name="id" type="hidden" value={documentId} />
      <button className="workspace-button danger subtle" disabled={pending} type="submit">
        {pending ? "Deleting..." : "Delete"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
