import { notFound } from "next/navigation";
import { PublicMessageForm } from "@/components/portal/public-message-form";
import { PublicSignatureForm } from "@/components/portal/public-signature-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicPortal } from "@/services/portal-service";
import { sanitizeRichHtml } from "@/utils/html";

type PortalPageProps = {
  params: Promise<{ token: string }>;
};

type ProjectView = {
  _id: unknown;
  name: string;
  type: string;
  status: string;
  health?: string;
  progressPercent?: number;
  clientVisibleSummary?: string;
};

type TaskView = {
  _id: unknown;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date | string;
};

type SignatureView = {
  _id: unknown;
  title: string;
  signerName: string;
  signerEmail: string;
  termsMarkdown: string;
  status: string;
  signedAt?: Date | string;
};

type PdfExportView = {
  _id: unknown;
  title: string;
  html: string;
};

type MessageView = {
  _id: unknown;
  authorType: string;
  authorName: string;
  body: string;
  createdAt: Date | string;
};

type MilestoneView = {
  _id: unknown;
  projectId: unknown;
  title: string;
  status: string;
  dueDate?: Date | string;
};

type DeliverableView = {
  _id: unknown;
  projectId: unknown;
  title: string;
  description?: string;
  url?: string;
  status: string;
};

function id(value: unknown) {
  return String(value);
}

function date(value?: Date | string) {
  return value ? new Date(value).toLocaleDateString() : "No date";
}

export default async function PublicPortalPage({ params }: PortalPageProps) {
  const { token } = await params;
  const portal = await getPublicPortal(token);

  if (!portal) {
    notFound();
  }

  const projects = portal.projects as ProjectView[];
  const tasks = portal.tasks as TaskView[];
  const signatures = portal.signatures as SignatureView[];
  const pdfExports = portal.pdfExports as PdfExportView[];
  const messages = portal.messages as MessageView[];
  const milestones = portal.milestones as MilestoneView[];
  const deliverables = portal.deliverables as DeliverableView[];
  const projectOptions = projects.map((project) => ({
    id: id(project._id),
    label: project.name,
  }));

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">LeadFlow OS</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {portal.client.company} portal
          </h1>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{projects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Open tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {tasks.filter((task) => task.status !== "completed").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Signatures</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {signatures.filter((signature) => signature.status === "sent").length}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div className="rounded-md border border-border p-3" key={id(project._id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.type}</p>
                        {project.clientVisibleSummary ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {project.clientVisibleSummary}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          {project.progressPercent ?? 0}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {project.status} · {project.health ?? "on track"}
                    </p>
                  </div>
                ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Project updates will appear here.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div className="rounded-md border border-border p-3" key={id(task._id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          ) : null}
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
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length > 0 ? (
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div className="rounded-md border border-border p-3" key={id(milestone._id)}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{milestone.title}</p>
                        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          {milestone.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Due {date(milestone.dueDate)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Delivery milestones will appear here.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deliverables</CardTitle>
            </CardHeader>
            <CardContent>
              {deliverables.length > 0 ? (
                <div className="space-y-3">
                  {deliverables.map((deliverable) => (
                    <div className="rounded-md border border-border p-3" key={id(deliverable._id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{deliverable.title}</p>
                          {deliverable.description ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {deliverable.description}
                            </p>
                          ) : null}
                        </div>
                        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          {deliverable.status}
                        </span>
                      </div>
                      {deliverable.url ? (
                        <a className="mt-2 inline-flex text-sm font-medium text-primary" href={deliverable.url}>
                          Open deliverable
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Approved or delivered work will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Signature requests</CardTitle>
          </CardHeader>
          <CardContent>
            {signatures.length > 0 ? (
              <div className="space-y-4">
                {signatures.map((signature) => (
                  <div className="rounded-md border border-border p-4" key={id(signature._id)}>
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
                    <p className="mt-3 whitespace-pre-wrap text-sm">
                      {signature.termsMarkdown}
                    </p>
                    {signature.status === "sent" ? (
                      <PublicSignatureForm
                        token={token}
                        requestId={id(signature._id)}
                        signerName={signature.signerName}
                      />
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Signed {date(signature.signedAt)}
                      </p>
                    )}
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
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {pdfExports.length > 0 ? (
              <div className="space-y-3">
                {pdfExports.map((pdfExport) => (
                  <details className="rounded-md border border-border p-3" key={id(pdfExport._id)}>
                    <summary className="cursor-pointer font-medium">{pdfExport.title}</summary>
                    <div
                      className="prose prose-sm mt-3 max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(pdfExport.html) }}
                    />
                    <a
                      className="mt-3 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      href={`/api/public/portal/${token}/pdf-exports/${id(pdfExport._id)}/download`}
                    >
                      Download PDF
                    </a>
                  </details>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Shared PDF-ready documents will appear here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <PublicMessageForm token={token} projects={projectOptions} />
            {messages.length > 0 ? (
              <div className="mt-6 space-y-3">
                {messages.map((message) => (
                  <div className="rounded-md border border-border p-3" key={id(message._id)}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{message.authorName}</p>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {message.authorType}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {date(message.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
