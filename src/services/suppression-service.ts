import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/models/lead";
import { Suppression } from "@/models/suppression";
import { createActivity } from "@/services/activity-service";
import {
  suppressionInputSchema,
  type SuppressionInput,
} from "@/validation/suppression";

type ActorContext = {
  organisationId: string;
  userId?: string;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

export async function listSuppressions(organisationId: string) {
  await connectToDatabase();

  return Suppression.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createSuppression(
  context: ActorContext,
  input: SuppressionInput,
) {
  const data = suppressionInputSchema.parse(input);
  await connectToDatabase();

  const suppression = await Suppression.findOneAndUpdate(
    {
      organisationId: toObjectId(context.organisationId),
      email: data.email,
    },
    {
      $set: {
        ...data,
        organisationId: toObjectId(context.organisationId),
        ...(context.userId ? { createdByUserId: toObjectId(context.userId) } : {}),
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "suppression",
    entityId: suppression._id.toString(),
    action: "suppression.created",
    metadata: { email: data.email, reason: data.reason },
  });

  return suppression;
}

export async function getSuppressedEmailSet(
  organisationId: string,
  emails: string[],
) {
  await connectToDatabase();

  const suppressions = await Suppression.find({
    organisationId: toObjectId(organisationId),
    email: { $in: emails.map((email) => email.toLowerCase()) },
  })
    .select("email")
    .lean();

  return new Set(suppressions.map((suppression) => suppression.email));
}

export async function isLeadSendable(organisationId: string, email: string) {
  await connectToDatabase();

  const [suppression, lead] = await Promise.all([
    Suppression.exists({
      organisationId: toObjectId(organisationId),
      email: email.toLowerCase(),
    }),
    Lead.findOne({
      organisationId: toObjectId(organisationId),
      email: email.toLowerCase(),
    })
      .select("status")
      .lean(),
  ]);

  return !suppression && lead?.status !== "replied" && lead?.status !== "won";
}
