"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function CreateEmailAccountForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/email-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          domain: form.get("domain"),
          provider: form.get("provider"),
          sendGridSenderId: form.get("sendGridSenderId"),
          verificationStatus: form.get("verificationStatus"),
          dailySendLimit: form.get("dailySendLimit"),
          warmupStatus: form.get("warmupStatus"),
          active: true,
          health: {
            spfConfigured: form.get("spfConfigured") === "on",
            dkimConfigured: form.get("dkimConfigured") === "on",
            dmarcConfigured: form.get("dmarcConfigured") === "on",
            trackingDomainConfigured: form.get("trackingDomainConfigured") === "on",
            unsubscribeSupported: form.get("unsubscribeSupported") === "on",
            bounceRate: 0,
            spamComplaintRate: 0,
          },
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Could not create sending account.");
        return;
      }

      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" required type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain">Domain</Label>
          <Input id="domain" name="domain" placeholder="example.com" required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select id="provider" name="provider" defaultValue="sendgrid">
            <option value="sendgrid">SendGrid</option>
            <option value="smtp">SMTP</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sendGridSenderId">SendGrid sender ID</Label>
          <Input id="sendGridSenderId" name="sendGridSenderId" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="verificationStatus">Verification</Label>
          <Select
            id="verificationStatus"
            name="verificationStatus"
            defaultValue="not_configured"
          >
            <option value="not_configured">Not configured</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="warmupStatus">Warm-up</Label>
          <Select id="warmupStatus" name="warmupStatus" defaultValue="not_started">
            <option value="not_started">Not started</option>
            <option value="warming">Warming</option>
            <option value="ready">Ready</option>
            <option value="paused">Paused</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dailySendLimit">Daily limit</Label>
          <Input
            id="dailySendLimit"
            min={1}
            name="dailySendLimit"
            type="number"
            defaultValue={25}
          />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          ["spfConfigured", "SPF configured"],
          ["dkimConfigured", "DKIM configured"],
          ["dmarcConfigured", "DMARC configured"],
          ["trackingDomainConfigured", "Tracking domain configured"],
          ["unsubscribeSupported", "Unsubscribe supported"],
        ].map(([id, label]) => (
          <label className="flex items-center gap-2 text-sm" key={id}>
            <input
              className="h-4 w-4 accent-primary"
              defaultChecked={id === "unsubscribeSupported"}
              id={id}
              name={id}
              type="checkbox"
            />
            {label}
          </label>
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        {isPending ? "Creating..." : "Add sending account"}
      </Button>
    </form>
  );
}
