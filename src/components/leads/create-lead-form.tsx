"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { leadStatuses } from "@/types/lead";

type LeadCustomFieldDefinition = {
  name: string;
  key: string;
};

export function CreateLeadForm({
  leadCustomFields = [],
}: {
  leadCustomFields?: LeadCustomFieldDefinition[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [customFields, setCustomFields] = useState(
    leadCustomFields.length ? [] : [{ id: 1 }],
  );

  function addCustomField() {
    setCustomFields((current) => [
      ...current,
      {
        id:
          current.length > 0
            ? Math.max(...current.map((field) => field.id)) + 1
            : 1,
      },
    ]);
  }

  function removeCustomField(id: number) {
    setCustomFields((current) =>
      current.length > 1 ? current.filter((field) => field.id !== id) : current,
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const customFieldNames = form.getAll("customFieldName");
    const customFieldValues = form.getAll("customFieldValue");
    const customFieldPayload = Object.fromEntries(
      customFieldNames
        .map((name, index) => [
          String(name ?? "").trim(),
          String(customFieldValues[index] ?? "").trim(),
        ])
        .filter(([name, value]) => name && value),
    );
    const payload = {
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email"),
      phone: form.get("phone"),
      company: form.get("company"),
      website: form.get("website"),
      role: form.get("role"),
      tags: String(form.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      notes: form.get("notes"),
      source: form.get("source"),
      status: form.get("status"),
      customFields: customFieldPayload,
    };

    startTransition(async () => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Could not create lead.");
        return;
      }

      formElement.reset();
      setCustomFields(leadCustomFields.length ? [] : [{ id: 1 }]);
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" required type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" placeholder="LinkedIn, referral, CSV" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" placeholder="ai, automation, warm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="discovery_booked">
            {leadStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </div>
      <div className="rounded-md border border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Custom fields</p>
            <p className="text-xs text-muted-foreground">
              Add extra CRM context for qualification, proposals, and handoff notes.
            </p>
          </div>
          <Button onClick={addCustomField} type="button" variant="secondary">
            <Plus aria-hidden className="h-4 w-4" />
            Add field
          </Button>
        </div>
        <div className="space-y-3">
          {leadCustomFields.map((field) => (
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr]" key={field.key}>
              <div className="space-y-2">
                <Label htmlFor={`globalCustomFieldName-${field.key}`}>Field</Label>
                <Input
                  id={`globalCustomFieldName-${field.key}`}
                  name="customFieldName"
                  readOnly
                  value={field.key}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`globalCustomFieldValue-${field.key}`}>
                  Value
                </Label>
                <Input
                  id={`globalCustomFieldValue-${field.key}`}
                  name="customFieldValue"
                  placeholder="Add a value for this lead"
                />
              </div>
            </div>
          ))}
          {customFields.map((field, index) => (
            <div
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
              key={field.id}
            >
              <div className="space-y-2">
                <Label htmlFor={`customFieldName-${field.id}`}>
                  Field {index + 1} name
                </Label>
                <Input
                  id={`customFieldName-${field.id}`}
                  name="customFieldName"
                  placeholder="Project type"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`customFieldValue-${field.id}`}>Value</Label>
                <Input
                  id={`customFieldValue-${field.id}`}
                  name="customFieldValue"
                  placeholder="Healthcare refurbishment"
                />
              </div>
              <div className="flex items-end">
                <Button
                  aria-label={`Remove custom field ${index + 1}`}
                  className="h-10 w-10 px-0"
                  disabled={customFields.length === 1}
                  onClick={() => removeCustomField(field.id)}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        {isPending ? "Creating..." : "Create lead"}
      </Button>
    </form>
  );
}
