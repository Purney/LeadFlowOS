"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { projectStatuses, projectTypes } from "@/types/client";

export function CreateProjectForm({
  clients,
}: {
  clients: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.get("clientId"),
          name: form.get("name"),
          type: form.get("type"),
          status: form.get("status"),
          estimatedValue: form.get("estimatedValue"),
          actualRevenue: form.get("actualRevenue"),
          startDate: form.get("startDate") || undefined,
          endDate: form.get("endDate") || undefined,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Project creation failed.");
        return;
      }
      event.currentTarget.reset();
      setMessage("Project created.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client</Label>
          <Select id="clientId" name="clientId" required>
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Project name</Label>
          <Input id="name" name="name" required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" defaultValue="software">
            {projectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="planned">
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="estimatedValue">Estimated value</Label>
          <Input id="estimatedValue" name="estimatedValue" type="number" defaultValue={0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actualRevenue">Actual revenue</Label>
          <Input id="actualRevenue" name="actualRevenue" type="number" defaultValue={0} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start</Label>
          <Input id="startDate" name="startDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || clients.length === 0} type="submit">
        {isPending ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}
