import mongoose, { type InferSchemaType, Schema } from "mongoose";

const rateLimitBucketSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, min: 0 },
    resetAt: { type: Date, required: true },
  },
  { timestamps: true },
);

rateLimitBucketSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitBucketDocument = InferSchemaType<
  typeof rateLimitBucketSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const RateLimitBucket =
  mongoose.models.RateLimitBucket ||
  mongoose.model("RateLimitBucket", rateLimitBucketSchema);
