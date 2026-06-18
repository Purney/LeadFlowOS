type PersonalisationLead = {
  firstName?: string;
  lastName?: string;
  company?: string;
  website?: string;
  specificDataPoint?: string;
  normalisedCompany?: string;
  magnetName?: string;
  personalisedWorkflowValue?: string;
  senderEmailSignature?: string;
  globalSignature?: string;
  bookingLink?: string;
  customFields?: Record<string, unknown>;
};

const variableAliases = {
  firstName: ["firstName", "FIRST_NAME"],
  lastName: ["lastName", "LAST_NAME"],
  company: ["company", "COMPANY"],
  website: ["website", "WEBSITE"],
  specificDataPoint: ["specificDataPoint", "SPECIFIC_DATA_POINT"],
  normalisedCompany: ["normalisedCompany", "NORMALISED_COMPANY"],
  magnetName: ["magnetName", "MAGNET_NAME"],
  personalisedWorkflowValue: [
    "personalisedWorkflowValue",
    "PERSONALISED_WORKFLOW_VALUE",
  ],
  senderEmailSignature: ["senderEmailSignature", "SENDER_EMAIL_SIGNATURE"],
  globalSignature: ["globalSignature", "GLOBAL_SIGNATURE"],
  bookingLink: ["bookingLink", "BOOKING_LINK"],
} satisfies Record<Exclude<keyof PersonalisationLead, "customFields">, string[]>;

const aliasToKey = new Map(
  Object.entries(variableAliases).flatMap(([key, aliases]) =>
    aliases.map((alias) => [
      alias,
      key as Exclude<keyof PersonalisationLead, "customFields">,
    ]),
  ),
);

const placeholderPattern =
  /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}|\{\s*([A-Z_][A-Z0-9_]*)\s*\}/g;

export function toPersonalisationToken(label: string) {
  return label
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function customFieldValue(
  customFields: Record<string, unknown> | undefined,
  placeholder: string,
) {
  if (!customFields) return undefined;

  const normalizedPlaceholder = toPersonalisationToken(placeholder);
  const match = Object.entries(customFields).find(
    ([key]) => toPersonalisationToken(key) === normalizedPlaceholder,
  );
  const value = match?.[1];

  if (value === null || value === undefined) return undefined;
  return String(value);
}

export function applyPersonalisation(template: string, lead: PersonalisationLead) {
  return template.replace(placeholderPattern, (_match, doubleBrace, singleBrace) => {
    const placeholder = doubleBrace ?? singleBrace;
    const key = aliasToKey.get(placeholder);

    if (key) {
      return lead[key] ?? "";
    }

    return customFieldValue(lead.customFields, placeholder) ?? _match;
  });
}

export function extractPersonalisationVariables(template: string) {
  return [...template.matchAll(placeholderPattern)]
    .map((match) => aliasToKey.get(match[1] ?? match[2]))
    .filter(
      (key): key is Exclude<keyof PersonalisationLead, "customFields"> =>
        Boolean(key),
    );
}

export const personalisationVariables = Object.entries(variableAliases).map(
  ([key, aliases]) => ({
    key: key as keyof PersonalisationLead,
    label: aliases[1] ?? aliases[0],
    token: `{${aliases[1] ?? aliases[0]}}`,
    legacyToken: `{{${aliases[0]}}}`,
  }),
);
