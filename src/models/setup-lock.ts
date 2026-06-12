import mongoose, { type InferSchemaType, Schema } from "mongoose";

const setupLockSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "initial-owner" },
  },
  { timestamps: true },
);

export type SetupLockDocument = InferSchemaType<typeof setupLockSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SetupLock =
  mongoose.models.SetupLock || mongoose.model("SetupLock", setupLockSchema);
