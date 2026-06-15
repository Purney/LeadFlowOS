"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  deliverableStatuses,
  executionTaskStatuses,
  milestoneStatuses,
  projectHealthStatuses,
} from "@/types/execution";

type ProjectOption = { id: string; label: string };

async function postJson(url: string, payload: Record<string, unknown>) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function ProjectProgressForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const projectId = String(form.get("projectId") ?? "");
    const payload = {
      health: form.get("health"),
      progressPercent: form.get("progressPercent"),
      clientVisibleSummary: form.get("clientVisibleSummary"),
      internalStatusNote: form.get("internalStatusNote"),
    };

    startTransition(async () => {
      const response = await fetch(`/api/execution/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setError("Could not update project progress.");
        return;
      }
      formElement.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <ProjectSelect projects={projects} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="health">Health</Label>
          <Select defaultValue="on_track" id="health" name="health">
            {projectHealthStatuses.map((status) => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="progressPercent">Progress</Label>
          <Input defaultValue="0" id="progressPercent" max="100" min="0" name="progressPercent" type="number" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="clientVisibleSummary">Client summary</Label>
        <Textarea id="clientVisibleSummary" name="clientVisibleSummary" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="internalStatusNote">Internal note</Label>
        <Textarea id="internalStatusNote" name="internalStatusNote" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={isPending || projects.length === 0} type="submit">
        <Save aria-hidden className="h-4 w-4" />
        Save progress
      </Button>
    </form>
  );
}

export function MilestoneForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    startTransition(async () => {
      await postJson("/api/execution/milestones", {
        projectId: form.get("projectId"),
        title: form.get("title"),
        description: form.get("description"),
        status: form.get("status"),
        dueDate: form.get("dueDate") || undefined,
      });
      formElement.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <ProjectSelect projects={projects} />
      <Input name="title" placeholder="Milestone title" required />
      <Textarea name="description" placeholder="Description" />
      <Select defaultValue="planned" name="status">
        {milestoneStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </Select>
      <Input name="dueDate" type="date" />
      <Button disabled={isPending || projects.length === 0} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        Add milestone
      </Button>
    </form>
  );
}

export function ExecutionTaskForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    startTransition(async () => {
      await postJson("/api/execution/tasks", {
        projectId: form.get("projectId"),
        title: form.get("title"),
        description: form.get("description"),
        assigneeName: form.get("assigneeName"),
        status: form.get("status"),
        dueDate: form.get("dueDate") || undefined,
      });
      formElement.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <ProjectSelect projects={projects} />
      <Input name="title" placeholder="Task title" required />
      <Input name="assigneeName" placeholder="Assignee" />
      <Textarea name="description" placeholder="Description" />
      <Select defaultValue="todo" name="status">
        {executionTaskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </Select>
      <Input name="dueDate" type="date" />
      <Button disabled={isPending || projects.length === 0} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        Add task
      </Button>
    </form>
  );
}

export function DeliverableForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    startTransition(async () => {
      await postJson("/api/execution/deliverables", {
        projectId: form.get("projectId"),
        title: form.get("title"),
        description: form.get("description"),
        url: form.get("url"),
        status: form.get("status"),
      });
      formElement.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <ProjectSelect projects={projects} />
      <Input name="title" placeholder="Deliverable title" required />
      <Input name="url" placeholder="https://..." />
      <Textarea name="description" placeholder="Description" />
      <Select defaultValue="draft" name="status">
        {deliverableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </Select>
      <Button disabled={isPending || projects.length === 0} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        Add deliverable
      </Button>
    </form>
  );
}

function ProjectSelect({ projects }: { projects: ProjectOption[] }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="projectId">Project</Label>
      <Select id="projectId" name="projectId" required>
        <option value="">Select project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>{project.label}</option>
        ))}
      </Select>
    </div>
  );
}
