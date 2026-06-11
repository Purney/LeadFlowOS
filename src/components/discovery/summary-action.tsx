"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SummaryAction({ responseId }: { responseId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/discovery/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseId }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Summary generation failed.");
        return;
      }

      setMessage("Summary draft generated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button disabled={isPending} onClick={generate} variant="secondary">
        <Sparkles aria-hidden className="h-4 w-4" />
        {isPending ? "Generating..." : "AI summary"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
