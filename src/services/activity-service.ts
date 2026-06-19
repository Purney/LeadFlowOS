import { connectToDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { createNotification } from "@/services/notification-service";

type ActivityInput = {
  organisationId: string;
  actorUserId?: string;
  entityType: string;
  entityId?: string;
  action: string;
  metadata?: Record<string, unknown>;
};

export async function createActivity(input: ActivityInput) {
  await connectToDatabase();
  const activity = await ActivityLog.create(input);
  const notification = notificationForAction(input.action);

  if (notification) {
    await createNotification({
      organisationId: input.organisationId,
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
      ...notification,
    });
  }

  return activity;
}

export async function listRecentActivity(organisationId: string, limit = 8) {
  await connectToDatabase();

  return ActivityLog.find({ organisationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

function notificationForAction(action: string) {
  const map: Record<string, { type: string; title: string; body?: string }> = {
    "discovery_response.submitted": {
      type: "discovery_submitted",
      title: "Discovery response submitted",
    },
    "proposal.accepted": {
      type: "proposal_accepted",
      title: "Proposal accepted",
    },
    "payment.received": {
      type: "payment_received",
      title: "Payment received",
    },
    "webhook.failed": {
      type: "webhook_failure",
      title: "Webhook failed",
    },
  };

  return map[action];
}
