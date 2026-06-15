"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function list(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CreateProposalForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    startTransition(async () => {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          status: "draft",
          content: {
            executiveSummary: form.get("executiveSummary"),
            identifiedProblem: form.get("identifiedProblem"),
            proposedSolution: form.get("proposedSolution"),
            deliverables: list(form.get("deliverables")),
            assumptions: list(form.get("assumptions")),
            estimatedTimeline: form.get("estimatedTimeline"),
            optionalEnhancements: list(form.get("optionalEnhancements")),
          },
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Could not create proposal.");
        return;
      }

      formElement.reset();
      setMessage("Proposal created.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="executiveSummary">Executive summary</Label>
          <Textarea id="executiveSummary" name="executiveSummary" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="identifiedProblem">Identified problem</Label>
          <Textarea id="identifiedProblem" name="identifiedProblem" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="proposedSolution">Proposed solution</Label>
        <Textarea id="proposedSolution" name="proposedSolution" required />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="deliverables">Deliverables</Label>
          <Textarea id="deliverables" name="deliverables" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assumptions">Assumptions</Label>
          <Textarea id="assumptions" name="assumptions" />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="estimatedTimeline">Estimated timeline</Label>
          <Input id="estimatedTimeline" name="estimatedTimeline" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="optionalEnhancements">Optional enhancements</Label>
          <Textarea id="optionalEnhancements" name="optionalEnhancements" />
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        {isPending ? "Creating..." : "Create proposal"}
      </Button>
    </form>
  );
}
