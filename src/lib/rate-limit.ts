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
  const existing = await RateLimitBucket.findOne({ key });

  if (!existing || existing.resetAt <= now) {
    await RateLimitBucket.findOneAndUpdate(
      { key },
      { $set: { count: 1, resetAt } },
      { upsert: true },
    );

    return { allowed: true, remaining: options.limit - 1, resetAt };
  }

  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  await existing.save();

  return {
    allowed: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  };
}
