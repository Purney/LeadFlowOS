"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function TimeEntryForm({
  projects,
}: {
  projects: { id: string; clientId: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const project = projects.find((item) => item.id === form.get("projectId"));
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.get("projectId"),
          clientId: project?.clientId,
          date: form.get("date"),
          minutes: form.get("minutes"),
          description: form.get("description"),
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Time entry failed.");
        return;
      }
      event.currentTarget.reset();
      setMessage("Time logged.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="projectId">Project</Label>
        <Select id="projectId" name="projectId" required>
          <option value="">Select project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" required type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minutes">Minutes</Label>
          <Input id="minutes" name="minutes" required type="number" min={1} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" required />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || projects.length === 0} type="submit">
        {isPending ? "Logging..." : "Log time"}
      </Button>
    </form>
  );
}
