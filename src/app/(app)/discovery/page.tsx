import Link from "next/link";
import { redirect } from "next/navigation";
import { FileQuestion, Inbox, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { CreateDiscoveryForm } from "@/components/discovery/create-discovery-form";
import { FormActions } from "@/components/discovery/form-actions";
import { SummaryAction } from "@/components/discovery/summary-action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDiscoveryMetrics,
  listDiscoveryForms,
  listDiscoveryResponses,
} from "@/services/discovery-service";
import type { DiscoveryField, DiscoveryFormStatus } from "@/types/discovery";

type DiscoveryFormView = {
  _id: { toString(): string };
  name: string;
  description?: string;
  status: DiscoveryFormStatus;
  publicSlug: string;
  fields: DiscoveryField[];
  responseCount: number;
};

type DiscoveryResponseView = {
  _id: { toString(): string };
  respondentEmail?: string;
  respondentName?: string;
  answers: Record<string, unknown>;
  submittedAt: Date;
};

export default async function DiscoveryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [forms, responses, metrics] = await Promise.all([
    listDiscoveryForms(session.user.organisationId),
    listDiscoveryResponses(session.user.organisationId),
    getDiscoveryMetrics(session.user.organisationId),
  ]);
  const formViews = forms as DiscoveryFormView[];
  const responseViews = responses as DiscoveryResponseView[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discovery</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build public discovery forms, capture responses, and generate AI
          summaries for manual review.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Forms</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <FileQuestion className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.forms}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Responses</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.responses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">AI summaries</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">Manual</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Create discovery form</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateDiscoveryForm />
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Forms</h2>
          {formViews.length > 0 ? (
            formViews.map((form) => (
              <Card key={form._id.toString()}>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{form.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {form.description ?? "No description"} · {form.fields.length} fields ·{" "}
                      {form.responseCount} responses
                    </p>
                    <Link
                      className="mt-2 inline-block text-sm font-medium text-primary"
                      href={`/d/${form.publicSlug}`}
                      target="_blank"
                    >
                      Public link
                    </Link>
                  </div>
                  <FormActions formId={form._id.toString()} status={form.status} />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {form.fields.map((field) => (
                      <span
                        className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                        key={field.id}
                      >
                        {field.label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No discovery forms yet.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent responses</h2>
          {responseViews.length > 0 ? (
            responseViews.map((response) => (
              <Card key={response._id.toString()}>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>
                      {response.respondentName ??
                        response.respondentEmail ??
                        "Anonymous response"}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(response.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <SummaryAction responseId={response._id.toString()} />
                </CardHeader>
                <CardContent>
                  <pre className="max-h-52 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(response.answers, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Discovery submissions will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
