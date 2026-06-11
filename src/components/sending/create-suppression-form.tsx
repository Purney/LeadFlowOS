"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function CreateSuppressionForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/suppressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          reason: form.get("reason"),
          note: form.get("note"),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMessage(body?.error ?? "Could not suppress email.");
        return;
      }

      event.currentTarget.reset();
      setMessage("Suppression saved.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="suppressionEmail">Email</Label>
          <Input id="suppressionEmail" name="email" required type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Select id="reason" name="reason" defaultValue="manual_suppression">
            <option value="manual_suppression">Manual suppression</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="spam_report">Spam report</option>
            <option value="existing_client">Existing client</option>
            <option value="competitor">Competitor</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Input id="note" name="note" />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending} type="submit" variant="secondary">
        <ShieldPlus aria-hidden className="h-4 w-4" />
        {isPending ? "Saving..." : "Add suppression"}
      </Button>
    </form>
  );
}
