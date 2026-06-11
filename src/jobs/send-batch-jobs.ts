import mongoose from "mongoose";
import { SendBatch } from "@/models/send-batch";
import { connectToDatabase } from "@/lib/db";
import { processApprovedSendBatch } from "@/services/email-service";

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

export async function processDueApprovedSendBatches(
  organisationId: string,
  options: { userId?: string; now?: Date; limit?: number; dryRun?: boolean } = {},
) {
  await connectToDatabase();

  const dueBatches = await SendBatch.find({
    organisationId: toObjectId(organisationId),
    status: "approved",
    scheduledSendTime: { $lte: options.now ?? new Date() },
  })
    .sort({ scheduledSendTime: 1 })
    .limit(options.limit ?? 10)
    .lean();
  const results = [];

  for (const batch of dueBatches) {
    const result = await processApprovedSendBatch(
      {
        organisationId,
        userId:
          options.userId ??
          batch.approvedByUserId?.toString() ??
          batch.createdByUserId?.toString() ??
          organisationId,
      },
      batch._id.toString(),
      { dryRun: options.dryRun },
    );
    results.push({ batchId: batch._id.toString(), result });
  }

  return { processed: results.length, results };
}
