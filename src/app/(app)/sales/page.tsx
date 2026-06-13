import { CircleDollarSign, ListTodo, TrendingUp } from "lucide-react";
import { CreateDealForm } from "@/components/sales/create-deal-form";
import {
  CompleteSalesTaskButton,
  DealStageButtons,
} from "@/components/sales/deal-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSalesMetrics,
  listDeals,
  listSalesTasks,
} from "@/services/sales-service";
import { auth } from "@/auth";
import { dealStageLabels, dealStages } from "@/types/sales";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(value?: string) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function SalesPage() {
  const session = await auth();
  const [deals, tasks, metrics] = await Promise.all([
    listDeals(session!.user.organisationId),
    listSalesTasks(session!.user.organisationId),
    getSalesMetrics(session!.user.organisationId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 16</p>
        <h1 className="text-3xl font-semibold tracking-tight">Sales Pipeline</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Track opportunities from discovery through proposal, negotiation, won,
          and lost outcomes.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active deals</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.activeDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{money(metrics.totalValueCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Weighted</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{money(metrics.weightedValueCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Open tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <ListTodo className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.openTasks}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-7">
        {dealStages.map((stage) => (
          <Card key={stage}>
            <CardHeader className="p-4">
              <CardTitle className="text-sm leading-tight">
                {dealStageLabels[stage]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-semibold">{metrics.byStage[stage]}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create deal</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateDealForm />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {deals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No deals yet. Create a deal once discovery or proposal work starts.
              </CardContent>
            </Card>
          ) : (
            deals.map((deal) => (
              <Card key={deal.id}>
                <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>{deal.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {deal.companyName} · {dealStageLabels[deal.stage]} ·{" "}
                      {deal.probability}%
                    </p>
                  </div>
                  {deal.status === "active" ? <DealStageButtons dealId={deal.id} /> : null}
                </CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Value</p>
                    <p className="font-medium">{money(deal.valueCents)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expected close</p>
                    <p className="font-medium">{formatDate(deal.expectedCloseDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next action</p>
                    <p className="font-medium">{deal.nextAction ?? "No action set"}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Card>
            <CardHeader>
              <CardTitle>Follow-up tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.filter((task) => task.status === "open").length === 0 ? (
                <p className="text-sm text-muted-foreground">No open sales tasks.</p>
              ) : (
                tasks
                  .filter((task) => task.status === "open")
                  .map((task) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
                      key={task.id}
                    >
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-muted-foreground">{formatDate(task.dueAt)}</p>
                      </div>
                      <CompleteSalesTaskButton taskId={task.id} />
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
