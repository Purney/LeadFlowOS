"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { WarmupStatus } from "@/types/sending";

export function AccountActions({
  accountId,
  active,
  warmupStatus,
}: {
  accountId: string;
  active: boolean;
  warmupStatus: WarmupStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(payload: Record<string, unknown>) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/email-accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("Update failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Select
          className="w-36"
          disabled={isPending}
          onChange={(event) =>
            update({
              warmupStatus: event.target.value,
              warmupStartedAt:
                event.target.value === "warming" ? new Date().toISOString() : undefined,
            })
          }
          value={warmupStatus}
        >
          <option value="not_started">Not started</option>
          <option value="warming">Warming</option>
          <option value="ready">Ready</option>
          <option value="paused">Paused</option>
        </Select>
        <Button
          disabled={isPending}
          onClick={() => update({ active: !active })}
          variant="secondary"
        >
          {active ? "Deactivate" : "Activate"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
