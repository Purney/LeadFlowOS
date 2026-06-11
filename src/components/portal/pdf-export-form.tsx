"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function PdfExportForm({
  clients,
  proposals,
}: {
  clients: { id: string; label: string }[];
  proposals: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/pdf-exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.get("clientId") || undefined,
          proposalId: form.get("proposalId") || undefined,
          title: form.get("title"),
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "PDF export failed.");
        return;
      }
      event.currentTarget.reset();
      setMessage("PDF-ready export generated.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pdf-client">Client</Label>
          <Select id="pdf-client" name="clientId">
            <option value="">No client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pdf-proposal">Proposal</Label>
          <Select id="pdf-proposal" name="proposalId">
            <option value="">No proposal</option>
            {proposals.map((proposal) => (
              <option key={proposal.id} value={proposal.id}>
                {proposal.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pdf-title">Title</Label>
        <Input id="pdf-title" name="title" required />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending} type="submit">
        {isPending ? "Generating..." : "Generate PDF-ready export"}
      </Button>
    </form>
  );
}
