"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PublicSignatureForm({
  token,
  requestId,
  signerName,
}: {
  token: string;
  requestId: string;
  signerName: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(
        `/api/public/portal/${token}/signatures/${requestId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signerName: form.get("signerName"),
            signatureText: form.get("signatureText"),
          }),
        },
      );
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Signature failed.");
        return;
      }
      setMessage("Signed.");
      router.refresh();
    });
  }

  return (
    <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor={`signer-${requestId}`}>Signer</Label>
        <Input
          id={`signer-${requestId}`}
          name="signerName"
          required
          defaultValue={signerName}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`signature-${requestId}`}>Signature</Label>
        <Input id={`signature-${requestId}`} name="signatureText" required />
      </div>
      <div className="flex items-end">
        <Button disabled={isPending} type="submit">
          {isPending ? "Signing..." : "Sign"}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground sm:col-span-3">{message}</p> : null}
    </form>
  );
}
