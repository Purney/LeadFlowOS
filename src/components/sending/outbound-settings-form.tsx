"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type OutboundSettings = {
  globalSignature?: string;
  positiveAutoReplyEnabled?: boolean;
  positiveAutoReplyDelayMinutes?: number;
  positiveAutoReplySubject?: string;
  positiveAutoReplyBody?: string;
  bookingLink?: string;
};

export function OutboundSettingsForm({
  leadCustomFields,
  outboundSettings,
}: {
  leadCustomFields: { name: string; key: string }[];
  outboundSettings: OutboundSettings;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/organisation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadCustomFields,
          outboundSettings: {
            globalSignature: form.get("globalSignature"),
            positiveAutoReplyEnabled: form.get("positiveAutoReplyEnabled") === "on",
            positiveAutoReplyDelayMinutes: form.get("positiveAutoReplyDelayMinutes"),
            positiveAutoReplySubject: form.get("positiveAutoReplySubject"),
            positiveAutoReplyBody: form.get("positiveAutoReplyBody"),
            bookingLink: form.get("bookingLink"),
          },
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Outbound settings failed.");
        return;
      }

      setMessage("Outbound settings saved.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="globalSignature">Global account signature</Label>
        <Textarea
          id="globalSignature"
          name="globalSignature"
          placeholder="Best,\nYour Name"
          defaultValue={outboundSettings.globalSignature}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <div className="space-y-2">
          <Label htmlFor="bookingLink">Booking link</Label>
          <Input
            id="bookingLink"
            name="bookingLink"
            placeholder="https://cal.com/your-link"
            defaultValue={outboundSettings.bookingLink}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="positiveAutoReplyDelayMinutes">Reply window</Label>
          <Input
            id="positiveAutoReplyDelayMinutes"
            max={60}
            min={0}
            name="positiveAutoReplyDelayMinutes"
            type="number"
            defaultValue={outboundSettings.positiveAutoReplyDelayMinutes ?? 60}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          className="h-4 w-4 accent-primary"
          defaultChecked={Boolean(outboundSettings.positiveAutoReplyEnabled)}
          name="positiveAutoReplyEnabled"
          type="checkbox"
        />
        Automatically reply to positive replies with the booking-call template
      </label>
      <div className="space-y-2">
        <Label htmlFor="positiveAutoReplySubject">Positive reply subject</Label>
        <Input
          id="positiveAutoReplySubject"
          name="positiveAutoReplySubject"
          defaultValue={
            outboundSettings.positiveAutoReplySubject ?? "Re: {NORMALISED_COMPANY}"
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="positiveAutoReplyBody">Positive reply body</Label>
        <Textarea
          className="min-h-48"
          id="positiveAutoReplyBody"
          name="positiveAutoReplyBody"
          defaultValue={
            outboundSettings.positiveAutoReplyBody ??
            "Thanks {FIRST_NAME}, glad this is relevant.\n\nThe easiest next step is to book a short call so I can understand the workflow and show where automation would fit.\n\nYou can book a time here: {BOOKING_LINK}\n\n{GLOBAL_SIGNATURE}"
          }
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Available global tokens: <code>{`{GLOBAL_SIGNATURE}`}</code>,{" "}
        <code>{`{BOOKING_LINK}`}</code>. Lead and custom-field tokens also work.
      </p>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={isPending} type="submit">
        <Save aria-hidden className="h-4 w-4" />
        {isPending ? "Saving..." : "Save outbound settings"}
      </Button>
    </form>
  );
}
