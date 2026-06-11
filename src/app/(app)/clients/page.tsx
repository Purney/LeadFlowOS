import { BriefcaseBusiness, Clock3, DollarSign, Timer, Users } from "lucide-react";
import { auth } from "@/auth";
import { ConvertLeadForm } from "@/components/clients/convert-lead-form";
import { CreateProjectForm } from "@/components/clients/create-project-form";
import { TimeEntryForm } from "@/components/clients/time-entry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getClientProjectMetrics,
  listClients,
  listProjects,
  listTimeEntries,
} from "@/services/client-service";
import { listLeads } from "@/services/lead-service";

type ClientView = {
  _id: unknown;
  company: string;
  contacts?: { name?: string; email: string; role?: string }[];
  notes?: string;
};

type ProjectView = {
  _id: unknown;
  clientId: unknown;
  name: string;
  type: string;
  status: string;
  estimatedValue: number;
  actualRevenue: number;
};

type TimeEntryView = {
  _id: unknown;
  projectId: unknown;
  clientId: unknown;
  date: Date | string;
  minutes: number;
  description: string;
};

type LeadView = {
  _id: unknown;
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  status: string;
};

function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function hours(minutes: number) {
  return `${Math.round((minutes / 60) * 10) / 10}h`;
}

function id(value: unknown) {
  return String(value);
}

export default async function ClientsPage() {
  const session = await auth();
  const organisationId = session?.user.organisationId;

  if (!organisationId || !session.user.id) {
    return null;
  }

  const [clients, projects, timeEntries, metrics, leads] = await Promise.all([
    listClients(organisationId),
    listProjects(organisationId),
    listTimeEntries(organisationId),
    getClientProjectMetrics(organisationId),
    listLeads({ organisationId }),
  ]);

  const clientRows = clients as ClientView[];
  const projectRows = projects as ProjectView[];
  const timeRows = timeEntries as TimeEntryView[];
  const leadRows = leads as LeadView[];
  const clientById = new Map(clientRows.map((client) => [id(client._id), client]));
  const projectById = new Map(projectRows.map((project) => [id(project._id), project]));
  const clientOptions = clientRows.map((client) => ({
    id: id(client._id),
    label: client.company,
  }));
  const projectOptions = projectRows.map((project) => ({
    id: id(project._id),
    clientId: id(project.clientId),
    label: `${project.name} - ${clientById.get(id(project.clientId))?.company ?? "Client"}`,
  }));
  const leadOptions = leadRows
    .filter((lead) => lead.status !== "won")
    .map((lead) => ({
      id: id(lead._id),
      label:
        [lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
        lead.company ||
        lead.email,
    }));

  const metricCards = [
    { label: "Clients", value: String(metrics.clients), icon: Users },
    { label: "Active projects", value: String(metrics.activeProjects), icon: BriefcaseBusiness },
    { label: "Time logged", value: `${metrics.totalHours}h`, icon: Timer },
    {
      label: "Effective hourly",
      value: money(metrics.effectiveHourlyRevenue),
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Convert won work into delivery, track projects, and log manual time.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <metric.icon aria-hidden className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Convert lead</CardTitle>
          </CardHeader>
          <CardContent>
            <ConvertLeadForm leads={leadOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create project</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateProjectForm clients={clientOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log time</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeEntryForm projects={projectOptions} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {clientRows.length > 0 ? (
              <div className="space-y-3">
                {clientRows.map((client) => (
                  <div className="rounded-md border border-border p-3" key={id(client._id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{client.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.contacts?.[0]?.email ?? "No contact email"}
                        </p>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {metrics.timeByClient.find((item) => item.clientId === id(client._id))
                          ? hours(
                              metrics.timeByClient.find(
                                (item) => item.clientId === id(client._id),
                              )?.minutes ?? 0,
                            )
                          : "0h"}
                      </span>
                    </div>
                    {client.notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">{client.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Converted leads and manually added clients will appear here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projectRows.length > 0 ? (
              <div className="space-y-3">
                {projectRows.map((project) => (
                  <div className="rounded-md border border-border p-3" key={id(project._id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {clientById.get(id(project.clientId))?.company ?? "Client"} ·{" "}
                          {project.type}
                        </p>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                      <span>Est. {money(project.estimatedValue)}</span>
                      <span>Revenue {money(project.actualRevenue)}</span>
                      <span>
                        {hours(
                          metrics.timeByProject.find(
                            (item) => item.projectId === id(project._id),
                          )?.minutes ?? 0,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Create a project once a client is ready for delivery.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent time</CardTitle>
        </CardHeader>
        <CardContent>
          {timeRows.length > 0 ? (
            <div className="space-y-3">
              {timeRows.slice(0, 10).map((entry) => {
                const project = projectById.get(id(entry.projectId));
                const client = clientById.get(id(entry.clientId));

                return (
                  <div
                    className="grid gap-2 rounded-md border border-border p-3 text-sm md:grid-cols-[1fr_auto_auto]"
                    key={id(entry._id)}
                  >
                    <div>
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-muted-foreground">
                        {client?.company ?? "Client"} · {project?.name ?? "Project"}
                      </p>
                    </div>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock3 aria-hidden className="h-4 w-4" />
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <span className="font-medium">{hours(entry.minutes)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Manual delivery time will appear here after the first entry.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
