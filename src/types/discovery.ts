export const discoveryFieldTypes = [
  "short_text",
  "long_text",
  "number",
  "date",
  "single_select",
  "multi_select",
  "url",
  "file",
] as const;

export const discoveryFormStatuses = ["draft", "published", "archived"] as const;

export type DiscoveryFieldType = (typeof discoveryFieldTypes)[number];
export type DiscoveryFormStatus = (typeof discoveryFormStatuses)[number];

export type DiscoveryField = {
  id: string;
  label: string;
  type: DiscoveryFieldType;
  required: boolean;
  options: string[];
};
