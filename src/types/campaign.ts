export const campaignStatuses = [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export const enrollmentStatuses = [
  "active",
  "paused",
  "completed",
  "replied",
  "unsubscribed",
] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];

export type CampaignVariantSelection = {
  subjectIndex: number;
  bodyIndex: number;
};
