"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ConvertLeadForm({
  leads,
}: {
  leads: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "convert_lead", leadId: form.get("leadId") }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Conversion failed.");
        return;
      }
      setMessage("Lead converted.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
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
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || leads.length === 0} type="submit">
        {isPending ? "Converting..." : "Convert to client"}
      </Button>
    </form>
  );
}
