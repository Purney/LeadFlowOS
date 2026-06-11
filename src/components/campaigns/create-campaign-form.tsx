"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function splitVariants(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CreateCampaignForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const steps = [
      {
        name: "Initial outreach",
        delayDays: Number(form.get("stepOneDelay") ?? 0),
        subjectVariants: splitVariants(form.get("stepOneSubjects")),
        bodyVariants: splitVariants(form.get("stepOneBodies")),
      },
      {
        name: "Follow-up",
        delayDays: Number(form.get("stepTwoDelay") ?? 3),
        subjectVariants: splitVariants(form.get("stepTwoSubjects")),
        bodyVariants: splitVariants(form.get("stepTwoBodies")),
      },
    ].filter((step) => step.subjectVariants.length && step.bodyVariants.length);

    startTransition(async () => {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          goal: form.get("goal"),
          serviceOffer: form.get("serviceOffer"),
          status: "draft",
          steps,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Could not create campaign.");
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
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceOffer">Service offered</Label>
          <Input id="serviceOffer" name="serviceOffer" placeholder="AI automation audit" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal">Goal</Label>
        <Input id="goal" name="goal" placeholder="Book qualified discovery calls" />
      </div>

      <div className="rounded-md border border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Stage 1</p>
          <div className="w-28">
            <Label htmlFor="stepOneDelay">Delay days</Label>
            <Input id="stepOneDelay" min={0} name="stepOneDelay" type="number" defaultValue={0} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stepOneSubjects">Subject variants</Label>
            <Textarea
              id="stepOneSubjects"
              name="stepOneSubjects"
              placeholder="Quick idea for {{company}}"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stepOneBodies">Body variants</Label>
            <Textarea
              id="stepOneBodies"
              name="stepOneBodies"
              placeholder="Hi {{firstName}}, noticed {{company}}..."
              required
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Stage 2</p>
          <div className="w-28">
            <Label htmlFor="stepTwoDelay">Delay days</Label>
            <Input id="stepTwoDelay" min={0} name="stepTwoDelay" type="number" defaultValue={3} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stepTwoSubjects">Subject variants</Label>
            <Textarea id="stepTwoSubjects" name="stepTwoSubjects" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stepTwoBodies">Body variants</Label>
            <Textarea id="stepTwoBodies" name="stepTwoBodies" />
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        {isPending ? "Creating..." : "Create draft campaign"}
      </Button>
    </form>
  );
}
