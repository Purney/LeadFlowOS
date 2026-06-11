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
  tags: ["tags", "tag"],
  notes: ["notes", "note"],
  source: ["source", "leadsource"],
} as const;

function getValue(row: Record<string, string>, aliases: readonly string[]) {
  for (const alias of aliases) {
    if (row[alias]) {
      return row[alias];
    }
  }

  return undefined;
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
    tags: (getValue(row, headerAliases.tags) ?? "")
      .split(/[;|]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: getValue(row, headerAliases.notes),
    source: source ?? getValue(row, headerAliases.source),
    status: "imported",
    customFields: {},
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
