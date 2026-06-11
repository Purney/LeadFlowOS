"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function OnboardingTaskForm({
  clients,
  projects,
}: {
  clients: { id: string; label: string }[];
  projects: { id: string; clientId: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/onboarding-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.get("clientId"),
          projectId: form.get("projectId") || undefined,
          title: form.get("title"),
          description: form.get("description") || undefined,
          dueDate: form.get("dueDate") || undefined,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Onboarding task creation failed.");
        return;
      }
      event.currentTarget.reset();
      setMessage("Onboarding task created.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-client">Client</Label>
          <Select id="task-client" name="clientId" required>
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-project">Project</Label>
          <Select id="task-project" name="projectId">
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div className="space-y-2">
          <Label htmlFor="task-title">Task</Label>
          <Input id="task-title" name="title" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-due">Due</Label>
          <Input id="task-due" name="dueDate" type="date" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea id="task-description" name="description" />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || clients.length === 0} type="submit">
        {isPending ? "Creating..." : "Create onboarding task"}
      </Button>
    </form>
  );
}
