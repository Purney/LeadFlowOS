import Link from "next/link";
import { AlertTriangle, ArrowRight, CircleAlert, Gauge, Info } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCommandCenter } from "@/services/command-service";
import type { CommandSeverity } from "@/types/command";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function severityTone(severity: CommandSeverity) {
  if (severity === "critical") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
}

function SeverityIcon({ severity }: { severity: CommandSeverity }) {
  if (severity === "critical") return <CircleAlert aria-hidden className="h-4 w-4" />;
  if (severity === "warning") return <AlertTriangle aria-hidden className="h-4 w-4" />;
  return <Info aria-hidden className="h-4 w-4" />;
}

export default async function CommandPage() {
  const session = await auth();
  const command = await getCommandCenter(session!.user.organisationId);
  const metrics = [
    ["Lifecycle accounts", command.metrics.lifecycleAccounts],
    ["Research records", command.metrics.researchRecords],
    ["Active deals", command.metrics.activeDeals],
    ["Weighted pipeline", money(command.metrics.weightedPipelineCents)],
    ["Onboarding handoffs", command.metrics.onboardingHandoffs],
    ["Execution tasks", command.metrics.executionOpenTasks],
    ["Maintenance plans", command.metrics.maintenancePlans],
    ["Maintenance MRR", money(command.metrics.maintenanceMrrCents)],
    ["Monthly revenue", money(command.metrics.monthlyRevenueCents)],
    ["Portal messages", command.metrics.unreadPortalMessages],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Phase 20</p>
          <h1 className="text-3xl font-semibold tracking-tight">Command Center</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            One executive view for what needs attention across research,
            sales, onboarding, execution, maintenance, revenue, and the client
            portal.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md border border-border bg-card px-3 py-2">
            <p className="text-muted-foreground">Critical</p>
            <p className="text-xl font-semibold">{command.criticalCount}</p>
          </div>
          <div className="rounded-md border border-border bg-card px-3 py-2">
            <p className="text-muted-foreground">Warnings</p>
            <p className="text-xl font-semibold">{command.warningCount}</p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Next Best Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {command.actions.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed border-border text-center">
                <Gauge aria-hidden className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No urgent operating actions</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  The command center will surface overdue work, approval gates,
                  delivery risks, support issues, and renewal signals here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {command.actions.map((item) => (
                  <Link
                    className={`flex items-start justify-between gap-4 rounded-md border p-4 ${severityTone(item.severity)}`}
                    href={item.href}
                    key={item.id}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <SeverityIcon severity={item.severity} />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-sm opacity-80">{item.detail}</p>
                        <p className="mt-2 text-xs uppercase">{item.area}</p>
                      </div>
                    </div>
                    <ArrowRight aria-hidden className="mt-1 h-4 w-4 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {metrics.map(([label, value]) => (
              <div className="rounded-md border border-border p-3" key={label}>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
