import { connectToDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";

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
  return ActivityLog.create(input);
}

export async function listRecentActivity(organisationId: string, limit = 8) {
  await connectToDatabase();

  return ActivityLog.find({ organisationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
