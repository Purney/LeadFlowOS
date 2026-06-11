import mongoose, { type InferSchemaType, Schema } from "mongoose";

const activityLogSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, required: false, trim: true },
    action: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type ActivityLogDocument = InferSchemaType<typeof activityLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", activityLogSchema);
