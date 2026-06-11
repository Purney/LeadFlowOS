import crypto from "crypto";
import mongoose from "mongoose";
import { Client } from "@/models/client";
import { OnboardingTask } from "@/models/onboarding-task";
import { PdfExport } from "@/models/pdf-export";
import { PortalAccess } from "@/models/portal-access";
import { PortalMessage } from "@/models/portal-message";
import { Project } from "@/models/project";
import { Proposal } from "@/models/proposal";
import { SignatureRequest } from "@/models/signature-request";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import { createSignatureEnvelope } from "@/services/signature-provider-service";
import {
  onboardingAutomationInputSchema,
  onboardingTaskInputSchema,
  onboardingTaskUpdateSchema,
  pdfExportInputSchema,
  portalAccessInputSchema,
  portalMessageInputSchema,
  publicPortalMessageSchema,
  publicSignatureSchema,
  signatureRequestInputSchema,
  signatureRequestUpdateSchema,
  type OnboardingAutomationInput,
  type OnboardingTaskInput,
  type OnboardingTaskUpdateInput,
  type PdfExportInput,
  type PortalAccessInput,
  type PortalMessageInput,
  type PublicPortalMessageInput,
  type PublicSignatureInput,
  type SignatureRequestInput,
  type SignatureRequestUpdateInput,
} from "@/validation/portal";

