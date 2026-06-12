import { RateLimitBucket } from "@/models/rate-limit-bucket";
import { connectToDatabase } from "@/lib/db";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1 };
  }

  if (bucket.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: options.limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function rateLimitKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "local";

  return `${scope}:${ip}`;
}

export async function checkPersistentRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
) {
  await connectToDatabase();
  const now = new Date();
  const resetAt = new Date(now.getTime() + options.windowMs);
  const resetBucket = await RateLimitBucket.findOneAndUpdate(
    { key, resetAt: { $lte: now } },
    { $set: { count: 0, resetAt } },
    { returnDocument: "after" },
  );

  if (!resetBucket) {
    await RateLimitBucket.updateOne(
      { key },
      { $setOnInsert: { count: 0, resetAt } },
      { upsert: true },
    ).catch((error: unknown) => {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        (error as { code?: number }).code !== 11000
      ) {
        throw error;
      }
    });
  }

  const updated = await RateLimitBucket.findOneAndUpdate(
    { key, resetAt: { $gt: now }, count: { $lt: options.limit } },
    { $inc: { count: 1 } },
    { returnDocument: "after" },
  );

  if (!updated) {
    const blocked = await RateLimitBucket.findOne({ key }).lean();

    return {
      allowed: false,
      remaining: 0,
      resetAt: blocked?.resetAt ?? resetAt,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - updated.count),
    resetAt: updated.resetAt,
  };
}
