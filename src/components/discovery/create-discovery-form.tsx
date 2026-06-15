"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { discoveryFieldTypes } from "@/types/discovery";

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CreateDiscoveryForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const labels = lines(form.get("fieldLabels"));
    const fieldType = String(form.get("fieldType"));
    const options = lines(form.get("options"));

    startTransition(async () => {
      const response = await fetch("/api/discovery/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          status: form.get("status"),
          fields: labels.map((label, index) => ({
            id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${index}`,
            label,
            type: index === 0 ? "short_text" : fieldType,
            required: true,
            options:
              ["single_select", "multi_select"].includes(fieldType) && index > 0
                ? options
                : [],
          })),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Could not create discovery form.");
        return;
      }

      formElement.reset();
      setMessage("Discovery form created.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Form name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="published">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fieldLabels">Questions</Label>
          <Textarea
            id="fieldLabels"
            name="fieldLabels"
            placeholder="Your name&#10;What are your main objectives?&#10;What risks should we know about?"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fieldType">Question type after first question</Label>
          <Select id="fieldType" name="fieldType" defaultValue="long_text">
            {discoveryFieldTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Label htmlFor="options">Options for select questions</Label>
          <Textarea id="options" name="options" placeholder="Option A&#10;Option B" />
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        {isPending ? "Creating..." : "Create discovery form"}
      </Button>
    </form>
  );
}
