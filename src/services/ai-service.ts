import mongoose from "mongoose";
import { AiDraft } from "@/models/ai-draft";
import { connectToDatabase } from "@/lib/db";

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

export async function listAiDrafts(organisationId: string, limit = 12) {
  await connectToDatabase();

  return AiDraft.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
