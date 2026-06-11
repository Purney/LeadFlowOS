"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function PublicMessageForm({
  token,
  projects,
}: {
  token: string;
  projects: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/public/portal/${token}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.get("projectId") || undefined,
          authorName: form.get("authorName"),
          body: form.get("body"),
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Message failed.");
        return;
      }
      event.currentTarget.reset();
      setMessage("Message sent.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="public-message-author">Name</Label>
          <Input id="public-message-author" name="authorName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="public-message-project">Project</Label>
          <Select id="public-message-project" name="projectId">
            <option value="">General</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="public-message-body">Message</Label>
        <Textarea id="public-message-body" name="body" required />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending} type="submit">
        {isPending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
