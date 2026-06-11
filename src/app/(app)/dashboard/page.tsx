import { Activity, CheckCircle2, Clock, CreditCard, FileText, Inbox, Mail, Timer, Users } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeadMetrics } from "@/services/lead-service";
import { listRecentActivity } from "@/services/activity-service";

const metricCards = (leadTotal: number) => [
  { label: "Total leads", value: String(leadTotal), icon: Users },
  { label: "Active campaigns", value: "0", icon: Mail },
  { label: "Pending approvals", value: "0", icon: CheckCircle2 },
  { label: "Replies received", value: "0", icon: Inbox },
  { label: "Discovery forms awaiting completion", value: "0", icon: FileText },
  { label: "Proposal pipeline", value: "0", icon: Activity },
  { label: "Monthly revenue", value: "$0", icon: CreditCard },
  { label: "Time logged", value: "0h", icon: Timer },
];

export default async function DashboardPage() {
  const session = await auth();
  const [activity, leadMetrics] = session?.user.organisationId
    ? await Promise.all([
        listRecentActivity(session.user.organisationId),
        getLeadMetrics(session.user.organisationId),
      ])
    : [[], { total: 0, byStatus: {}, tags: [] }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Phase 2 lead management is active. Campaign, revenue, and delivery
            metrics will populate as later modules come online.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards(leadMetrics.total).map((metric) => (
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
            <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-muted/45 text-sm text-muted-foreground">
              Stripe revenue data starts in Phase 9.
            </div>
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
