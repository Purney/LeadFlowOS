"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bot, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResearchSummaryButton({ researchId }: { researchId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/research/${researchId}/summary`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Could not generate summary.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button disabled={isPending} onClick={generate} type="button" variant="secondary">
        <Bot aria-hidden className="h-4 w-4" />
        {isPending ? "Generating..." : "AI summary"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function ResearchChecklistToggle({
  researchId,
  itemId,
  completed,
}: {
  researchId: string;
  itemId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await fetch(`/api/research/${researchId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, completed: !completed }),
      });
      router.refresh();
    });
  }

  return (
    <Button
      aria-label={completed ? "Reopen checklist item" : "Complete checklist item"}
      className="h-9 w-9 p-0"
      disabled={isPending}
      onClick={toggle}
      type="button"
      variant={completed ? "secondary" : "ghost"}
    >
      {completed ? (
        <RotateCcw aria-hidden className="h-4 w-4" />
      ) : (
        <Check aria-hidden className="h-4 w-4" />
      )}
    </Button>
  );
}
