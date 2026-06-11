"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ImportLeadsForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "import",
          csv: form.get("csv"),
          source: form.get("source"),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | {
            error?: string;
            parsed?: number;
            created?: number;
            skippedInvalid?: number;
            skippedDuplicates?: string[];
          }
        | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Import failed.");
        return;
      }

      setMessage(
        `Imported ${body?.created ?? 0} of ${body?.parsed ?? 0} rows. ${
          body?.skippedInvalid ? `${body.skippedInvalid} invalid. ` : ""
        }${
          body?.skippedDuplicates?.length
            ? `${body.skippedDuplicates.length} duplicate.`
            : ""
        }`,
      );
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="importSource">Import source</Label>
        <Input id="importSource" name="source" placeholder="Apollo export" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="csv">CSV</Label>
        <Textarea
          id="csv"
          name="csv"
          placeholder="firstName,lastName,email,company,website,role,tags&#10;Ada,Lovelace,ada@example.com,Analytical Engines Ltd,https://example.com,Founder,ai;automation"
          required
        />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={isPending} type="submit" variant="secondary">
        <Upload aria-hidden className="h-4 w-4" />
        {isPending ? "Importing..." : "Import CSV"}
      </Button>
    </form>
  );
}
