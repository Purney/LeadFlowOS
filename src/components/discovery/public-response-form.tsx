"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DiscoveryField } from "@/types/discovery";

export function PublicResponseForm({
  publicSlug,
  fields,
}: {
  publicSlug: string;
  fields: DiscoveryField[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const answers = Object.fromEntries(
      fields.map((field) => {
        if (field.type === "multi_select") {
          return [field.id, form.getAll(field.id)];
        }
        return [field.id, form.get(field.id)];
      }),
    );

    startTransition(async () => {
      const response = await fetch(`/api/public/discovery/${publicSlug}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respondentEmail: form.get("respondentEmail") || undefined,
          respondentName: form.get("respondentName") || undefined,
          answers,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string; errors?: string[] }
        | null;

      if (!response.ok) {
        setMessage(body?.errors?.join(" ") ?? body?.error ?? "Submission failed.");
        return;
      }

      formElement.reset();
      setMessage("Response submitted. Thank you.");
    });
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="respondentName">Name</Label>
          <Input id="respondentName" name="respondentName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="respondentEmail">Email</Label>
          <Input id="respondentEmail" name="respondentEmail" type="email" />
        </div>
      </div>
      {fields.map((field) => (
        <div className="space-y-2" key={field.id}>
          <Label htmlFor={field.id}>{field.label}</Label>
          {field.type === "long_text" ? (
            <Textarea id={field.id} name={field.id} required={field.required} />
          ) : field.type === "single_select" ? (
            <Select id={field.id} name={field.id} required={field.required}>
              <option value="">Select</option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          ) : field.type === "multi_select" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {field.options.map((option) => (
                <label className="flex items-center gap-2 text-sm" key={option}>
                  <input name={field.id} type="checkbox" value={option} />
                  {option}
                </label>
              ))}
            </div>
          ) : (
            <Input
              id={field.id}
              name={field.id}
              required={field.required}
              type={field.type === "date" ? "date" : field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
            />
          )}
        </div>
      ))}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending} type="submit">
        {isPending ? "Submitting..." : "Submit response"}
      </Button>
    </form>
  );
}