type ActorContext = {
  organisationId: string;
  userId: string;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function section(title: string, body: string | string[]) {
  const content = Array.isArray(body)
    ? `<ul>${body.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p>${escapeHtml(body)}</p>`;

  return `<section><h2>${escapeHtml(title)}</h2>${content}</section>`;
}

export async function listPortalAccesses(organisationId: string) {
  await connectToDatabase();

  return PortalAccess.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createPortalAccess(
  context: ActorContext,
  input: PortalAccessInput,
) {
  const data = portalAccessInputSchema.parse(input);
  await connectToDatabase();

  const client = await Client.exists({
    _id: toObjectId(data.clientId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!client) return null;

  const token = createToken();
  const access = await PortalAccess.create({
    ...data,
    tokenHash: hashToken(token),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    clientId: toObjectId(data.clientId),
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "portal_access",
    entityId: access._id.toString(),
    action: "portal_access.created",
    metadata: { clientId: data.clientId },
  });

  return { access, token };
}

export async function listOnboardingTasks(organisationId: string) {
  await connectToDatabase();

  return OnboardingTask.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createOnboardingTask(
  context: ActorContext,
  input: OnboardingTaskInput,
) {
  const data = onboardingTaskInputSchema.parse(input);
  await connectToDatabase();

  const client = await Client.exists({
    _id: toObjectId(data.clientId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!client) return null;

  if (data.projectId) {
    const project = await Project.exists({
      _id: toObjectId(data.projectId),
      clientId: toObjectId(data.clientId),
      organisationId: toObjectId(context.organisationId),
    });
    if (!project) return null;
  }

  const task = await OnboardingTask.create({
    ...data,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    clientId: toObjectId(data.clientId),
    projectId: data.projectId ? toObjectId(data.projectId) : undefined,
    completedAt: data.status === "completed" ? new Date() : undefined,
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "onboarding_task",
    entityId: task._id.toString(),
    action: "onboarding_task.created",
    metadata: { clientId: data.clientId, status: task.status },
  });

  return task;
}

export async function runOnboardingAutomation(
  context: ActorContext,
  input: OnboardingAutomationInput,
) {
  const data = onboardingAutomationInputSchema.parse(input);
  const templates = [
    {
      title: "Confirm kickoff stakeholders",
      description: "Confirm the client-side owner, technical contact, and billing contact.",
    },
    {
      title: "Collect access and assets",
      description: "Gather brand assets, account access, API keys, and working documents.",
    },
    {
      title: "Schedule delivery cadence",
      description: "Agree on check-in rhythm, status reporting, and escalation paths.",
    },
  ];
  const tasks = [];

  for (const template of templates) {
    const task = await createOnboardingTask(context, {
      ...template,
      clientId: data.clientId,
      projectId: data.projectId,
      status: "pending",
    });
    if (task) tasks.push(task);
  }

  if (tasks.length > 0) {
    await createActivity({
      organisationId: context.organisationId,
      actorUserId: context.userId,
      entityType: "onboarding_task",
      action: "onboarding.automation_run",
      metadata: { clientId: data.clientId, created: tasks.length },
    });
  }

  return tasks;
}

export async function updateOnboardingTask(
  context: ActorContext,
  taskId: string,
  input: OnboardingTaskUpdateInput,
) {
  const data = onboardingTaskUpdateSchema.parse(input);
  await connectToDatabase();

  const task = await OnboardingTask.findOneAndUpdate(
    {
      _id: toObjectId(taskId),
      organisationId: toObjectId(context.organisationId),
    },
    {
      $set: {
        ...data,
        ...(data.clientId ? { clientId: toObjectId(data.clientId) } : {}),
        ...(data.projectId ? { projectId: toObjectId(data.projectId) } : {}),
        ...(data.status === "completed" ? { completedAt: new Date() } : {}),
      },
    },
    { returnDocument: "after" },
  );

  if (!task) return null;

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "onboarding_task",
    entityId: task._id.toString(),
    action: "onboarding_task.updated",
    metadata: { status: task.status },
  });

  return task;
}

export async function listSignatureRequests(organisationId: string) {
  await connectToDatabase();

  return SignatureRequest.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createSignatureRequest(
  context: ActorContext,
  input: SignatureRequestInput,
) {
  const data = signatureRequestInputSchema.parse(input);
  await connectToDatabase();

  const client = await Client.exists({
    _id: toObjectId(data.clientId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!client) return null;

  if (data.proposalId) {
    const proposal = await Proposal.exists({
      _id: toObjectId(data.proposalId),
      organisationId: toObjectId(context.organisationId),
    });
    if (!proposal) return null;
  }

  const providerFields = data.useExternalProvider
    ? await createSignatureEnvelope(data)
    : undefined;
  const request = await SignatureRequest.create({
    ...data,
    useExternalProvider: undefined,
    ...providerFields,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    clientId: toObjectId(data.clientId),
    proposalId: data.proposalId ? toObjectId(data.proposalId) : undefined,
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "signature_request",
    entityId: request._id.toString(),
    action: "signature_request.created",
    metadata: { signerEmail: request.signerEmail, status: request.status },
  });

  return request;
}

export async function listPortalMessages(organisationId: string) {
  await connectToDatabase();

  return PortalMessage.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createPortalMessage(
  context: ActorContext,
  input: PortalMessageInput,
) {
  const data = portalMessageInputSchema.parse(input);
  await connectToDatabase();

  const client = await Client.exists({
    _id: toObjectId(data.clientId),
    organisationId: toObjectId(context.organisationId),
  });
  if (!client) return null;

  if (data.projectId) {
    const project = await Project.exists({
      _id: toObjectId(data.projectId),
      clientId: toObjectId(data.clientId),
      organisationId: toObjectId(context.organisationId),
    });
    if (!project) return null;
  }

  const message = await PortalMessage.create({
    ...data,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    clientId: toObjectId(data.clientId),
    projectId: data.projectId ? toObjectId(data.projectId) : undefined,
    authorType: "internal",
    authorName: data.authorName ?? "Team",
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "portal_message",
    entityId: message._id.toString(),
    action: "portal_message.created",
    metadata: { clientId: data.clientId },
  });

  return message;
}

export async function updateSignatureRequest(
  context: ActorContext,
  requestId: string,
  input: SignatureRequestUpdateInput,
) {
  const data = signatureRequestUpdateSchema.parse(input);
  await connectToDatabase();

  const request = await SignatureRequest.findOneAndUpdate(
    {
      _id: toObjectId(requestId),
      organisationId: toObjectId(context.organisationId),
    },
    {
      $set: {
        ...data,
        ...(data.status === "declined" ? { declinedAt: new Date() } : {}),
      },
    },
    { returnDocument: "after" },
  );

  if (!request) return null;

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "signature_request",
    entityId: request._id.toString(),
    action: "signature_request.updated",
    metadata: { status: request.status },
  });

  return request;
}

export async function listPdfExports(organisationId: string) {
  await connectToDatabase();

  return PdfExport.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getPdfExport(organisationId: string, exportId: string) {
  await connectToDatabase();

  return PdfExport.findOne({
    _id: toObjectId(exportId),
    organisationId: toObjectId(organisationId),
  }).lean();
}

export async function createPdfExport(context: ActorContext, input: PdfExportInput) {
  const data = pdfExportInputSchema.parse(input);
  await connectToDatabase();

  const [client, proposal] = await Promise.all([
    data.clientId
      ? Client.findOne({
          _id: toObjectId(data.clientId),
          organisationId: toObjectId(context.organisationId),
        }).lean()
      : null,
    data.proposalId
      ? Proposal.findOne({
          _id: toObjectId(data.proposalId),
          organisationId: toObjectId(context.organisationId),
        }).lean()
      : null,
  ]);

  if (data.clientId && !client) return null;
  if (data.proposalId && !proposal) return null;

  const html = [
    "<article>",
    `<h1>${escapeHtml(data.title)}</h1>`,
    client ? section("Client", client.company) : "",
    proposal
      ? [
          section("Executive summary", proposal.content.executiveSummary),
          section("Identified problem", proposal.content.identifiedProblem),
          section("Proposed solution", proposal.content.proposedSolution),
          section("Deliverables", proposal.content.deliverables),
          section("Assumptions", proposal.content.assumptions),
          section("Estimated timeline", proposal.content.estimatedTimeline),
        ].join("")
      : section("Document", "PDF-ready export generated from LeadFlow OS."),
    "</article>",
  ].join("");

  const pdfExport = await PdfExport.create({
    ...data,
    html,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    clientId: data.clientId ? toObjectId(data.clientId) : undefined,
    proposalId: data.proposalId ? toObjectId(data.proposalId) : undefined,
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "pdf_export",
    entityId: pdfExport._id.toString(),
    action: "pdf_export.generated",
    metadata: { title: data.title },
  });

  return pdfExport;
}

export async function getPortalMetrics(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);

  const [accesses, pendingTasks, signatures, pdfExports, unreadMessages] = await Promise.all([
    PortalAccess.countDocuments({ organisationId: orgId, revokedAt: { $exists: false } }),
    OnboardingTask.countDocuments({
      organisationId: orgId,
      status: { $in: ["pending", "in_progress", "blocked"] },
    }),
    SignatureRequest.countDocuments({
      organisationId: orgId,
      status: { $in: ["sent", "draft"] },
    }),
    PdfExport.countDocuments({ organisationId: orgId, status: "generated" }),
    PortalMessage.countDocuments({
      organisationId: orgId,
      authorType: "client",
      readAt: { $exists: false },
    }),
  ]);

  return { accesses, pendingTasks, signatures, pdfExports, unreadMessages };
}

export async function getPublicPortal(token: string) {
  await connectToDatabase();
  const now = new Date();

  const access = await PortalAccess.findOne({
    tokenHash: hashToken(token),
    revokedAt: { $exists: false },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  }).lean();

  if (!access) return null;

  await PortalAccess.updateOne(
    { _id: access._id },
    { $set: { lastViewedAt: now } },
  );

  const [client, projects, tasks, signatures, pdfExports, messages] = await Promise.all([
    Client.findById(access.clientId).lean(),
    Project.find({
      organisationId: access.organisationId,
      clientId: access.clientId,
    })
      .sort({ createdAt: -1 })
      .lean(),
    OnboardingTask.find({
      organisationId: access.organisationId,
      clientId: access.clientId,
    })
      .sort({ createdAt: -1 })
      .lean(),
    SignatureRequest.find({
      organisationId: access.organisationId,
      clientId: access.clientId,
      status: { $in: ["sent", "signed"] },
    })
      .sort({ createdAt: -1 })
      .lean(),
    PdfExport.find({
      organisationId: access.organisationId,
      clientId: access.clientId,
      status: "generated",
    })
      .sort({ createdAt: -1 })
      .lean(),
    PortalMessage.find({
      organisationId: access.organisationId,
      clientId: access.clientId,
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  if (!client) return null;

  return { access, client, projects, tasks, signatures, pdfExports, messages };
}

export async function createPublicPortalMessage(
  token: string,
  input: PublicPortalMessageInput,
) {
  const data = publicPortalMessageSchema.parse(input);
  const portal = await getPublicPortal(token);

  if (!portal) return null;

  if (data.projectId) {
    const project = await Project.exists({
      _id: toObjectId(data.projectId),
      organisationId: portal.access.organisationId,
      clientId: portal.access.clientId,
    });
    if (!project) return null;
  }

  const message = await PortalMessage.create({
    organisationId: portal.access.organisationId,
    clientId: portal.access.clientId,
    projectId: data.projectId ? toObjectId(data.projectId) : undefined,
    authorType: "client",
    authorName: data.authorName,
    body: data.body,
  });

  await createActivity({
    organisationId: portal.access.organisationId.toString(),
    entityType: "portal_message",
    entityId: message._id.toString(),
    action: "portal_message.client_created",
    metadata: { authorName: data.authorName },
  });

  return message;
}

export async function signPortalSignature(
  token: string,
  requestId: string,
  input: PublicSignatureInput,
) {
  const data = publicSignatureSchema.parse(input);
  const portal = await getPublicPortal(token);

  if (!portal) return null;

  const request = await SignatureRequest.findOneAndUpdate(
    {
      _id: toObjectId(requestId),
      organisationId: portal.access.organisationId,
      clientId: portal.access.clientId,
      status: "sent",
    },
    {
      $set: {
        status: "signed",
        signerName: data.signerName,
        signatureText: data.signatureText,
        signedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!request) return null;

  await createActivity({
    organisationId: portal.access.organisationId.toString(),
    entityType: "signature_request",
    entityId: request._id.toString(),
    action: "signature_request.signed",
    metadata: { signerEmail: request.signerEmail },
  });

  return request;
}
