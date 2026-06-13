import { AlertTriangle, CalendarClock, HeartPulse, Ticket } from "lucide-react";
import type { ComponentType } from "react";
import {
  MaintenancePlanForm,
  MaintenanceTaskForm,
  SupportTicketForm,
} from "@/components/maintenance/maintenance-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { listClients } from "@/services/client-service";
import { listMaintenance } from "@/services/maintenance-service";

function id(value: unknown) {
  return String(value);
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function date(value?: Date | string) {
  return value ? new Date(value).toLocaleDateString() : "No date";
}

export default async function MaintenancePage() {
  const session = await auth();
  const [clients, maintenance] = await Promise.all([
    listClients(session!.user.organisationId),
    listMaintenance(session!.user.organisationId),
  ]);
  const clientOptions = clients.map((client) => ({
    id: id(client._id),
    label: client.company,
  }));
  const planOptions = maintenance.plans.map((plan) => ({
    id: id(plan._id),
    label: plan.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 19</p>
        <h1 className="text-3xl font-semibold tracking-tight">Maintenance</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Manage retainers, support tickets, recurring maintenance tasks,
          renewals, and client health after delivery.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Active plans" value={maintenance.metrics.activePlans} icon={HeartPulse} />
        <Metric label="MRR" value={money(maintenance.metrics.monthlyRecurringCents)} icon={CalendarClock} />
        <Metric label="Open tickets" value={maintenance.metrics.openTickets} icon={Ticket} />
        <Metric label="At risk" value={maintenance.metrics.atRisk} icon={AlertTriangle} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Maintenance plan</CardTitle></CardHeader>
          <CardContent><MaintenancePlanForm clients={clientOptions} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Support ticket</CardTitle></CardHeader>
          <CardContent><SupportTicketForm clients={clientOptions} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Maintenance task</CardTitle></CardHeader>
          <CardContent><MaintenanceTaskForm plans={planOptions} /></CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Plans</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {maintenance.plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance plans yet.</p>
            ) : (
              maintenance.plans.map((plan) => (
                <div className="rounded-md border border-border p-3" key={id(plan._id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.cadence} · {plan.health} · renewal {date(plan.renewalDate)}
                      </p>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {money(plan.monthlyFeeCents)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Support</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {maintenance.tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No support tickets yet.</p>
            ) : (
              maintenance.tickets.map((ticket) => (
                <div className="rounded-md border border-border p-3" key={id(ticket._id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.priority} · due {date(ticket.dueDate)}
                      </p>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Recurring tasks</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {maintenance.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No maintenance tasks yet.</p>
          ) : (
            maintenance.tasks.map((task) => (
              <div className="rounded-md border border-border p-3" key={id(task._id)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">Due {date(task.dueDate)}</p>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {task.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
