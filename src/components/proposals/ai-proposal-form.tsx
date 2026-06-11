"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function AiProposalForm({
  responses,
}: {
  responses: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ai_from_discovery",
          discoveryResponseId: form.get("discoveryResponseId"),
          title: form.get("title") || undefined,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Could not generate proposal.");
        return;
      }

      setMessage("AI proposal draft created.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="discoveryResponseId">Discovery response</Label>
        <Select id="discoveryResponseId" name="discoveryResponseId" required>
          <option value="">Select response</option>
          {responses.map((response) => (
            <option key={response.id} value={response.id}>
              {response.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Proposal title</Label>
        <Input id="title" name="title" />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || responses.length === 0} type="submit" variant="secondary">
        <Sparkles aria-hidden className="h-4 w-4" />
        {isPending ? "Generating..." : "Generate from discovery"}
      </Button>
    </form>
  );
}
