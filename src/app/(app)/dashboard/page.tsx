import { Activity, Bell, Bot, BriefcaseBusiness, CheckCircle2, Clock, CreditCard, FileSignature, FileText, Inbox, Mail, MessageSquare, Route, Search, Timer, Users } from "lucide-react";
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
import { getNotificationMetrics } from "@/services/notification-service";
import { getLifecycleMetrics } from "@/services/lifecycle-service";
import { getResearchMetrics } from "@/services/research-service";
import { getSalesMetrics } from "@/services/sales-service";

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
  clientMessages: number,
  unreadNotifications: number,
  lifecycleAccounts: number,
  researchRecords: number,
  activeDeals: number,
) => [
  { label: "Lifecycle accounts", value: String(lifecycleAccounts), icon: Route },
  { label: "Research records", value: String(researchRecords), icon: Search },
  { label: "Active deals", value: String(activeDeals), icon: BriefcaseBusiness },
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
  { label: "Client messages", value: String(clientMessages), icon: MessageSquare },
  { label: "Notifications", value: String(unreadNotifications), icon: Bell },
];

export default async function DashboardPage() {
  const session = await auth();
  const [activity, leadMetrics, campaignMetrics, sendingMetrics, emailMetrics, aiDrafts, discoveryMetrics, proposalMetrics, revenueMetrics, clientMetrics, portalMetrics, notificationMetrics, lifecycleMetrics, researchMetrics, salesMetrics] = session?.user.organisationId
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
        getNotificationMetrics(session.user.organisationId),
        getLifecycleMetrics(session.user.organisationId),
        getResearchMetrics(session.user.organisationId),
        getSalesMetrics(session.user.organisationId),
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
        { accesses: 0, pendingTasks: 0, signatures: 0, pdfExports: 0, unreadMessages: 0 },
        { total: 0, unread: 0 },
        {
          total: 0,
          byStage: {
            client_research: 0,
            cold_outreach: 0,
            proposal_sales: 0,
            onboarding_payment: 0,
            solution_execution: 0,
            maintenance: 0,
          },
          byStatus: {},
          dueNextActions: 0,
        },
        { total: 0, highFit: 0, incompleteChecklist: 0, byStatus: {} },
        {
          activeDeals: 0,
          totalValueCents: 0,
          weightedValueCents: 0,
          openTasks: 0,
          overdueTasks: 0,
          byStage: {
            discovery_booked: 0,
            discovery_complete: 0,
            proposal_drafted: 0,
            proposal_sent: 0,
            negotiation: 0,
            won: 0,
            lost: 0,
          },
        },
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Phase 14 account lifecycle is active. Research, outreach, sales,
            onboarding, delivery, and maintenance now share one operating spine.
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
          portalMetrics.unreadMessages,
          notificationMetrics.unread,
          lifecycleMetrics.total,
          researchMetrics.total,
          salesMetrics.activeDeals,
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
