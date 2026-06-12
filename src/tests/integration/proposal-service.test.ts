import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { DiscoveryForm } from "@/models/discovery-form";
import { DiscoveryResponse } from "@/models/discovery-response";
import { Lead } from "@/models/lead";
import { Organisation } from "@/models/organisation";
import { Proposal } from "@/models/proposal";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  createDiscoveryForm,
  submitDiscoveryResponse,
} from "@/services/discovery-service";
import { createLead } from "@/services/lead-service";
import {
  createProposal,
  generateProposalFromDiscovery,
  getProposalMetrics,
  updateProposal,
} from "@/services/proposal-service";

let mongo: MongoMemoryServer;
let context: { organisationId: string; userId: string };

const content = {
  executiveSummary: "Summary",
  identifiedProblem: "Problem",
  proposedSolution: "Solution",
  deliverables: ["Workflow"],
  assumptions: ["Access provided"],
  estimatedTimeline: "2 weeks",
  optionalEnhancements: ["Dashboard"],
};

async function bootstrapOwner() {
  const owner = await createFirstOwner({
    ownerName: "Ada Lovelace",
    organisationName: "LeadFlow OS",
    email: "ada@example.com",
    password: "CorrectHorse12",
  });
  context = {
    organisationId: owner.organisation._id.toString(),
    userId: owner.user._id.toString(),
  };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  await Promise.all([
    ActivityLog.deleteMany({}),
    Proposal.deleteMany({}),
    DiscoveryResponse.deleteMany({}),
    DiscoveryForm.deleteMany({}),
    Lead.deleteMany({}),
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

describe("proposal service", () => {
  it("creates proposals and versions content edits", async () => {
    await bootstrapOwner();
    const proposal = await createProposal(context, {
      title: "Automation proposal",
      status: "draft",
      content,
    });

    expect(proposal.currentVersion).toBe(1);
    expect(proposal.versions).toHaveLength(1);

    const updated = await updateProposal(context, proposal._id.toString(), {
      status: "sent",
      content: { ...content, executiveSummary: "Updated summary" },
    });

    expect(updated?.status).toBe("sent");
    expect(updated?.currentVersion).toBe(2);
    expect(updated?.versions).toHaveLength(2);
    await expect(getProposalMetrics(context.organisationId)).resolves.toMatchObject({
      total: 1,
      byStatus: { sent: 1 },
    });
  });

  it("generates proposal drafts from discovery responses", async () => {
    await bootstrapOwner();
    const lead = await createLead(context, {
      email: "client@example.com",
      company: "Client Co",
      tags: [],
      status: "qualified",
      customFields: {},
    });
    const form = await createDiscoveryForm(context, {
      name: "Project discovery",
      status: "published",
      fields: [
        {
          id: "objective",
          label: "Objective",
          type: "long_text",
          required: true,
          options: [],
        },
      ],
    });
    const responseResult = await submitDiscoveryResponse(form.publicSlug, {
      leadId: lead._id.toString(),
      respondentEmail: "client@example.com",
      answers: { objective: "Automate reporting" },
    });
    const response =
      responseResult && "response" in responseResult ? responseResult.response : null;

    const proposal = await generateProposalFromDiscovery(
      context,
      {
        discoveryResponseId: response?._id.toString() ?? "",
        title: "AI proposal",
      },
      {
        generateText: async () => JSON.stringify(content),
      },
    );

    expect(proposal?.title).toBe("AI proposal");
    expect(proposal?.content.deliverables).toEqual(["Workflow"]);
    expect(proposal?.discoveryResponseId?.toString()).toBe(response?._id.toString());
  });
});
