"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function PortalAccessForm({
  clients,
}: {
  clients: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(null);
    setLink(null);

    startTransition(async () => {
      const response = await fetch("/api/portal-accesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.get("clientId"),
          label: form.get("label"),
          expiresAt: form.get("expiresAt") || undefined,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        token?: string;
      } | null;
      if (!response.ok || !body?.token) {
        setMessage(body?.error ?? "Portal link creation failed.");
        return;
      }
      const url = `${window.location.origin}/portal/${body.token}`;
      setLink(url);
      setMessage("Portal link created.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="portal-client">Client</Label>
        <Select id="portal-client" name="clientId" required>
          <option value="">Select client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="portal-label">Label</Label>
          <Input id="portal-label" name="label" defaultValue="Client portal" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portal-expires">Expires</Label>
          <Input id="portal-expires" name="expiresAt" type="date" />
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {link ? (
        <Input aria-label="Portal link" readOnly value={link} />
      ) : null}
      <Button disabled={isPending || clients.length === 0} type="submit">
        {isPending ? "Creating..." : "Create portal link"}
      </Button>
    </form>
  );
}
