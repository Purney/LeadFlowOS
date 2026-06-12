import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { lifecycleStages } from "@/types/lifecycle";

const lifecycleTimelineEventSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "LifecycleAccount",
      required: true,
      index: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    stage: {
      type: String,
      enum: lifecycleStages,
      required: true,
      index: true,
    },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, trim: true },
    action: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

lifecycleTimelineEventSchema.index({ organisationId: 1, occurredAt: -1 });
lifecycleTimelineEventSchema.index({ accountId: 1, occurredAt: -1 });

export type LifecycleTimelineEventDocument = InferSchemaType<
  typeof lifecycleTimelineEventSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const LifecycleTimelineEvent =
  mongoose.models.LifecycleTimelineEvent ||
  mongoose.model("LifecycleTimelineEvent", lifecycleTimelineEventSchema);
