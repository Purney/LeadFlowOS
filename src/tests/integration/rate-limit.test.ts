import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { checkPersistentRateLimit } from "@/lib/rate-limit";
import { RateLimitBucket } from "@/models/rate-limit-bucket";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  await RateLimitBucket.deleteMany({});
});

afterAll(async () => {
  await disconnectFromDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

describe("persistent rate limiting", () => {
  it("shares request counts through MongoDB", async () => {
    const key = `integration-${Date.now()}`;

    await expect(
      checkPersistentRateLimit(key, { limit: 2, windowMs: 60_000 }),
    ).resolves.toMatchObject({ allowed: true, remaining: 1 });
    await expect(
      checkPersistentRateLimit(key, { limit: 2, windowMs: 60_000 }),
    ).resolves.toMatchObject({ allowed: true, remaining: 0 });
    await expect(
      checkPersistentRateLimit(key, { limit: 2, windowMs: 60_000 }),
    ).resolves.toMatchObject({ allowed: false, remaining: 0 });
  });
});
