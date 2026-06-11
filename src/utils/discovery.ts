import type { DiscoveryField } from "@/types/discovery";

export function makeFieldId(label: string, index: number) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || `field_${index + 1}`;
}

export function normaliseDiscoveryFields(
  fields: Omit<DiscoveryField, "id">[] | DiscoveryField[],
) {
  return fields.map((field, index) => ({
    ...field,
    id: "id" in field && field.id ? field.id : makeFieldId(field.label, index),
    options: field.options ?? [],
  }));
}

export function validateDiscoveryAnswers(
  fields: DiscoveryField[],
  answers: Record<string, unknown>,
) {
  const errors: string[] = [];

  for (const field of fields) {
    const value = answers[field.id];
    const empty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (field.required && empty) {
      errors.push(`${field.label} is required.`);
      continue;
    }

    if (empty) continue;

    if (field.type === "number" && Number.isNaN(Number(value))) {
      errors.push(`${field.label} must be a number.`);
    }

    if (field.type === "url") {
      try {
        new URL(String(value));
      } catch {
        errors.push(`${field.label} must be a valid URL.`);
      }
    }

    if (
      field.type === "single_select" &&
      field.options.length > 0 &&
      !field.options.includes(String(value))
    ) {
      errors.push(`${field.label} must use a valid option.`);
    }

    if (field.type === "multi_select" && Array.isArray(value)) {
      const invalid = value.some((item) => !field.options.includes(String(item)));
      if (invalid) errors.push(`${field.label} contains an invalid option.`);
    }
  }

  return errors;
}
