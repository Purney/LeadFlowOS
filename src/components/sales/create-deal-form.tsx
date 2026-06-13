"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dealStages } from "@/types/sales";

export function CreateDealForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"),
      companyName: form.get("companyName"),
      contactName: form.get("contactName"),
      contactEmail: form.get("contactEmail"),
      valueCents: Math.round(Number(form.get("value") ?? 0) * 100),
      probability: form.get("probability"),
      stage: form.get("stage"),
      expectedCloseDate: form.get("expectedCloseDate") || undefined,
      nextAction: form.get("nextAction"),
      nextActionDueAt: form.get("nextActionDueAt") || undefined,
      notes: form.get("notes"),
    };

    startTransition(async () => {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Could not create deal.");
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
          <Label htmlFor="title">Deal title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company</Label>
          <Input id="companyName" name="companyName" required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact</Label>
          <Input id="contactName" name="contactName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          <Input defaultValue="0" id="value" min="0" name="value" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="probability">Probability</Label>
          <Input defaultValue="25" id="probability" max="100" min="0" name="probability" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select defaultValue="discovery_booked" id="stage" name="stage">
            {dealStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expectedCloseDate">Expected close</Label>
          <Input id="expectedCloseDate" name="expectedCloseDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextActionDueAt">Next action due</Label>
          <Input id="nextActionDueAt" name="nextActionDueAt" type="date" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nextAction">Next action</Label>
        <Input id="nextAction" name="nextAction" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        {isPending ? "Creating..." : "Create deal"}
      </Button>
    </form>
  );
}
