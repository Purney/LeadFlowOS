export const commandSeverities = ["critical", "warning", "info"] as const;
export type CommandSeverity = (typeof commandSeverities)[number];

export const commandAreas = [
  "research",
  "sales",
  "onboarding",
  "execution",
  "maintenance",
  "revenue",
  "portal",
] as const;
export type CommandArea = (typeof commandAreas)[number];

export type CommandAction = {
  id: string;
  area: CommandArea;
  severity: CommandSeverity;
  title: string;
  detail: string;
  href: string;
};
