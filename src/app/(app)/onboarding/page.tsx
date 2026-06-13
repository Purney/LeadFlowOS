import { CreditCard, DoorOpen, ListChecks, Rocket } from "lucide-react";
import { auth } from "@/auth";
import { CreateHandoffForm } from "@/components/handoffs/create-handoff-form";
import {
  MarkPaymentPaidButton,
  MarkReadyButton,
} from "@/components/handoffs/handoff-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getHandoffMetrics,
  listOnboardingHandoffs,
} from "@/services/handoff-service";
import { listDeals } from "@/services/sales-service";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function OnboardingPage() {
  const session = await auth();
  const [handoffs, deals, metrics] = await Promise.all([
    listOnboardingHandoffs(session!.user.organisationId),
    listDeals(session!.user.organisationId),
    getHandoffMetrics(session!.user.organisationId),
  ]);
  const handedDealIds = new Set(handoffs.map((handoff) => handoff.dealId));
  const wonDealOptions = deals
    .filter((deal) => deal.status === "won" && !handedDealIds.has(deal.id))
    .map((deal) => ({
      id: deal.id,
      label: `${deal.companyName} - ${deal.title}`,
      valueCents: deal.valueCents,
    }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 17</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Onboarding & Payment
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Convert won deals into client onboarding handoffs with project setup,
          portal access, task automation, signature requests, and payment gates.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Handoffs</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Payment pending</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.paymentPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Ready</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <DoorOpen className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.ready}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">In progress</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.byStatus.in_progress ?? 0}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create handoff</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateHandoffForm deals={wonDealOptions} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {handoffs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No onboarding handoffs yet. Mark a sales deal as won, then create
                a handoff here.
              </CardContent>
            </Card>
          ) : (
            handoffs.map((handoff) => (
              <Card key={handoff.id}>
                <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>Client handoff</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Status: {handoff.status.replaceAll("_", " ")} · Payment:{" "}
                      {handoff.paymentStatus.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {handoff.paymentStatus === "pending" ? (
                      <MarkPaymentPaidButton handoffId={handoff.id} />
                    ) : null}
                    {handoff.status !== "ready_for_execution" ? (
                      <MarkReadyButton handoffId={handoff.id} />
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Payment due</p>
                    <p className="font-medium">{money(handoff.paymentDueCents)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tasks created</p>
                    <p className="font-medium">{handoff.onboardingTasksCreated}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Portal access</p>
                    <p className="font-medium">
                      {handoff.portalAccessId ? "Created" : "Not created"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
