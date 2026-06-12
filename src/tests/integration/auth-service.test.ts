import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Organisation } from "@/models/organisation";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import {
  SignupClosedError,
  authenticateCredentials,
  createFirstOwner,
} from "@/services/auth-service";

let mongo: MongoMemoryServer;

const signupInput = {
  ownerName: "Ada Lovelace",
  organisationName: "LeadFlow OS",
  email: "ada@example.com",
  password: "CorrectHorse12",
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  await Promise.all([
    ActivityLog.deleteMany({}),
    SetupLock.deleteMany({}),
    Organisation.deleteMany({}),
    User.deleteMany({}),
  ]);
  process.env.ALLOW_ADDITIONAL_ORG_SIGNUPS = "false";
});

afterAll(async () => {
  await disconnectFromDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

describe("auth service", () => {
  it("creates the first owner and organisation", async () => {
    const result = await createFirstOwner(signupInput);

    expect(result.user.email).toBe("ada@example.com");
    expect(result.user.role).toBe("owner");
    expect(result.organisation.slug).toBe("leadflow-os");
    await expect(ActivityLog.countDocuments({})).resolves.toBe(1);
  });

  it("blocks a second signup by default", async () => {
    await createFirstOwner(signupInput);

    await expect(
      createFirstOwner({
        ...signupInput,
        email: "grace@example.com",
      }),
    ).rejects.toBeInstanceOf(SignupClosedError);
  });

  it("authenticates valid credentials", async () => {
    await createFirstOwner(signupInput);

    const user = await authenticateCredentials({
      email: "ada@example.com",
      password: "CorrectHorse12",
    });

    expect(user?.organisationId).toBeTruthy();
    expect(user?.role).toBe("owner");
  });

  it("rejects invalid credentials", async () => {
    await createFirstOwner(signupInput);

    const user = await authenticateCredentials({
      email: "ada@example.com",
      password: "WrongHorse12",
    });

    expect(user).toBeNull();
  });
});
