export const onboardingTaskStatuses = [
  "pending",
  "in_progress",
  "completed",
  "blocked",
] as const;

export const signatureRequestStatuses = [
  "draft",
  "sent",
  "signed",
  "declined",
] as const;

export const pdfExportStatuses = ["generated", "archived"] as const;
export const portalMessageAuthors = ["internal", "client"] as const;

export type OnboardingTaskStatus = (typeof onboardingTaskStatuses)[number];
export type SignatureRequestStatus = (typeof signatureRequestStatuses)[number];
export type PdfExportStatus = (typeof pdfExportStatuses)[number];
export type PortalMessageAuthor = (typeof portalMessageAuthors)[number];
