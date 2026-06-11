import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Client } from "@/models/client";
import { Lead } from "@/models/lead";
import { OnboardingTask } from "@/models/onboarding-task";
import { Organisation } from "@/models/organisation";
import { PdfExport } from "@/models/pdf-export";
import { PortalAccess } from "@/models/portal-access";
import { PortalMessage } from "@/models/portal-message";
import { Project } from "@/models/project";
import { Proposal } from "@/models/proposal";
import { SignatureRequest } from "@/models/signature-request";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import { convertLeadToClient, createProject } from "@/services/client-service";
import { createLead } from "@/services/lead-service";
import {
  createOnboardingTask,
  createPdfExport,
  createPortalAccess,
  createPortalMessage,
  createPublicPortalMessage,
  createSignatureRequest,
  getPortalMetrics,
  getPublicPortal,
  runOnboardingAutomation,
  signPortalSignature,
} from "@/services/portal-service";
import { createProposal } from "@/services/proposal-service";

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

async function bootstrapClient() {
  const lead = await createLead(context, {
    email: "client@example.com",
    company: "Client Co",
    tags: [],
    status: "qualified",
    customFields: {},
  });
  const client = await convertLeadToClient(context, {
    leadId: lead._id.toString(),
  });

  if (!client) throw new Error("Client bootstrap failed.");

  return client;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  await Promise.all([
    ActivityLog.deleteMany({}),
    PdfExport.deleteMany({}),
    SignatureRequest.deleteMany({}),
    OnboardingTask.deleteMany({}),
    PortalMessage.deleteMany({}),
    PortalAccess.deleteMany({}),
    Proposal.deleteMany({}),
    Project.deleteMany({}),
    Client.deleteMany({}),
    Lead.deleteMany({}),
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

describe("portal service", () => {
  it("creates hashed portal access and resolves public portal data", async () => {
    await bootstrapOwner();
    const client = await bootstrapClient();
    await createProject(context, {
      clientId: client._id.toString(),
      name: "Client portal rollout",
      type: "software",
      status: "active",
      estimatedValue: 5000,
      actualRevenue: 1000,
    });
    await createOnboardingTask(context, {
      clientId: client._id.toString(),
      title: "Complete kickoff checklist",
    });
    const access = await createPortalAccess(context, {
      clientId: client._id.toString(),
      label: "Main portal",
    });

    expect(access?.token).toBeTruthy();

    const storedAccess = await PortalAccess.findById(access?.access._id).lean();
    const portal = await getPublicPortal(access!.token);

    expect(storedAccess?.tokenHash).not.toBe(access?.token);
    expect(portal?.client.company).toBe("Client Co");
    expect(portal?.projects).toHaveLength(1);
    expect(portal?.tasks).toHaveLength(1);
  });

  it("creates signature requests and signs them through the public portal", async () => {
    await bootstrapOwner();
    const client = await bootstrapClient();
    const access = await createPortalAccess(context, {
      clientId: client._id.toString(),
      label: "Signature portal",
    });
    const signature = await createSignatureRequest(context, {
      clientId: client._id.toString(),
      title: "Approve scope",
      signerName: "Grace Hopper",
      signerEmail: "grace@example.com",
      termsMarkdown: "I approve the scope.",
    });

    const signed = await signPortalSignature(
      access!.token,
      signature!._id.toString(),
      {
        signerName: "Grace Hopper",
        signatureText: "Grace Hopper",
      },
    );

    expect(signed?.status).toBe("signed");
    expect(signed?.signedAt).toBeInstanceOf(Date);
    await expect(
      ActivityLog.countDocuments({ action: "signature_request.signed" }),
    ).resolves.toBe(1);
  });

  it("generates PDF-ready exports and portal metrics", async () => {
    await bootstrapOwner();
    const client = await bootstrapClient();
    const proposal = await createProposal(context, {
      title: "Automation proposal",
      status: "sent",
      content: {
        executiveSummary: "Summary",
        identifiedProblem: "Problem",
        proposedSolution: "Solution",
        deliverables: ["Workflow"],
        assumptions: ["Access"],
        estimatedTimeline: "2 weeks",
        optionalEnhancements: [],
      },
    });
    await createPortalAccess(context, {
      clientId: client._id.toString(),
      label: "Metrics portal",
    });
    await createOnboardingTask(context, {
      clientId: client._id.toString(),
      title: "Send onboarding form",
    });
    await createSignatureRequest(context, {
      clientId: client._id.toString(),
      title: "Approve proposal",
      signerName: "Grace Hopper",
      signerEmail: "grace@example.com",
      termsMarkdown: "Approved.",
    });

    const pdfExport = await createPdfExport(context, {
      clientId: client._id.toString(),
      proposalId: proposal._id.toString(),
      title: "Automation proposal PDF",
    });
    const metrics = await getPortalMetrics(context.organisationId);

    expect(pdfExport?.html).toContain("Executive summary");
    expect(pdfExport?.html).toContain("Workflow");
    expect(metrics).toEqual({
      accesses: 1,
      pendingTasks: 1,
      signatures: 1,
      pdfExports: 1,
      unreadMessages: 0,
    });
  });

  it("runs onboarding automation and captures internal and public portal messages", async () => {
    await bootstrapOwner();
    const client = await bootstrapClient();
    const project = await createProject(context, {
      clientId: client._id.toString(),
      name: "Portal collaboration",
      type: "consulting",
      status: "active",
      estimatedValue: 3000,
      actualRevenue: 0,
    });
    const access = await createPortalAccess(context, {
      clientId: client._id.toString(),
      label: "Collaboration portal",
    });

    const tasks = await runOnboardingAutomation(context, {
      clientId: client._id.toString(),
      projectId: project!._id.toString(),
    });
    const internalMessage = await createPortalMessage(context, {
      clientId: client._id.toString(),
      projectId: project!._id.toString(),
      authorName: "Team",
      body: "Kickoff tasks are ready.",
    });
    const publicMessage = await createPublicPortalMessage(access!.token, {
      projectId: project!._id.toString(),
      authorName: "Client",
      body: "We have uploaded the assets.",
    });
    const metrics = await getPortalMetrics(context.organisationId);

    expect(tasks).toHaveLength(3);
    expect(internalMessage?.authorType).toBe("internal");
    expect(publicMessage?.authorType).toBe("client");
    expect(metrics.pendingTasks).toBe(3);
    expect(metrics.unreadMessages).toBe(1);
  });
});
