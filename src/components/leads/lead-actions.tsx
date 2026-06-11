"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { leadStatuses, type LeadStatus } from "@/types/lead";

type LeadActionsProps = {
  leadId: string;
  status: LeadStatus;
};

export function LeadActions({ leadId, status }: LeadActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateStatus(nextStatus: LeadStatus) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/leads/${leadId}`, {
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

  function deleteLead() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Delete failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          aria-label="Lead status"
          className="w-40"
          disabled={isPending}
          onChange={(event) => updateStatus(event.target.value as LeadStatus)}
          value={status}
        >
          {leadStatuses.map((item) => (
            <option key={item} value={item}>
              {item.replace("_", " ")}
            </option>
          ))}
        </Select>
        <Button
          aria-label="Delete lead"
          className="h-10 w-10 px-0"
          disabled={isPending}
          onClick={deleteLead}
          variant="ghost"
        >
          <Trash2 aria-hidden className="h-4 w-4" />
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
