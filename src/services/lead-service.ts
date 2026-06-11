import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/models/lead";
import { createActivity } from "@/services/activity-service";
import type { LeadListFilters } from "@/types/lead";
import { parseLeadCsv } from "@/utils/lead-import";
import {
  leadImportSchema,
  leadInputSchema,
  leadUpdateSchema,
  type LeadImportInput,
  type LeadInput,
  type LeadUpdateInput,
} from "@/validation/lead";

type ActorContext = {
  organisationId: string;
  userId: string;
};

function normaliseTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

export async function listLeads(
  context: Pick<ActorContext, "organisationId">,
  filters: LeadListFilters = {},
) {
  await connectToDatabase();

  const query: Record<string, unknown> = {
    organisationId: toObjectId(context.organisationId),
  };

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  if (filters.tag) {
    query.tags = filters.tag;
  }

  if (filters.search) {
    const search = filters.search.trim();
    query.$or = [
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { company: new RegExp(search, "i") },
      { role: new RegExp(search, "i") },
      { source: new RegExp(search, "i") },
    ];
  }

  return Lead.find(query).sort({ createdAt: -1 }).lean();
}

export async function getLeadMetrics(organisationId: string) {
  await connectToDatabase();

  const [total, byStatus, tags] = await Promise.all([
    Lead.countDocuments({ organisationId: toObjectId(organisationId) }),
    Lead.aggregate([
      { $match: { organisationId: toObjectId(organisationId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lead.distinct("tags", { organisationId: toObjectId(organisationId) }),
  ]);

  return {
    total,
    byStatus: Object.fromEntries(
      byStatus.map((item) => [item._id as string, item.count as number]),
    ),
    tags: tags.filter(Boolean).sort(),
  };
}

export async function createLead(context: ActorContext, input: LeadInput) {
  const data = leadInputSchema.parse(input);
  await connectToDatabase();

  const lead = await Lead.create({
    ...data,
    tags: normaliseTags(data.tags),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "lead",
    entityId: lead._id.toString(),
    action: "lead.created",
    metadata: { email: lead.email, source: lead.source },
  });

  return lead;
}

export async function updateLead(
  context: ActorContext,
  leadId: string,
  input: LeadUpdateInput,
) {
  const data = leadUpdateSchema.parse(input);
  await connectToDatabase();

  if (data.tags) {
    data.tags = normaliseTags(data.tags);
  }

  const lead = await Lead.findOneAndUpdate(
    {
      _id: toObjectId(leadId),
      organisationId: toObjectId(context.organisationId),
    },
    { $set: data },
    { returnDocument: "after" },
  );

  if (!lead) {
    return null;
  }

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "lead",
    entityId: lead._id.toString(),
    action: "lead.updated",
  });

  return lead;
}

export async function deleteLead(context: ActorContext, leadId: string) {
  await connectToDatabase();

  const lead = await Lead.findOneAndDelete({
    _id: toObjectId(leadId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!lead) {
    return false;
  }

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "lead",
    entityId: lead._id.toString(),
    action: "lead.deleted",
    metadata: { email: lead.email },
  });

  return true;
}

export async function importLeads(context: ActorContext, input: LeadImportInput) {
  const data = leadImportSchema.parse(input);
  const parsed = parseLeadCsv(data.csv, data.source);
  const validLeads = parsed
    .map((lead) => leadInputSchema.safeParse(lead))
    .filter((result) => result.success)
    .map((result) => result.data);

  await connectToDatabase();

  const existing = await Lead.find({
    organisationId: toObjectId(context.organisationId),
    email: { $in: validLeads.map((lead) => lead.email) },
  })
    .select("email")
    .lean();
  const existingEmails = new Set(existing.map((lead) => lead.email));
  const seen = new Set<string>();
  const skippedDuplicates: string[] = [];
  const leadsToCreate = validLeads.filter((lead) => {
    if (existingEmails.has(lead.email) || seen.has(lead.email)) {
      skippedDuplicates.push(lead.email);
      return false;
    }

    seen.add(lead.email);
    return true;
  });

  const created =
    leadsToCreate.length > 0
      ? await Lead.insertMany(
          leadsToCreate.map((lead) => ({
            ...lead,
            tags: normaliseTags(lead.tags),
            organisationId: toObjectId(context.organisationId),
            createdByUserId: toObjectId(context.userId),
          })),
          { ordered: false },
        )
      : [];

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "lead",
    action: "lead.imported",
    metadata: {
      parsed: parsed.length,
      created: created.length,
      skippedDuplicates: skippedDuplicates.length,
    },
  });

  return {
    parsed: parsed.length,
    valid: validLeads.length,
    created: created.length,
    skippedInvalid: parsed.length - validLeads.length,
    skippedDuplicates,
  };
}
