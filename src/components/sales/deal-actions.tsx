"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DealStageButtons({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setStage(stage: "won" | "lost") {
    startTransition(async () => {
      await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button disabled={isPending} onClick={() => setStage("won")} type="button" variant="secondary">
        <Check aria-hidden className="h-4 w-4" />
        Won
      </Button>
      <Button disabled={isPending} onClick={() => setStage("lost")} type="button" variant="ghost">
        <X aria-hidden className="h-4 w-4" />
        Lost
      </Button>
    </div>
  );
}

export function CompleteSalesTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function complete() {
    startTransition(async () => {
      await fetch(`/api/sales-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      router.refresh();
    });
  }

  return (
    <Button disabled={isPending} onClick={complete} type="button" variant="secondary">
      <Check aria-hidden className="h-4 w-4" />
      Done
    </Button>
  );
}
