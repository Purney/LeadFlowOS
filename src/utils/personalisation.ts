type PersonalisationLead = {
  firstName?: string;
  lastName?: string;
  company?: string;
  website?: string;
};

const placeholderPattern = /\{\{\s*(firstName|lastName|company|website)\s*\}\}/g;

export function applyPersonalisation(template: string, lead: PersonalisationLead) {
  return template.replace(placeholderPattern, (_match, key: keyof PersonalisationLead) =>
    lead[key] ?? "",
  );
}

export function extractPersonalisationVariables(template: string) {
  return [...template.matchAll(placeholderPattern)].map((match) => match[1]);
}
