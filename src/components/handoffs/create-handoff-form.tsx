"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { handoffTemplateTypes } from "@/types/handoff";

type DealOption = {
  id: string;
  label: string;
  valueCents: number;
};

export function CreateHandoffForm({ deals }: { deals: DealOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPortalToken(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      dealId: form.get("dealId"),
      projectName: form.get("projectName"),
      projectType: form.get("projectType"),
      createProject: form.get("createProject") === "on",
      createPortalAccess: form.get("createPortalAccess") === "on",
      createSignatureRequest: form.get("createSignatureRequest") === "on",
      runTaskAutomation: form.get("runTaskAutomation") === "on",
      requirePaymentBeforeKickoff: form.get("requirePaymentBeforeKickoff") === "on",
      paymentDueCents: Math.round(Number(form.get("paymentDue") ?? 0) * 100),
      paymentDescription: form.get("paymentDescription"),
      signerName: form.get("signerName"),
      signerEmail: form.get("signerEmail"),
      contractTerms: form.get("contractTerms"),
      kickoffNotes: form.get("kickoffNotes"),
    };

    startTransition(async () => {
      const response = await fetch("/api/handoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string; portalToken?: string }
        | null;

      if (!response.ok) {
        setError(body?.error ?? "Could not create handoff.");
        return;
      }

      setPortalToken(body?.portalToken ?? null);
      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="dealId">Won deal</Label>
        <Select id="dealId" name="dealId" required>
          <option value="">Select deal</option>
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project name</Label>
          <Input id="projectName" name="projectName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectType">Project type</Label>
          <Select defaultValue="automation" id="projectType" name="projectType">
            {handoffTemplateTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="paymentDue">Payment due</Label>
          <Input defaultValue="0" id="paymentDue" min="0" name="paymentDue" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentDescription">Payment description</Label>
          <Input id="paymentDescription" name="paymentDescription" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signerName">Signer name</Label>
          <Input id="signerName" name="signerName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signerEmail">Signer email</Label>
          <Input id="signerEmail" name="signerEmail" type="email" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractTerms">Contract terms</Label>
        <Textarea id="contractTerms" name="contractTerms" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kickoffNotes">Kickoff notes</Label>
        <Textarea id="kickoffNotes" name="kickoffNotes" />
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        {[
          ["createProject", "Create project"],
          ["createPortalAccess", "Create portal access"],
          ["createSignatureRequest", "Create signature request"],
          ["runTaskAutomation", "Run onboarding checklist"],
          ["requirePaymentBeforeKickoff", "Payment before kickoff"],
        ].map(([id, label]) => (
          <label className="flex items-center gap-2" key={id}>
            <input defaultChecked id={id} name={id} type="checkbox" />
            {label}
          </label>
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {portalToken ? (
        <p className="rounded-md border border-border bg-muted p-3 text-xs">
          Portal token issued once: {portalToken}
        </p>
      ) : null}
      <Button disabled={isPending || deals.length === 0} type="submit">
        <Rocket aria-hidden className="h-4 w-4" />
        {isPending ? "Creating..." : "Create handoff"}
      </Button>
    </form>
  );
}
