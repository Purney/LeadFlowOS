import mongoose from "mongoose";
import { Notification } from "@/models/notification";
import { connectToDatabase } from "@/lib/db";

type NotificationInput = {
  organisationId: string;
  actorUserId?: string;
  entityType: string;
  entityId?: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

export async function createNotification(input: NotificationInput) {
  await connectToDatabase();

  return Notification.create({
    ...input,
    organisationId: toObjectId(input.organisationId),
    actorUserId: input.actorUserId ? toObjectId(input.actorUserId) : undefined,
  });
}

export async function listNotifications(organisationId: string, limit = 20) {
  await connectToDatabase();

  return Notification.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getNotificationMetrics(organisationId: string) {
  await connectToDatabase();

  const [total, unread] = await Promise.all([
    Notification.countDocuments({ organisationId: toObjectId(organisationId) }),
    Notification.countDocuments({
      organisationId: toObjectId(organisationId),
      readAt: { $exists: false },
    }),
  ]);

  return { total, unread };
}
