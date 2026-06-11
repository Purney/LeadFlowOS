"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ReplyDraftForm({
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
      const response = await fetch("/api/ai/reply-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: form.get("leadId") }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Could not generate reply draft.");
        return;
      }

      setMessage("Reply draft generated.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="replyLeadId">Lead</Label>
        <Select id="replyLeadId" name="leadId" required>
          <option value="">Select lead</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.label}
            </option>
          ))}
        </Select>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || leads.length === 0} type="submit" variant="secondary">
        <MessageSquareText aria-hidden className="h-4 w-4" />
        {isPending ? "Generating..." : "Generate reply draft"}
      </Button>
    </form>
  );
}
