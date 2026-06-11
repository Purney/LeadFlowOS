import mongoose, { type InferSchemaType, Schema } from "mongoose";

const timeEntrySchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    minutes: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

timeEntrySchema.index({ organisationId: 1, date: -1 });

export type TimeEntryDocument = InferSchemaType<typeof timeEntrySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TimeEntry =
  mongoose.models.TimeEntry || mongoose.model("TimeEntry", timeEntrySchema);
