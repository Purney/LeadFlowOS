import mongoose from "mongoose";
import { CampaignEnrollment } from "@/models/campaign-enrollment";
import { EmailAccount } from "@/models/email-account";
import { EmailEvent } from "@/models/email-event";
import { EmailMessage } from "@/models/email-message";
import { Lead } from "@/models/lead";
import { SendBatch } from "@/models/send-batch";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import { createSuppression, getSuppressedEmailSet } from "@/services/suppression-service";
import { sendSendGridMessage } from "@/services/sendgrid-service";

type ActorContext = {
  organisationId: string;
  userId: string;
};

type SendGridEvent = {
  event: string;
  email: string;
  timestamp?: number;
  sg_message_id?: string;
  reason?: string;
  url?: string;
  [key: string]: unknown;
};

type InboundReplyInput = {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  raw?: Record<string, unknown>;
};

type BatchRecipient = {
  leadId: mongoose.Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function eventToMessageStatus(event: string) {
  const map: Record<string, string> = {
    delivered: "delivered",
    open: "opened",
    click: "clicked",
    bounce: "bounced",
    dropped: "failed",
    spamreport: "spam_report",
    unsubscribe: "unsubscribed",
    group_unsubscribe: "unsubscribed",
  };

  return map[event] ?? "sent";
}

export async function processApprovedSendBatch(
  context: ActorContext,
  batchId: string,
  options: { dryRun?: boolean } = {},
) {
  await connectToDatabase();

  const batch = await SendBatch.findOne({
    _id: toObjectId(batchId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!batch || batch.status !== "approved") {
    return null;
  }

  const account = await EmailAccount.findOne({
    _id: batch.sendingAccountId,
    organisationId: toObjectId(context.organisationId),
  });

  if (!account || !account.active) {
    throw new Error("Sending account is unavailable.");
  }

  const batchRecipients = batch.recipients as BatchRecipient[];
  const suppressed = await getSuppressedEmailSet(
    context.organisationId,
    batchRecipients.map((recipient) => recipient.email),
  );
  const sendableRecipients = batchRecipients.filter(
    (recipient) => !suppressed.has(recipient.email),
  );

  await SendBatch.updateOne(
    { _id: batch._id },
    { $set: { status: options.dryRun ? "approved" : "sending" } },
  );

  const messages = [];

  for (const recipient of sendableRecipients) {
    const message = await EmailMessage.create({
      organisationId: toObjectId(context.organisationId),
      leadId: recipient.leadId,
      campaignId: batch.campaignId,
      sendBatchId: batch._id,
      emailAccountId: account._id,
      direction: "outbound",
      status: options.dryRun ? "queued" : "sent",
      provider: "sendgrid",
      from: account.email,
      to: recipient.email,
      subject: batch.subject,
      body: batch.body,
      sentAt: options.dryRun ? undefined : new Date(),
    });

    if (!options.dryRun) {
      const result = await sendSendGridMessage({
        to: recipient.email,
        from: account.email,
        subject: batch.subject,
        text: batch.body,
        customArgs: {
          organisationId: context.organisationId,
          emailMessageId: message._id.toString(),
          sendBatchId: batch._id.toString(),
          leadId: recipient.leadId.toString(),
        },
      });

      message.providerMessageId = result.messageId;
      await message.save();
    }

    messages.push(message);
  }

  if (!options.dryRun) {
    await SendBatch.updateOne({ _id: batch._id }, { $set: { status: "sent" } });
  }

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "send_batch",
    entityId: batch._id.toString(),
    action: options.dryRun ? "send_batch.dry_run" : "send_batch.processed",
    metadata: {
      sendable: sendableRecipients.length,
      suppressed: batchRecipients.length - sendableRecipients.length,
    },
  });

  return {
    sent: options.dryRun ? 0 : messages.length,
    queued: options.dryRun ? messages.length : 0,
    suppressed: batchRecipients.length - sendableRecipients.length,
  };
}

export async function processSendGridEvents(
  organisationId: string,
  events: SendGridEvent[],
) {
  await connectToDatabase();

  const processed = [];

  for (const event of events) {
    const message = event.sg_message_id
      ? await EmailMessage.findOne({
          organisationId: toObjectId(organisationId),
          providerMessageId: event.sg_message_id,
        })
      : await EmailMessage.findOne({
          organisationId: toObjectId(organisationId),
          to: event.email.toLowerCase(),
        }).sort({ createdAt: -1 });
    const occurredAt = event.timestamp
      ? new Date(event.timestamp * 1000)
      : new Date();

    const emailEvent = await EmailEvent.create({
      organisationId: toObjectId(organisationId),
      emailMessageId: message?._id,
      leadId: message?.leadId,
      sendBatchId: message?.sendBatchId,
      eventType: event.event,
      providerMessageId: event.sg_message_id,
      email: event.email,
      occurredAt,
      raw: event,
    });

    if (message) {
      message.status = eventToMessageStatus(event.event);
      await message.save();
    }

    if (["bounce", "dropped"].includes(event.event)) {
      await createSuppression(
        { organisationId },
        {
          email: event.email,
          reason: "bounced",
          note: String(event.reason ?? ""),
        },
      );
    }

    if (event.event === "spamreport") {
      await createSuppression(
        { organisationId },
        { email: event.email, reason: "spam_report" },
      );
    }

    if (event.event === "unsubscribe" || event.event === "group_unsubscribe") {
      await createSuppression(
        { organisationId },
        { email: event.email, reason: "unsubscribed" },
      );
    }

    processed.push(emailEvent);
  }

  return { processed: processed.length };
}

export async function processInboundReply(
  organisationId: string,
  input: InboundReplyInput,
) {
  await connectToDatabase();

  const fromEmail = input.from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
  const toEmail = input.to.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();

  if (!fromEmail || !toEmail) {
    throw new Error("Inbound reply is missing a valid from/to address.");
  }

  const lead = await Lead.findOne({
    organisationId: toObjectId(organisationId),
    email: fromEmail,
  });
  const account = await EmailAccount.findOne({
    organisationId: toObjectId(organisationId),
    email: toEmail,
  });
  const body = input.text ?? input.html ?? "";
  const message = await EmailMessage.create({
    organisationId: toObjectId(organisationId),
    leadId: lead?._id,
    emailAccountId: account?._id,
    direction: "inbound",
    status: "replied",
    provider: "sendgrid",
    from: fromEmail,
    to: toEmail,
    subject: input.subject,
    body,
    raw: input.raw ?? {},
    receivedAt: new Date(),
  });

  if (lead) {
    lead.status = "replied";
    await lead.save();

    await CampaignEnrollment.updateMany(
      {
        organisationId: toObjectId(organisationId),
        leadId: lead._id,
        status: "active",
      },
      { $set: { status: "replied" } },
    );

    await createActivity({
      organisationId,
      entityType: "lead",
      entityId: lead._id.toString(),
      action: "email.reply_received",
      metadata: { email: fromEmail, subject: input.subject },
    });
  }

  return { message, matchedLead: Boolean(lead) };
}

export async function getEmailMetrics(organisationId: string) {
  await connectToDatabase();

  const [messages, replies, events] = await Promise.all([
    EmailMessage.countDocuments({ organisationId: toObjectId(organisationId) }),
    EmailMessage.countDocuments({
      organisationId: toObjectId(organisationId),
      direction: "inbound",
    }),
    EmailEvent.countDocuments({ organisationId: toObjectId(organisationId) }),
  ]);

  return { messages, replies, events };
}

export async function listRecentEmailEvents(organisationId: string, limit = 8) {
  await connectToDatabase();

  return EmailEvent.find({ organisationId: toObjectId(organisationId) })
    .sort({ occurredAt: -1 })
    .limit(limit)
    .lean();
}
