"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function PortalMessageForm({
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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/portal-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.get("clientId"),
          projectId: form.get("projectId") || undefined,
          authorName: form.get("authorName") || "Team",
          body: form.get("body"),
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Message failed.");
        return;
      }
      formElement.reset();
      setMessage("Message posted.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="message-client">Client</Label>
          <Select id="message-client" name="clientId" required>
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="message-project">Project</Label>
          <Select id="message-project" name="projectId">
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message-author">Author</Label>
        <Input id="message-author" name="authorName" defaultValue="Team" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message-body">Message</Label>
        <Textarea id="message-body" name="body" required />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || clients.length === 0} type="submit">
        {isPending ? "Posting..." : "Post portal message"}
      </Button>
    </form>
  );
}
