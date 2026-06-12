import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { AiDraft } from "@/models/ai-draft";
import { ClientResearch } from "@/models/client-research";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { LifecycleTimelineEvent } from "@/models/lifecycle-timeline-event";
import { Organisation } from "@/models/organisation";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  createClientResearch,
  generateResearchSummary,
  getResearchMetrics,
  updateResearchChecklistItem,
} from "@/services/research-service";

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
    AiDraft.deleteMany({}),
    ClientResearch.deleteMany({}),
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

describe("research service", () => {
  it("creates research and syncs a lifecycle account", async () => {
    await bootstrapOwner();
    const research = await createClientResearch(context, {
      companyName: "Compiler Labs",
      website: "https://compiler.example",
      industry: "SaaS",
      competitors: ["Manual vendor", "Manual vendor"],
      painHypotheses: ["Manual reporting"],
      opportunityIdeas: ["Automated reporting"],
      positiveSignals: ["Hiring operations"],
      negativeSignals: [],
      fitScore: 88,
      priority: "high",
      status: "researched",
      outreachAngle: "Offer reporting workflow audit.",
    });

    const account = await LifecycleAccount.findById(
      research.lifecycleAccountId,
    ).lean();
    const metrics = await getResearchMetrics(context.organisationId);

    expect(research.competitors).toEqual(["Manual vendor"]);
    expect(account?.stage).toBe("client_research");
    expect(account?.fitScore).toBe(88);
    expect(metrics.highFit).toBe(1);
  });

  it("updates checklist items and generates research summaries", async () => {
    await bootstrapOwner();
    const research = await createClientResearch(context, {
      companyName: "Compiler Labs",
      website: "https://compiler.example",
      competitors: [],
      painHypotheses: ["Manual reporting"],
      opportunityIdeas: ["Automated reporting"],
      positiveSignals: ["Hiring operations"],
      negativeSignals: ["No clear tech owner"],
      fitScore: 78,
      priority: "high",
      status: "draft",
    });

    const checklistItem = research.checklist[0];
    const updated = await updateResearchChecklistItem(
      context,
      research._id.toString(),
      {
        itemId: checklistItem.itemId,
        completed: true,
      },
    );

    expect(updated?.checklist[0].completed).toBe(true);

    const result = await generateResearchSummary(
      context,
      { researchId: research._id.toString() },
      {
        generateText: async () =>
          JSON.stringify({
            fitSummary: "Strong fit for automation.",
            likelyPainPoints: ["Manual reporting"],
            outreachAngles: ["Workflow audit"],
            risks: ["Unclear owner"],
            recommendedNextSteps: ["Find COO"],
          }),
        model: "test-model",
      },
    );
    const draft = await AiDraft.findOne({ type: "research_summary" }).lean();

    expect(
      (result?.research.aiSummary as { fitSummary: string }).fitSummary,
    ).toBe(
      "Strong fit for automation.",
    );
    expect(draft?.model).toBe("test-model");
  });
});
