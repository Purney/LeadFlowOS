import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, HeartPulse, Inbox, Send } from "lucide-react";
import { auth } from "@/auth";
import { BatchActions } from "@/components/sending/batch-actions";
import { AccountActions } from "@/components/sending/account-actions";
import { CreateEmailAccountForm } from "@/components/sending/create-email-account-form";
import { CreateSuppressionForm } from "@/components/sending/create-suppression-form";
import { GenerateBatchForm } from "@/components/sending/generate-batch-form";
import { OutboundSettingsForm } from "@/components/sending/outbound-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCampaigns } from "@/services/campaign-service";
import { getEmailMetrics, listRecentEmailEvents } from "@/services/email-service";
import {
  getSendingMetrics,
  listEmailAccounts,
  listSendBatches,
} from "@/services/sending-service";
import { getOrganisationSettings } from "@/services/organisation-service";
import { listSuppressions } from "@/services/suppression-service";
import type { SendBatchStatus, WarmupStatus } from "@/types/sending";

type AccountView = {
  _id: { toString(): string };
  email: string;
  domain: string;
  provider: string;
  verificationStatus: string;
  dailySendLimit: number;
  perDomainDailyLimit: number;
  warmupTargetDailyVolume: number;
  warmupStatus: WarmupStatus;
  warmupAgeDays: number;
  warmupRiskLevel: "blocked" | "watch" | "ready";
  reputationStatus: string;
  active: boolean;
  healthScore: number;
  recommendedVolume: number;
  warmupChecklist: {
    id: string;
    label: string;
    complete: boolean;
    severity: "blocked" | "watch";
  }[];
  health: {
    spfConfigured: boolean;
    dkimConfigured: boolean;
    dmarcConfigured: boolean;
    dmarcPolicy: string;
    forwardReverseDnsConfigured: boolean;
    tlsEnabled: boolean;
    trackingDomainConfigured: boolean;
    unsubscribeSupported: boolean;
    oneClickUnsubscribeSupported: boolean;
    blocklistDetected: boolean;
    bounceRate: number;
    spamComplaintRate: number;
    deferralRate: number;
  };
};

type BatchView = {
  _id: { toString(): string };
  subject: string;
  body: string;
  status: SendBatchStatus;
  scheduledSendTime: Date;
  estimatedVolume: number;
  riskWarnings: string[];
  variantLabel: string;
  recipients: { email: string; firstName?: string; company?: string }[];
};

