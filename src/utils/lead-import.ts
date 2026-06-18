import { parseCsv } from "@/utils/csv";
import type { LeadInput } from "@/validation/lead";

const headerAliases = {
  firstName: ["firstname", "first", "givenname"],
  lastName: ["lastname", "last", "surname", "familyname"],
  email: ["email", "emailaddress", "workemail"],
  phone: ["phone", "phonenumber", "mobile"],
  company: ["company", "organisation", "organization", "account"],
  website: ["website", "url", "domain"],
  role: ["role", "title", "jobtitle"],
  specificDataPoint: ["specificdatapoint", "specific_data_point", "datapoint"],
  normalisedCompany: ["normalisedcompany", "normalizedcompany", "normalised_company", "normalized_company"],
  magnetName: ["magnetname", "magnet_name"],
  personalisedWorkflowValue: [
    "personalisedworkflowvalue",
    "personalizedworkflowvalue",
    "personalised_workflow_value",
    "personalized_workflow_value",
    "workflowvalue",
  ],
  senderEmailSignature: ["senderemailsignature", "sender_email_signature", "signature"],
  tags: ["tags", "tag"],
  notes: ["notes", "note"],
  source: ["source", "leadsource"],
} as const;

const knownHeaders = new Set<string>(Object.values(headerAliases).flat());

function getValue(row: Record<string, string>, aliases: readonly string[]) {
  for (const alias of aliases) {
    if (row[alias]) {
      return row[alias];
    }
  }

  return undefined;
}

function getCustomFields(row: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([header, value]) => !knownHeaders.has(header) && value.trim())
      .map(([header, value]) => [header, value.trim()]),
  );
}

export function parseLeadCsv(csv: string, source?: string) {
  return parseCsv(csv).map<LeadInput>((row) => ({
    firstName: getValue(row, headerAliases.firstName),
    lastName: getValue(row, headerAliases.lastName),
    email: getValue(row, headerAliases.email) ?? "",
    phone: getValue(row, headerAliases.phone),
    company: getValue(row, headerAliases.company),
    website: getValue(row, headerAliases.website),
    role: getValue(row, headerAliases.role),
    specificDataPoint: getValue(row, headerAliases.specificDataPoint),
    normalisedCompany: getValue(row, headerAliases.normalisedCompany),
    magnetName: getValue(row, headerAliases.magnetName),
    personalisedWorkflowValue: getValue(row, headerAliases.personalisedWorkflowValue),
    senderEmailSignature: getValue(row, headerAliases.senderEmailSignature),
    tags: (getValue(row, headerAliases.tags) ?? "")
      .split(/[;|]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: getValue(row, headerAliases.notes),
    source: source ?? getValue(row, headerAliases.source),
    status: "imported",
    customFields: getCustomFields(row),
  }));
}

export function findDuplicateEmails(leads: Pick<LeadInput, "email">[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const lead of leads) {
    const email = lead.email.toLowerCase();

    if (seen.has(email)) {
      duplicates.add(email);
    }

    seen.add(email);
  }

  return [...duplicates];
}
