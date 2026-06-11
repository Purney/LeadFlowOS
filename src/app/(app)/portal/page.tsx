import { FileSignature, FileText, ListTodo, Share2 } from "lucide-react";
import { auth } from "@/auth";
import { OnboardingTaskForm } from "@/components/portal/onboarding-task-form";
import { PdfExportForm } from "@/components/portal/pdf-export-form";
import { PortalAccessForm } from "@/components/portal/portal-access-form";
import { SignatureRequestForm } from "@/components/portal/signature-request-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listClients, listProjects } from "@/services/client-service";
import { listProposals } from "@/services/proposal-service";
import {
  getPortalMetrics,
  listOnboardingTasks,
  listPdfExports,
  listPortalAccesses,
  listSignatureRequests,
} from "@/services/portal-service";

type ClientView = {
  _id: unknown;
  company: string;
  contacts?: { name?: string; email: string }[];
};

type ProjectView = {
  _id: unknown;
  clientId: unknown;
  name: string;
};

type ProposalView = {
  _id: unknown;
  title: string;
  status: string;
};

type PortalAccessView = {
  _id: unknown;
  clientId: unknown;
  label: string;
  expiresAt?: Date | string;
  lastViewedAt?: Date | string;
};

type OnboardingTaskView = {
  _id: unknown;
  clientId: unknown;
  title: string;
  status: string;
  dueDate?: Date | string;
};

type SignatureRequestView = {
  _id: unknown;
  clientId: unknown;
  title: string;
  signerEmail: string;
  status: string;
  signedAt?: Date | string;
};

type PdfExportView = {
  _id: unknown;
  clientId?: unknown;
  title: string;
  status: string;
  createdAt: Date | string;
};

function id(value: unknown) {
  return String(value);
}

function date(value?: Date | string) {
  return value ? new Date(value).toLocaleDateString() : "None";
}

export default async function PortalPage() {
  const session = await auth();
  const organisationId = session?.user.organisationId;

  if (!organisationId) {
    return null;
  }

  const [
    clients,
    projects,
    proposals,
    accesses,
    tasks,
    signatures,
    pdfExports,
    metrics,
  ] = await Promise.all([
    listClients(organisationId),
    listProjects(organisationId),
    listProposals(organisationId),
    listPortalAccesses(organisationId),
    listOnboardingTasks(organisationId),
    listSignatureRequests(organisationId),
    listPdfExports(organisationId),
    getPortalMetrics(organisationId),
  ]);

  const clientRows = clients as ClientView[];
  const projectRows = projects as ProjectView[];
  const proposalRows = proposals as ProposalView[];
  const accessRows = accesses as PortalAccessView[];
  const taskRows = tasks as OnboardingTaskView[];
  const signatureRows = signatures as SignatureRequestView[];
  const exportRows = pdfExports as PdfExportView[];
  const clientById = new Map(clientRows.map((client) => [id(client._id), client]));
  const clientOptions = clientRows.map((client) => ({
    id: id(client._id),
    label: client.company,
    email: client.contacts?.[0]?.email,
    contactName: client.contacts?.[0]?.name,
  }));
  const projectOptions = projectRows.map((project) => ({
    id: id(project._id),
    clientId: id(project.clientId),
    label: `${project.name} - ${clientById.get(id(project.clientId))?.company ?? "Client"}`,
  }));
  const proposalOptions = proposalRows.map((proposal) => ({
    id: id(proposal._id),
    label: `${proposal.title} (${proposal.status})`,
  }));
  const metricCards = [
    { label: "Portal links", value: String(metrics.accesses), icon: Share2 },
    { label: "Open tasks", value: String(metrics.pendingTasks), icon: ListTodo },
    { label: "Open signatures", value: String(metrics.signatures), icon: FileSignature },
    { label: "PDF exports", value: String(metrics.pdfExports), icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Client portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provision secure portal links, coordinate onboarding, collect signatures,
          and generate PDF-ready proposal exports.
        </p>
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

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portal access</CardTitle>
          </CardHeader>
          <CardContent>
            <PortalAccessForm clients={clientOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding task</CardTitle>
          </CardHeader>
          <CardContent>
            <OnboardingTaskForm clients={clientOptions} projects={projectOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature request</CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureRequestForm clients={clientOptions} proposals={proposalOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PDF-ready export</CardTitle>
          </CardHeader>
          <CardContent>
            <PdfExportForm clients={clientOptions} proposals={proposalOptions} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent portal links</CardTitle>
          </CardHeader>
          <CardContent>
            {accessRows.length > 0 ? (
              <div className="space-y-3">
                {accessRows.slice(0, 6).map((access) => (
                  <div className="rounded-md border border-border p-3" key={id(access._id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{access.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {clientById.get(id(access.clientId))?.company ?? "Client"}
                        </p>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        expires {date(access.expiresAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last viewed {date(access.lastViewedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Create a portal link after a lead becomes a client.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding queue</CardTitle>
          </CardHeader>
          <CardContent>
            {taskRows.length > 0 ? (
              <div className="space-y-3">
                {taskRows.slice(0, 8).map((task) => (
                  <div className="rounded-md border border-border p-3" key={id(task._id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {clientById.get(id(task.clientId))?.company ?? "Client"}
                        </p>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {task.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Due {date(task.dueDate)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Onboarding tasks will appear here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature requests</CardTitle>
          </CardHeader>
          <CardContent>
            {signatureRows.length > 0 ? (
              <div className="space-y-3">
                {signatureRows.slice(0, 8).map((signature) => (
                  <div className="rounded-md border border-border p-3" key={id(signature._id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{signature.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {signature.signerEmail}
                        </p>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {signature.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Signed {date(signature.signedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Signature requests will appear here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PDF-ready exports</CardTitle>
          </CardHeader>
          <CardContent>
            {exportRows.length > 0 ? (
              <div className="space-y-3">
                {exportRows.slice(0, 8).map((pdfExport) => (
                  <div className="rounded-md border border-border p-3" key={id(pdfExport._id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{pdfExport.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {pdfExport.clientId
                            ? clientById.get(id(pdfExport.clientId))?.company
                            : "General document"}
                        </p>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {pdfExport.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Generated {date(pdfExport.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Generated exports will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
