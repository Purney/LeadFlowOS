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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    startTransition(async () => {
      const response = await fetch("/api/email-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          domain: form.get("domain"),
          provider: form.get("provider"),
          mailgunDomain: form.get("mailgunDomain"),
          verificationStatus: form.get("verificationStatus"),
          dailySendLimit: form.get("dailySendLimit"),
          perDomainDailyLimit: form.get("perDomainDailyLimit"),
          warmupTargetDailyVolume: form.get("warmupTargetDailyVolume"),
          warmupStatus: form.get("warmupStatus"),
          reputationStatus: form.get("reputationStatus"),
          active: true,
          health: {
            spfConfigured: form.get("spfConfigured") === "on",
            dkimConfigured: form.get("dkimConfigured") === "on",
            dmarcConfigured: form.get("dmarcConfigured") === "on",
            dmarcPolicy: form.get("dmarcPolicy"),
            forwardReverseDnsConfigured:
              form.get("forwardReverseDnsConfigured") === "on",
            tlsEnabled: form.get("tlsEnabled") === "on",
            trackingDomainConfigured: form.get("trackingDomainConfigured") === "on",
            unsubscribeSupported: form.get("unsubscribeSupported") === "on",
            oneClickUnsubscribeSupported:
              form.get("oneClickUnsubscribeSupported") === "on",
            blocklistDetected: form.get("blocklistDetected") === "on",
            bounceRate: 0,
            spamComplaintRate: 0,
            deferralRate: 0,
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

      formElement.reset();
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
          <Select id="provider" name="provider" defaultValue="mailgun">
            <option value="mailgun">Mailgun</option>
            <option value="smtp">SMTP</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mailgunDomain">Mailgun domain</Label>
          <Input id="mailgunDomain" name="mailgunDomain" placeholder="mg.example.com" />
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
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="perDomainDailyLimit">Per-domain cap</Label>
          <Input
            id="perDomainDailyLimit"
            min={1}
            name="perDomainDailyLimit"
            type="number"
            defaultValue={5}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="warmupTargetDailyVolume">Warm-up target</Label>
          <Input
            id="warmupTargetDailyVolume"
            min={1}
            name="warmupTargetDailyVolume"
            type="number"
            defaultValue={75}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reputationStatus">Reputation</Label>
          <Select id="reputationStatus" name="reputationStatus" defaultValue="unknown">
            <option value="unknown">Unknown</option>
            <option value="good">Good</option>
            <option value="watch">Watch</option>
            <option value="poor">Poor</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dmarcPolicy">DMARC policy</Label>
        <Select id="dmarcPolicy" name="dmarcPolicy" defaultValue="none">
          <option value="none">None</option>
          <option value="quarantine">Quarantine</option>
          <option value="reject">Reject</option>
        </Select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          ["spfConfigured", "SPF configured"],
          ["dkimConfigured", "DKIM configured"],
          ["dmarcConfigured", "DMARC configured"],
          ["forwardReverseDnsConfigured", "Forward/reverse DNS confirmed"],
          ["tlsEnabled", "TLS enabled"],
          ["trackingDomainConfigured", "Tracking domain configured"],
          ["unsubscribeSupported", "Unsubscribe supported"],
          ["oneClickUnsubscribeSupported", "One-click unsubscribe supported"],
          ["blocklistDetected", "Blocklist detected"],
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
