import { Activity, Bot, CheckCircle2, Clock, CreditCard, FileSignature, FileText, Inbox, Mail, Timer, Users } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAiDrafts } from "@/services/ai-service";
import { getCampaignMetrics } from "@/services/campaign-service";
import { getClientProjectMetrics } from "@/services/client-service";
import { getDiscoveryMetrics } from "@/services/discovery-service";
import { getEmailMetrics } from "@/services/email-service";
import { getLeadMetrics } from "@/services/lead-service";
import { listRecentActivity } from "@/services/activity-service";
import { getSendingMetrics } from "@/services/sending-service";
import { getProposalMetrics } from "@/services/proposal-service";
import { getRevenueMetrics } from "@/services/revenue-service";
import { getPortalMetrics } from "@/services/portal-service";

function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

const metricCards = (
  leadTotal: number,
  activeCampaigns: number,
  pendingApprovals: number,
  replies: number,
  aiDrafts: number,
  discoveryResponses: number,
  proposals: number,
  monthlyRevenue: number,
  timeHours: number,
  openSignatures: number,
) => [
  { label: "Total leads", value: String(leadTotal), icon: Users },
  { label: "Active campaigns", value: String(activeCampaigns), icon: Mail },
  { label: "Pending approvals", value: String(pendingApprovals), icon: CheckCircle2 },
  { label: "Replies received", value: String(replies), icon: Inbox },
  { label: "AI drafts", value: String(aiDrafts), icon: Bot },
  { label: "Discovery responses", value: String(discoveryResponses), icon: FileText },
  { label: "Proposal pipeline", value: String(proposals), icon: Activity },
  { label: "Monthly revenue", value: money(monthlyRevenue), icon: CreditCard },
  { label: "Time logged", value: `${timeHours}h`, icon: Timer },
  { label: "Open signatures", value: String(openSignatures), icon: FileSignature },
];

export default async function DashboardPage() {
  const session = await auth();
  const [activity, leadMetrics, campaignMetrics, sendingMetrics, emailMetrics, aiDrafts, discoveryMetrics, proposalMetrics, revenueMetrics, clientMetrics, portalMetrics] = session?.user.organisationId
    ? await Promise.all([
        listRecentActivity(session.user.organisationId),
        getLeadMetrics(session.user.organisationId),
        getCampaignMetrics(session.user.organisationId),
        getSendingMetrics(session.user.organisationId),
        getEmailMetrics(session.user.organisationId),
        listAiDrafts(session.user.organisationId),
        getDiscoveryMetrics(session.user.organisationId),
        getProposalMetrics(session.user.organisationId),
        getRevenueMetrics(session.user.organisationId),
        getClientProjectMetrics(session.user.organisationId),
        getPortalMetrics(session.user.organisationId),
      ])
    : [
        [],
        { total: 0, byStatus: {}, tags: [] },
        { total: 0, active: 0 },
        { accounts: 0, activeAccounts: 0, pendingApprovals: 0, averageHealth: 0 },
        { messages: 0, replies: 0, events: 0 },
        [],
        { forms: 0, responses: 0 },
        { total: 0, byStatus: {} },
        {
          monthlyRevenue: 0,
          lifetimeValue: 0,
          paidCount: 0,
          unpaidCount: 0,
          paidVsUnpaid: { paid: 0, unpaid: 0 },
          revenueByCustomer: [],
          revenueTrend: [],
        },
        {
          clients: 0,
          projects: 0,
          activeProjects: 0,
          totalMinutes: 0,
          totalHours: 0,
          effectiveHourlyRevenue: 0,
          timeByClient: [],
          timeByProject: [],
        },
        { accesses: 0, pendingTasks: 0, signatures: 0, pdfExports: 0 },
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Phase 11 client portal foundations are active. Client delivery,
            signatures, onboarding, revenue, and time share one operating view.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards(
          leadMetrics.total,
          campaignMetrics.active,
          sendingMetrics.pendingApprovals,
          emailMetrics.replies,
          aiDrafts.length,
          discoveryMetrics.responses,
          proposalMetrics.total,
          revenueMetrics.monthlyRevenue,
          clientMetrics.totalHours,
          portalMetrics.signatures,
        ).map((metric) => (
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

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueMetrics.revenueTrend.length > 0 ? (
              <div className="space-y-3">
                {revenueMetrics.revenueTrend.map((point) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                    key={point.month}
                  >
                    <span>{point.month}</span>
                    <span className="font-medium">{money(point.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-muted/45 text-sm text-muted-foreground">
                Paid Stripe invoices will appear here.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div className="flex gap-3" key={item._id.toString()}>
                    <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Activity will appear here as setup, imports, emails, replies,
                payments, and time entries are recorded.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
