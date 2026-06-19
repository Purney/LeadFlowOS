import { z } from "zod";
import { toFieldKey } from "@/utils/field-key";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const leadCustomFieldDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(64),
  key: optionalText,
});

export const organisationSettingsSchema = z.object({
  leadCustomFields: z
    .array(leadCustomFieldDefinitionSchema)
    .max(50)
    .default([])
    .transform((fields) => {
      const seen = new Set<string>();

      return fields
        .map((field) => {
          const key = toFieldKey(field.key ?? field.name);
          return { name: field.name.trim(), key };
        })
        .filter((field) => {
          if (!field.key || seen.has(field.key)) return false;
          seen.add(field.key);
          return true;
        });
    }),
});

export type OrganisationSettingsInput = z.infer<typeof organisationSettingsSchema>;
