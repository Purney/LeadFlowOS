"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Select } from "@/components/ui/select";
import { proposalStatuses, type ProposalStatus } from "@/types/proposal";

export function ProposalActions({
  proposalId,
  status,
}: {
  proposalId: string;
  status: ProposalStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateStatus(nextStatus: ProposalStatus) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/proposals/${proposalId}`, {
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

  return (
    <div className="space-y-2">
      <Select
        className="w-32"
        disabled={isPending}
        onChange={(event) => updateStatus(event.target.value as ProposalStatus)}
        value={status}
      >
        {proposalStatuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
