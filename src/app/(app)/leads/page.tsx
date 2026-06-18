import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { auth } from "@/auth";
import { CreateLeadForm } from "@/components/leads/create-lead-form";
import { ImportLeadsForm } from "@/components/leads/import-leads-form";
import { LeadFieldSettingsForm } from "@/components/leads/lead-field-settings-form";
import { LeadCustomFields } from "@/components/leads/lead-custom-fields";
import { LeadActions } from "@/components/leads/lead-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getLeadMetrics, listLeads } from "@/services/lead-service";
import { getOrganisationSettings } from "@/services/organisation-service";
import { leadStatuses, type LeadStatus } from "@/types/lead";

type LeadsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: LeadStatus | "all";
    tag?: string;
  }>;
};

type LeadView = {
  _id: { toString(): string };
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  role?: string;
  tags: string[];
  notes?: string;
  source?: string;
  status: LeadStatus;
  customFields?: Record<string, unknown>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const filters = {
    search: params.search,
    status: params.status ?? "all",
    tag: params.tag,
  };
  const [leads, metrics] = await Promise.all([
    listLeads({ organisationId: session.user.organisationId }, filters),
    getLeadMetrics(session.user.organisationId),
  ]);
  const organisationSettings = await getOrganisationSettings(
    session.user.organisationId,
  );
  const viewLeads: LeadView[] = leads.map((lead) => ({
    ...lead,
    tags: Array.isArray(lead.tags) ? (lead.tags as string[]) : [],
    status: lead.status as LeadStatus,
  })) as LeadView[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage lead records, imports, deduplication, search, filters, tags,
          notes, source tracking, and lifecycle status.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.byStatus.qualified ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Won</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.byStatus.won ?? 0}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create lead</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateLeadForm
              leadCustomFields={organisationSettings.leadCustomFields}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CSV import</CardTitle>
          </CardHeader>
          <CardContent>
            <ImportLeadsForm />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Lead field settings</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadFieldSettingsForm
            leadCustomFields={organisationSettings.leadCustomFields}
            outboundSettings={organisationSettings.outboundSettings}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead database</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search
                aria-hidden
                className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              />
              <Input
                className="pl-9"
                defaultValue={filters.search ?? ""}
                name="search"
                placeholder="Search name, email, company, role, source"
              />
            </div>
            <Select defaultValue={filters.status} name="status">
              <option value="all">All statuses</option>
              {leadStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Select defaultValue={filters.tag ?? ""} name="tag">
              <option value="">All tags</option>
              {metrics.tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Select>
            <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
              Filter
            </button>
          </form>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Custom fields</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {viewLeads.length > 0 ? (
                  viewLeads.map((lead) => (
                    <tr key={lead._id.toString()}>
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium">
                          {[lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
                            lead.email}
                        </p>
                        <p className="text-muted-foreground">{lead.email}</p>
                        {lead.phone ? (
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p>{lead.company ?? "Unassigned"}</p>
                        {lead.role ? (
                          <p className="text-xs text-muted-foreground">{lead.role}</p>
                        ) : null}
                        {lead.website ? (
                          <Link
                            className="text-xs font-medium text-primary"
                            href={lead.website}
                            target="_blank"
                          >
                            Website
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {lead.tags?.length ? (
                            lead.tags.map((tag) => (
                              <span
                                className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground"
                                key={tag}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        {lead.source ?? "Manual"}
                      </td>
                      <td className="max-w-56 px-4 py-3 align-top text-muted-foreground">
                        <p className="line-clamp-3">{lead.notes ?? "No notes"}</p>
                      </td>
                      <td className="min-w-96 px-4 py-3 align-top">
                        <LeadCustomFields
                          customFields={lead.customFields ?? {}}
                          fieldDefinitions={organisationSettings.leadCustomFields}
                          leadId={lead._id.toString()}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <LeadActions
                          leadId={lead._id.toString()}
                          status={lead.status}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-muted-foreground"
                      colSpan={7}
                    >
                      No leads match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
