import { getCampaignMetrics } from "@/services/campaign-service";
import { getExecutionMetrics } from "@/services/execution-service";
import { getHandoffMetrics } from "@/services/handoff-service";
import { getLifecycleMetrics } from "@/services/lifecycle-service";
import { getMaintenanceMetrics } from "@/services/maintenance-service";
import { getPortalMetrics } from "@/services/portal-service";
import { getResearchMetrics } from "@/services/research-service";
import { getRevenueMetrics } from "@/services/revenue-service";
import { getSalesMetrics } from "@/services/sales-service";
import { getSendingMetrics } from "@/services/sending-service";
import type { CommandAction, CommandArea, CommandSeverity } from "@/types/command";

function action(
  id: string,
  area: CommandArea,
  severity: CommandSeverity,
  title: string,
  detail: string,
  href: string,
): CommandAction {
  return { id, area, severity, title, detail, href };
}

function score(severity: CommandSeverity) {
  if (severity === "critical") return 3;
  if (severity === "warning") return 2;
  return 1;
}

export async function getCommandCenter(organisationId: string) {
  const [
    lifecycle,
    research,
    campaigns,
    sending,
    sales,
    handoffs,
    execution,
    maintenance,
    revenue,
    portal,
  ] = await Promise.all([
    getLifecycleMetrics(organisationId),
    getResearchMetrics(organisationId),
    getCampaignMetrics(organisationId),
    getSendingMetrics(organisationId),
    getSalesMetrics(organisationId),
    getHandoffMetrics(organisationId),
    getExecutionMetrics(organisationId),
    getMaintenanceMetrics(organisationId),
    getRevenueMetrics(organisationId),
    getPortalMetrics(organisationId),
  ]);

  const actions: CommandAction[] = [];

  if (lifecycle.dueNextActions > 0) {
    actions.push(
      action(
        "due-lifecycle-actions",
        "research",
        "warning",
        "Lifecycle actions are due",
        `${lifecycle.dueNextActions} account next actions are due or overdue.`,
        "/accounts",
      ),
    );
  }
  if (research.incompleteChecklist > 0) {
    actions.push(
      action(
        "research-checklists-open",
        "research",
        "info",
        "Research checklists need completion",
        `${research.incompleteChecklist} target accounts still have open checklist work.`,
        "/research",
      ),
    );
  }
  if (sending.pendingApprovals > 0) {
    actions.push(
      action(
        "send-approvals",
        "outreach",
        "critical",
        "Outbound batches need approval",
        `${sending.pendingApprovals} send batches are waiting for manual approval.`,
        "/sending",
      ),
    );
  }
  if (sales.overdueTasks > 0) {
    actions.push(
      action(
        "sales-overdue-tasks",
        "sales",
        "critical",
        "Sales follow-ups are overdue",
        `${sales.overdueTasks} sales tasks are overdue.`,
        "/sales",
      ),
    );
  }
  if (handoffs.paymentPending > 0) {
    actions.push(
      action(
        "handoff-payment-pending",
        "onboarding",
        "warning",
        "Kickoff payments are pending",
        `${handoffs.paymentPending} onboarding handoffs are waiting on payment.`,
        "/onboarding",
      ),
    );
  }
  if (execution.blockedTasks > 0 || execution.overdueMilestones > 0) {
    actions.push(
      action(
        "execution-risk",
        "execution",
        execution.blockedTasks > 0 ? "critical" : "warning",
        "Delivery work needs attention",
        `${execution.blockedTasks} blocked tasks and ${execution.overdueMilestones} overdue milestones.`,
        "/execution",
      ),
    );
  }
  if (maintenance.urgentTickets > 0 || maintenance.atRisk > 0) {
    actions.push(
      action(
        "maintenance-risk",
        "maintenance",
        maintenance.urgentTickets > 0 ? "critical" : "warning",
        "Maintenance clients need attention",
        `${maintenance.urgentTickets} urgent tickets and ${maintenance.atRisk} at-risk maintenance plans.`,
        "/maintenance",
      ),
    );
  }
  if (maintenance.renewals > 0) {
    actions.push(
      action(
        "maintenance-renewals",
        "maintenance",
        "info",
        "Renewals are approaching",
        `${maintenance.renewals} maintenance renewals are due within 45 days.`,
        "/maintenance",
      ),
    );
  }
  if (portal.unreadMessages > 0) {
    actions.push(
      action(
        "portal-unread",
        "portal",
        "warning",
        "Client portal messages are unread",
        `${portal.unreadMessages} client messages need review.`,
        "/portal",
      ),
    );
  }

  const orderedActions = actions.sort((a, b) => score(b.severity) - score(a.severity));

  return {
    metrics: {
      lifecycleAccounts: lifecycle.total,
      researchRecords: research.total,
      activeCampaigns: campaigns.active,
      pendingApprovals: sending.pendingApprovals,
      activeDeals: sales.activeDeals,
      weightedPipelineCents: sales.weightedValueCents,
      onboardingHandoffs: handoffs.total,
      executionOpenTasks: execution.openTasks,
      maintenancePlans: maintenance.activePlans,
      maintenanceMrrCents: maintenance.monthlyRecurringCents,
      monthlyRevenueCents: revenue.monthlyRevenue,
      unreadPortalMessages: portal.unreadMessages,
    },
    actions: orderedActions,
    criticalCount: orderedActions.filter((item) => item.severity === "critical").length,
    warningCount: orderedActions.filter((item) => item.severity === "warning").length,
  };
}