export default async function SendingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [accounts, batches, metrics, campaigns, organisationSettings] = await Promise.all([
    listEmailAccounts(session.user.organisationId),
    listSendBatches(session.user.organisationId),
    getSendingMetrics(session.user.organisationId),
    listCampaigns(session.user.organisationId),
    getOrganisationSettings(session.user.organisationId),
  ]);
  const [suppressions, emailMetrics, emailEvents] = await Promise.all([
    listSuppressions(session.user.organisationId),
    getEmailMetrics(session.user.organisationId),
    listRecentEmailEvents(session.user.organisationId),
  ]);
  const accountViews = accounts as AccountView[];
  const batchViews = batches as BatchView[];
  const campaignOptions = campaigns.map((campaign) => ({
    id: campaign._id.toString(),
    name: campaign.name as string,
  }));
  const accountOptions = accountViews
    .filter((account) => account.active)
    .map((account) => ({
      id: account._id.toString(),
      email: account.email,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sending</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage sending accounts, deliverability health, warm-up visibility,
          and approval-gated send batches.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Accounts</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.accounts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.activeAccounts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Health</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <HeartPulse className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.averageHealth}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Approvals</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Send className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.pendingApprovals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Warm-up blocked</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.blockedWarmupAccounts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Watch list</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <HeartPulse className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.watchWarmupAccounts}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{emailMetrics.messages}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Replies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{emailMetrics.replies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Suppressions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{suppressions.length}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add sending account</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateEmailAccountForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generate approval batch</CardTitle>
          </CardHeader>
          <CardContent>
            <GenerateBatchForm campaigns={campaignOptions} accounts={accountOptions} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Outbound email settings</CardTitle>
        </CardHeader>
        <CardContent>
          <OutboundSettingsForm
            leadCustomFields={organisationSettings.leadCustomFields}
            outboundSettings={organisationSettings.outboundSettings}
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Suppression list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CreateSuppressionForm />
            <div className="space-y-2">
              {suppressions.slice(0, 8).map((suppression) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
                  key={suppression._id.toString()}
                >
                  <span>{suppression.email}</span>
                  <span className="text-muted-foreground">{suppression.reason}</span>
                </div>
              ))}
              {suppressions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No suppressions recorded yet.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent email events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emailEvents.map((event) => (
              <div
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
                key={event._id.toString()}
              >
                <span>{event.eventType}</span>
                <span className="text-muted-foreground">{event.email ?? "unknown"}</span>
              </div>
            ))}
            {emailEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Mailgun events will appear after webhooks are received.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Sending accounts</h2>
        {accountViews.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {accountViews.map((account) => (
              <Card key={account._id.toString()}>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{account.email}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {account.domain} · {account.provider} ·{" "}
                      {account.verificationStatus}
                    </p>
                  </div>
                  <AccountActions
                    accountId={account._id.toString()}
                    active={account.active}
                    warmupStatus={account.warmupStatus}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Health</p>
                      <p className="mt-1 text-xl font-semibold">{account.healthScore}%</p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Daily limit</p>
                      <p className="mt-1 text-xl font-semibold">{account.dailySendLimit}</p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Recommended</p>
                      <p className="mt-1 text-xl font-semibold">{account.recommendedVolume}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Risk</p>
                      <p className="mt-1 text-sm font-semibold">{account.warmupRiskLevel}</p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Age</p>
                      <p className="mt-1 text-sm font-semibold">
                        {account.warmupAgeDays} days
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Domain cap</p>
                      <p className="mt-1 text-sm font-semibold">
                        {account.perDomainDailyLimit}/day
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Reputation</p>
                      <p className="mt-1 text-sm font-semibold">
                        {account.reputationStatus}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      ["SPF", account.health.spfConfigured],
                      ["DKIM", account.health.dkimConfigured],
                      ["DMARC", account.health.dmarcConfigured],
                      ["DNS", account.health.forwardReverseDnsConfigured],
                      ["TLS", account.health.tlsEnabled],
                      ["Tracking", account.health.trackingDomainConfigured],
                      ["Unsubscribe", account.health.unsubscribeSupported],
                      ["One-click", account.health.oneClickUnsubscribeSupported],
                      ["Blocklist clear", !account.health.blocklistDetected],
                    ].map(([label, ok]) => (
                      <span
                        className={`rounded-md px-2 py-1 font-medium ${
                          ok ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                        }`}
                        key={String(label)}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="rounded-md border border-border p-4">
                    <p className="mb-3 text-sm font-medium">Warm-up checklist</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {account.warmupChecklist.map((item) => (
                        <div
                          className="flex items-center justify-between gap-3 text-sm"
                          key={item.id}
                        >
                          <span className="text-muted-foreground">{item.label}</span>
                          <span
                            className={
                              item.complete
                                ? "font-medium text-foreground"
                                : "font-medium text-destructive"
                            }
                          >
                            {item.complete ? "Ready" : item.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Add a sending account before generating approval batches.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Manual approval batches</h2>
        {batchViews.length > 0 ? (
          batchViews.map((batch) => (
            <Card key={batch._id.toString()}>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{batch.subject}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {batch.status} · {batch.variantLabel} ·{" "}
                    {new Date(batch.scheduledSendTime).toLocaleString()}
                  </p>
                </div>
                {batch.status === "pending_approval" || batch.status === "approved" ? (
                  <BatchActions batchId={batch._id.toString()} />
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                  <div className="rounded-md bg-muted p-4">
                    <p className="whitespace-pre-wrap text-sm">{batch.body}</p>
                  </div>
                  <div className="rounded-md border border-border p-4">
                    <p className="text-xs uppercase text-muted-foreground">Recipients</p>
                    <p className="mt-1 text-2xl font-semibold">{batch.estimatedVolume}</p>
                  </div>
                </div>
                {batch.riskWarnings.length > 0 ? (
                  <div className="rounded-md border border-border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Risk warnings
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {batch.riskWarnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No send batches yet. Generate one from an enrolled campaign when
              it is ready for manual review.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
