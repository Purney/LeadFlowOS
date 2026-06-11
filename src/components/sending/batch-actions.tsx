"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function BatchActions({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(payload: Record<string, unknown>) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/send-batches/${batchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("Batch update failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button disabled={isPending} onClick={() => update({ status: "approved" })}>
          Approve
        </Button>
        <Button
          disabled={isPending}
          onClick={() =>
            update({
              status: "rejected",
              rejectionReason: "Rejected during manual review.",
            })
          }
          variant="danger"
        >
          Reject
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
