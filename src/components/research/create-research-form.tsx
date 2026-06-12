"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { researchPriorities, researchStatuses } from "@/types/research";

function listValue(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CreateResearchForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      companyName: form.get("companyName"),
      website: form.get("website"),
      industry: form.get("industry"),
      companySize: form.get("companySize"),
      region: form.get("region"),
      decisionMakerName: form.get("decisionMakerName"),
      decisionMakerRole: form.get("decisionMakerRole"),
      decisionMakerEmail: form.get("decisionMakerEmail"),
      source: form.get("source"),
      currentProvider: form.get("currentProvider"),
      competitors: listValue(form.get("competitors")),
      painHypotheses: listValue(form.get("painHypotheses")),
      opportunityIdeas: listValue(form.get("opportunityIdeas")),
      positiveSignals: listValue(form.get("positiveSignals")),
      negativeSignals: listValue(form.get("negativeSignals")),
      fitScore: form.get("fitScore"),
      priority: form.get("priority"),
      status: form.get("status"),
      notes: form.get("notes"),
      outreachAngle: form.get("outreachAngle"),
      nextAction: form.get("nextAction"),
    };

    startTransition(async () => {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Could not create research.");
        return;
      }

      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company</Label>
          <Input id="companyName" name="companyName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" placeholder="https://example.com" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySize">Company size</Label>
          <Input id="companySize" name="companySize" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input id="region" name="region" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="decisionMakerName">Decision maker</Label>
          <Input id="decisionMakerName" name="decisionMakerName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="decisionMakerRole">Role</Label>
          <Input id="decisionMakerRole" name="decisionMakerRole" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="decisionMakerEmail">Email</Label>
          <Input id="decisionMakerEmail" name="decisionMakerEmail" type="email" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="fitScore">Fit score</Label>
          <Input defaultValue="50" id="fitScore" max="100" min="0" name="fitScore" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select defaultValue="medium" id="priority" name="priority">
            {researchPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select defaultValue="draft" id="status" name="status">
            {researchStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" placeholder="LinkedIn, referral, directory" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentProvider">Current provider</Label>
          <Input id="currentProvider" name="currentProvider" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="positiveSignals">Positive signals</Label>
          <Textarea id="positiveSignals" name="positiveSignals" placeholder="One per line" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="negativeSignals">Negative signals</Label>
          <Textarea id="negativeSignals" name="negativeSignals" placeholder="One per line" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="painHypotheses">Pain hypotheses</Label>
          <Textarea id="painHypotheses" name="painHypotheses" placeholder="One per line" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="opportunityIdeas">Opportunity ideas</Label>
          <Textarea id="opportunityIdeas" name="opportunityIdeas" placeholder="One per line" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="competitors">Competitors</Label>
        <Textarea id="competitors" name="competitors" placeholder="One per line" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outreachAngle">Outreach angle</Label>
        <Textarea id="outreachAngle" name="outreachAngle" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nextAction">Next action</Label>
          <Input id="nextAction" name="nextAction" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        {isPending ? "Creating..." : "Create research"}
      </Button>
    </form>
  );
}
