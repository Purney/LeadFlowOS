export const aiDraftTypes = ["cold_email", "reply"] as const;
export const aiDraftStatuses = ["draft", "reviewed", "discarded"] as const;

export type AiDraftType = (typeof aiDraftTypes)[number];
export type AiDraftStatus = (typeof aiDraftStatuses)[number];

export type ColdEmailDraftContent = {
  subjects: string[];
  body: string;
  followUps: string[];
};

export type ReplyDraftContent = {
  summary: string;
  suggestedResponse: string;
};
