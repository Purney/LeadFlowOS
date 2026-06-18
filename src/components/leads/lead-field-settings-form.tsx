"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toPersonalisationToken } from "@/utils/personalisation";

type FieldDefinition = {
  id: number;
  name: string;
  key: string;
};

function createDefinition(id: number, name = "", key = ""): FieldDefinition {
  return { id, name, key };
}

export function LeadFieldSettingsForm({
  leadCustomFields,
  outboundSettings,
}: {
  leadCustomFields: { name: string; key: string }[];
  outboundSettings: Record<string, unknown>;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<FieldDefinition[]>(
    leadCustomFields.length
      ? leadCustomFields.map((field, index) =>
          createDefinition(index + 1, field.name, field.key),
        )
      : [createDefinition(1)],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(id: number, patch: Partial<FieldDefinition>) {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  }

  function addField() {
    setFields((current) => [
      ...current,
      createDefinition(Math.max(...current.map((field) => field.id)) + 1),
    ]);
  }

  function removeField(id: number) {
    setFields((current) => {
      const next = current.filter((field) => field.id !== id);
      return next.length ? next : [createDefinition(1)];
    });
  }

  function saveSettings() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/organisation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadCustomFields: fields
            .map((field) => ({
              name: field.name,
              key: field.key || toPersonalisationToken(field.name),
            }))
            .filter((field) => field.name.trim()),
          outboundSettings,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Lead field settings failed.");
        return;
      }

      setMessage("Lead fields saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => {
          const token = toPersonalisationToken(field.key || field.name);

          return (
            <div className="rounded-md border border-border p-3" key={field.id}>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor={`lead-field-name-${field.id}`}>
                    Field {index + 1}
                  </Label>
                  <Input
                    id={`lead-field-name-${field.id}`}
                    placeholder="Project type"
                    value={field.name}
                    onChange={(event) =>
                      updateField(field.id, { name: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`lead-field-key-${field.id}`}>Token key</Label>
                  <Input
                    id={`lead-field-key-${field.id}`}
                    placeholder="PROJECT_TYPE"
                    value={field.key}
                    onChange={(event) =>
                      updateField(field.id, { key: event.target.value })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    aria-label={`Remove lead field ${index + 1}`}
                    className="h-10 w-10 px-0"
                    onClick={() => removeField(field.id)}
                    variant="ghost"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {token ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Campaign token: <code>{`{${token}}`}</code>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={addField} type="button" variant="secondary">
          <Plus aria-hidden className="h-4 w-4" />
          Add field
        </Button>
        <Button disabled={isPending} onClick={saveSettings} type="button">
          {isPending ? "Saving..." : "Save lead fields"}
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
