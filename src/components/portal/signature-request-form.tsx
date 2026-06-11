"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function SignatureRequestForm({
  clients,
  proposals,
}: {
  clients: { id: string; label: string; email?: string; contactName?: string }[];
  proposals: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const client = clients.find((item) => item.id === form.get("clientId"));
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/signature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.get("clientId"),
          proposalId: form.get("proposalId") || undefined,
          title: form.get("title"),
          signerName: form.get("signerName") || client?.contactName,
          signerEmail: form.get("signerEmail") || client?.email,
          termsMarkdown: form.get("termsMarkdown"),
          status: "sent",
          useExternalProvider: form.get("useExternalProvider") === "on",
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Signature request failed.");
        return;
      }
      event.currentTarget.reset();
      setMessage("Signature request created.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signature-client">Client</Label>
          <Select id="signature-client" name="clientId" required>
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signature-proposal">Proposal</Label>
          <Select id="signature-proposal" name="proposalId">
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
        <Label htmlFor="signature-title">Title</Label>
        <Input id="signature-title" name="title" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signature-name">Signer name</Label>
          <Input id="signature-name" name="signerName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signature-email">Signer email</Label>
          <Input id="signature-email" name="signerEmail" type="email" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signature-terms">Terms</Label>
        <Textarea
          id="signature-terms"
          name="termsMarkdown"
          required
          defaultValue="I approve this scope and authorize work to begin."
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input name="useExternalProvider" type="checkbox" />
        Send through external signature provider
      </label>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending || clients.length === 0} type="submit">
        {isPending ? "Creating..." : "Create signature request"}
      </Button>
    </form>
  );
}
