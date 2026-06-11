"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ColdEmailForm({
  leads,
}: {
  leads: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/ai/cold-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: form.get("leadId"),
          serviceOffer: form.get("serviceOffer"),
          campaignGoal: form.get("campaignGoal"),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Could not generate cold email draft.");
        return;
      }

      setMessage("Cold email draft generated.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="leadId">Lead</Label>
        <Select id="leadId" name="leadId" required>
          <option value="">Select lead</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="serviceOffer">Service offered</Label>
        <Input id="serviceOffer" name="serviceOffer" placeholder="AI automation audit" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaignGoal">Campaign goal</Label>
        <Input id="campaignGoal" name="campaignGoal" placeholder="Book discovery calls" required />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || leads.length === 0} type="submit">
        <Sparkles aria-hidden className="h-4 w-4" />
        {isPending ? "Generating..." : "Generate cold email"}
      </Button>
    </form>
  );
}
