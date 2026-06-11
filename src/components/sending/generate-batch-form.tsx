"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function GenerateBatchForm({
  campaigns,
  accounts,
}: {
  campaigns: { id: string; name: string }[];
  accounts: { id: string; email: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/send-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: form.get("campaignId"),
          sendingAccountId: form.get("sendingAccountId"),
          scheduledSendTime: form.get("scheduledSendTime") || undefined,
          limit: form.get("limit"),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string; created?: number; skipped?: number }
        | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Could not generate batch.");
        return;
      }

      setMessage(`Generated ${body?.created ?? 0} recipients. ${body?.skipped ?? 0} skipped.`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="campaignId">Campaign</Label>
          <Select id="campaignId" name="campaignId" required>
            <option value="">Select campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sendingAccountId">Sending account</Label>
          <Select id="sendingAccountId" name="sendingAccountId" required>
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.email}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduledSendTime">Scheduled send time</Label>
          <Input id="scheduledSendTime" name="scheduledSendTime" type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="limit">Batch limit</Label>
          <Input id="limit" min={1} max={250} name="limit" type="number" defaultValue={25} />
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || campaigns.length === 0 || accounts.length === 0} type="submit">
        <Layers aria-hidden className="h-4 w-4" />
        {isPending ? "Generating..." : "Generate pending batch"}
      </Button>
    </form>
  );
}
