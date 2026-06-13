import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Client } from "@/models/client";
import { Deal } from "@/models/deal";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { LifecycleTimelineEvent } from "@/models/lifecycle-timeline-event";
import { OnboardingHandoff } from "@/models/onboarding-handoff";
import { OnboardingTask } from "@/models/onboarding-task";
import { Organisation } from "@/models/organisation";
import { PortalAccess } from "@/models/portal-access";
import { Project } from "@/models/project";
import { SalesTask } from "@/models/sales-task";
import { SetupLock } from "@/models/setup-lock";
import { SignatureRequest } from "@/models/signature-request";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  createOnboardingHandoff,
  getHandoffMetrics,
  updateOnboardingHandoff,
} from "@/services/handoff-service";
import { createDeal } from "@/services/sales-service";

let mongo: MongoMemoryServer;
let context: { organisationId: string; userId: string };

async function bootstrapOwner() {
  const result = await createFirstOwner({
    ownerName: "Ada Lovelace",
    organisationName: "LeadFlow OS",
    email: "ada@example.com",
    password: "CorrectHorse12",
  });

  context = {
    organisationId: result.organisation._id.toString(),
    userId: result.user._id.toString(),
  };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  await Promise.all([
    ActivityLog.deleteMany({}),
    SignatureRequest.deleteMany({}),
    PortalAccess.deleteMany({}),
    OnboardingTask.deleteMany({}),
    OnboardingHandoff.deleteMany({}),
    Project.deleteMany({}),
    Client.deleteMany({}),
    SalesTask.deleteMany({}),
    Deal.deleteMany({}),
    LifecycleTimelineEvent.deleteMany({}),
    LifecycleAccount.deleteMany({}),
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

describe("handoff service", () => {
  it("creates onboarding assets from a won deal", async () => {
    await bootstrapOwner();
    const deal = await createDeal(context, {
      title: "Automation rollout",
      companyName: "Compiler Labs",
      contactName: "Grace Hopper",
      contactEmail: "grace@example.com",
      valueCents: 500000,
      probability: 100,
      stage: "won",
      status: "won",
    });
    expect(deal).not.toBeNull();

    const result = await createOnboardingHandoff(context, {
      dealId: deal!._id.toString(),
      projectName: "Compiler Labs kickoff",
      projectType: "automation",
      createProject: true,
      createPortalAccess: true,
      createSignatureRequest: true,
      runTaskAutomation: true,
      requirePaymentBeforeKickoff: true,
      paymentDueCents: 250000,
      signerName: "Grace Hopper",
      signerEmail: "grace@example.com",
      contractTerms: "Standard kickoff terms.",
    });

    expect(result?.portalToken).toBeTruthy();
    expect(result?.handoff.paymentStatus).toBe("pending");
    await expect(Client.countDocuments({})).resolves.toBe(1);
    await expect(Project.countDocuments({})).resolves.toBe(1);
    await expect(OnboardingTask.countDocuments({})).resolves.toBe(3);
    await expect(SignatureRequest.countDocuments({})).resolves.toBe(1);

    const metrics = await getHandoffMetrics(context.organisationId);
    expect(metrics.paymentPending).toBe(1);
  });

  it("updates payment and readiness state", async () => {
    await bootstrapOwner();
    const deal = await createDeal(context, {
      title: "AI discovery",
      companyName: "Client Co",
      valueCents: 100000,
      probability: 100,
      stage: "won",
      status: "won",
    });
    const result = await createOnboardingHandoff(context, {
      dealId: deal!._id.toString(),
      createProject: false,
      createPortalAccess: false,
      createSignatureRequest: false,
      runTaskAutomation: false,
      requirePaymentBeforeKickoff: true,
      paymentDueCents: 100000,
    });
    const paid = await updateOnboardingHandoff(
      context,
      result!.handoff._id.toString(),
      { paymentStatus: "paid" },
    );
    const ready = await updateOnboardingHandoff(
      context,
      result!.handoff._id.toString(),
      { status: "ready_for_execution" },
    );

    expect(paid?.paymentStatus).toBe("paid");
    expect(ready?.status).toBe("ready_for_execution");
  });
});
