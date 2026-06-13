"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  clientHealthStatuses,
  maintenanceCadences,
  supportTicketPriorities,
} from "@/types/maintenance";

type ClientOption = { id: string; label: string };
type PlanOption = { id: string; label: string };

async function postJson(url: string, payload: Record<string, unknown>) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function MaintenancePlanForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      await postJson("/api/maintenance/plans", {
        clientId: form.get("clientId"),
        name: form.get("name"),
        cadence: form.get("cadence"),
        monthlyFeeCents: Math.round(Number(form.get("monthlyFee") ?? 0) * 100),
        includedHours: form.get("includedHours"),
        health: form.get("health"),
        renewalDate: form.get("renewalDate") || undefined,
        nextCheckInDate: form.get("nextCheckInDate") || undefined,
        notes: form.get("notes"),
      });
      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <ClientSelect clients={clients} />
      <Input name="name" placeholder="Plan name" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select defaultValue="monthly" name="cadence">
          {maintenanceCadences.map((cadence) => <option key={cadence} value={cadence}>{cadence}</option>)}
        </Select>
        <Select defaultValue="healthy" name="health">
          {clientHealthStatuses.map((health) => <option key={health} value={health}>{health}</option>)}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input defaultValue="0" min="0" name="monthlyFee" placeholder="Monthly fee" type="number" />
        <Input defaultValue="0" min="0" name="includedHours" placeholder="Included hours" type="number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="renewalDate" type="date" />
        <Input name="nextCheckInDate" type="date" />
      </div>
      <Textarea name="notes" placeholder="Notes" />
      <Button disabled={isPending || clients.length === 0} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        Add plan
      </Button>
    </form>
  );
}

export function SupportTicketForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      await postJson("/api/maintenance/tickets", {
        clientId: form.get("clientId"),
        title: form.get("title"),
        description: form.get("description"),
        priority: form.get("priority"),
        dueDate: form.get("dueDate") || undefined,
      });
      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <ClientSelect clients={clients} />
      <Input name="title" placeholder="Ticket title" required />
      <Select defaultValue="medium" name="priority">
        {supportTicketPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </Select>
      <Input name="dueDate" type="date" />
      <Textarea name="description" placeholder="Description" />
      <Button disabled={isPending || clients.length === 0} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        Add ticket
      </Button>
    </form>
  );
}

export function MaintenanceTaskForm({ plans }: { plans: PlanOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      await postJson("/api/maintenance/tasks", {
        planId: form.get("planId"),
        title: form.get("title"),
        description: form.get("description"),
        dueDate: form.get("dueDate") || undefined,
      });
      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="planId">Plan</Label>
        <Select id="planId" name="planId" required>
          <option value="">Select plan</option>
          {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.label}</option>)}
        </Select>
      </div>
      <Input name="title" placeholder="Task title" required />
      <Input name="dueDate" type="date" />
      <Textarea name="description" placeholder="Description" />
      <Button disabled={isPending || plans.length === 0} type="submit">
        <Plus aria-hidden className="h-4 w-4" />
        Add task
      </Button>
    </form>
  );
}

function ClientSelect({ clients }: { clients: ClientOption[] }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="clientId">Client</Label>
      <Select id="clientId" name="clientId" required>
        <option value="">Select client</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.label}</option>)}
      </Select>
    </div>
  );
}
