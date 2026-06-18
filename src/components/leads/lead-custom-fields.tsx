"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toPersonalisationToken } from "@/utils/personalisation";

type CustomFieldRow = {
  id: number;
  name: string;
  value: string;
};

type LeadCustomFieldsProps = {
  leadId: string;
  customFields: Record<string, unknown>;
  fieldDefinitions?: { name: string; key: string }[];
};

function createRow(id: number, name = "", value = ""): CustomFieldRow {
  return {
    id,
    name,
    value,
  };
}

function rowsFromFields(fields: Record<string, unknown>) {
  const rows = Object.entries(fields).map(([name, value], index) =>
    createRow(index + 1, name, String(value ?? "")),
  );

  return rows.length ? rows : [createRow(1)];
}

function rowsFromDefinitions(
  fields: Record<string, unknown>,
  definitions: { name: string; key: string }[],
) {
  const used = new Set<string>();
  const definitionRows = definitions.map((definition, index) => {
    used.add(definition.key);
    return createRow(index + 1, definition.key, String(fields[definition.key] ?? ""));
  });
  const extraRows = Object.entries(fields)
    .filter(([name]) => !used.has(name))
    .map(([name, value], index) =>
      createRow(definitionRows.length + index + 1, name, String(value ?? "")),
    );
  const rows = [...definitionRows, ...extraRows];

  return rows.length ? rows : [createRow(1)];
}

function payloadFromRows(rows: CustomFieldRow[]) {
  return Object.fromEntries(
    rows
      .map((row) => [row.name.trim(), row.value.trim()] as const)
      .filter(([name, value]) => name && value),
  );
}

export function LeadCustomFields({
  leadId,
  customFields,
  fieldDefinitions = [],
}: LeadCustomFieldsProps) {
  const router = useRouter();
  const [rows, setRows] = useState<CustomFieldRow[]>(() =>
    fieldDefinitions.length
      ? rowsFromDefinitions(customFields, fieldDefinitions)
      : rowsFromFields(customFields),
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateRow(id: number, patch: Partial<CustomFieldRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      { id: Math.max(...current.map((row) => row.id)) + 1, name: "", value: "" },
    ]);
  }

  function removeRow(id: number) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length ? next : [createRow(1)];
    });
  }

  function saveFields() {
    setError(null);
    setMessage(null);
    const customFieldPayload = payloadFromRows(rows);

    startTransition(async () => {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customFields: customFieldPayload }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Custom fields update failed.");
        return;
      }

      setRows(
        fieldDefinitions.length
          ? rowsFromDefinitions(customFieldPayload, fieldDefinitions)
          : rowsFromFields(customFieldPayload),
      );
      setMessage("Custom fields saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div
            className="grid gap-2 rounded-md border border-border p-2"
            key={row.id}
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1">
                <Label htmlFor={`lead-${leadId}-field-${row.id}`}>
                  Field {index + 1}
                </Label>
                <Input
                  id={`lead-${leadId}-field-${row.id}`}
                  placeholder="Project type"
                  value={row.name}
                  onChange={(event) =>
                    updateRow(row.id, { name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`lead-${leadId}-value-${row.id}`}>Value</Label>
                <Input
                  id={`lead-${leadId}-value-${row.id}`}
                  placeholder="Healthcare refurbishment"
                  value={row.value}
                  onChange={(event) =>
                    updateRow(row.id, { value: event.target.value })
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  aria-label={`Remove custom field ${index + 1}`}
                  className="h-10 w-10 px-0"
                  onClick={() => removeRow(row.id)}
                  variant="ghost"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {row.name.trim() ? (
              <p className="text-xs text-muted-foreground">
                Token: <code>{`{${toPersonalisationToken(row.name)}}`}</code>
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={isPending} onClick={addRow} variant="secondary">
          <Plus aria-hidden className="h-4 w-4" />
          Add field
        </Button>
        <Button disabled={isPending} onClick={saveFields}>
          {isPending ? "Saving..." : "Save fields"}
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
