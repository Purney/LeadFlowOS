"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Select } from "@/components/ui/select";
import type { DiscoveryFormStatus } from "@/types/discovery";

export function FormActions({
  formId,
  status,
}: {
  formId: string;
  status: DiscoveryFormStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateStatus(nextStatus: DiscoveryFormStatus) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/discovery/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
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
      <Select
        className="w-36"
        disabled={isPending}
        onChange={(event) => updateStatus(event.target.value as DiscoveryFormStatus)}
        value={status}
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
