"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkPaymentPaidButton({ handoffId }: { handoffId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markPaid() {
    startTransition(async () => {
      await fetch(`/api/handoffs/${handoffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      router.refresh();
    });
  }

  return (
    <Button disabled={isPending} onClick={markPaid} type="button" variant="secondary">
      <CreditCard aria-hidden className="h-4 w-4" />
      Mark paid
    </Button>
  );
}

export function MarkReadyButton({ handoffId }: { handoffId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markReady() {
    startTransition(async () => {
      await fetch(`/api/handoffs/${handoffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready_for_execution" }),
      });
      router.refresh();
    });
  }

  return (
    <Button disabled={isPending} onClick={markReady} type="button">
      <CheckCircle2 aria-hidden className="h-4 w-4" />
      Ready
    </Button>
  );
}
