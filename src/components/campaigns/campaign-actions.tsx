"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { campaignStatuses, type CampaignStatus } from "@/types/campaign";

type CampaignActionsProps = {
  campaignId: string;
  status: CampaignStatus;
};

export function CampaignActions({ campaignId, status }: CampaignActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateStatus(nextStatus: CampaignStatus) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        setError("Status update failed.");
        return;
      }

      router.refresh();
    });
  }

  function enrollAllLeads() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: window.__leadflowLeadIds ?? [] }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string; created?: number; matched?: number }
        | null;

      if (!response.ok) {
        setError(body?.error ?? "Enrollment failed.");
        return;
      }

      setMessage(`Enrolled ${body?.created ?? 0} of ${body?.matched ?? 0} leads.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Select
          className="w-36"
          disabled={isPending}
          onChange={(event) => updateStatus(event.target.value as CampaignStatus)}
          value={status}
        >
          {campaignStatuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Button disabled={isPending} onClick={enrollAllLeads} variant="secondary">
          Enroll visible leads
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

declare global {
  interface Window {
    __leadflowLeadIds?: string[];
  }
}
