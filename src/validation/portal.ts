import { z } from "zod";
import {
  onboardingTaskStatuses,
  portalMessageAuthors,
  signatureRequestStatuses,
} from "@/types/portal";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Expected a Mongo object id.");

export const portalAccessInputSchema = z.object({
  clientId: objectId,
  label: z.string().trim().min(1).max(120).default("Client portal"),
  expiresAt: z.coerce.date().optional(),
});

export const onboardingTaskInputSchema = z.object({
  clientId: objectId,
  projectId: objectId.optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2_000).optional(),
  status: z.enum(onboardingTaskStatuses).default("pending"),
  dueDate: z.coerce.date().optional(),
});

export const onboardingTaskUpdateSchema = onboardingTaskInputSchema
  .partial()
  .extend({
    status: z.enum(onboardingTaskStatuses).optional(),
  });

export const signatureRequestInputSchema = z.object({
  clientId: objectId,
  proposalId: objectId.optional(),
  title: z.string().trim().min(1).max(160),
  signerName: z.string().trim().min(1).max(120),
  signerEmail: z.string().trim().email(),
  termsMarkdown: z.string().trim().min(1).max(20_000),
  status: z.enum(signatureRequestStatuses).default("sent"),
  useExternalProvider: z.coerce.boolean().default(false),
});

export const signatureRequestUpdateSchema = z.object({
  status: z.enum(signatureRequestStatuses).optional(),
});

export const publicSignatureSchema = z.object({
  signerName: z.string().trim().min(1).max(120),
  signatureText: z.string().trim().min(1).max(120),
});

export const pdfExportInputSchema = z.object({
  clientId: objectId.optional(),
  proposalId: objectId.optional(),
  title: z.string().trim().min(1).max(160),
});

export const portalMessageInputSchema = z.object({
  clientId: objectId,
  projectId: objectId.optional(),
  body: z.string().trim().min(1).max(4_000),
  authorType: z.enum(portalMessageAuthors).default("internal"),
  authorName: z.string().trim().min(1).max(120).optional(),
});

export const publicPortalMessageSchema = z.object({
  projectId: objectId.optional(),
  body: z.string().trim().min(1).max(4_000),
  authorName: z.string().trim().min(1).max(120),
});

export const onboardingAutomationInputSchema = z.object({
  clientId: objectId,
  projectId: objectId.optional(),
});

export type PortalAccessInput = z.infer<typeof portalAccessInputSchema>;
export type OnboardingTaskInput = z.infer<typeof onboardingTaskInputSchema>;
export type OnboardingTaskUpdateInput = z.infer<typeof onboardingTaskUpdateSchema>;
export type SignatureRequestInput = z.infer<typeof signatureRequestInputSchema>;
export type SignatureRequestUpdateInput = z.infer<typeof signatureRequestUpdateSchema>;
export type PublicSignatureInput = z.infer<typeof publicSignatureSchema>;
export type PdfExportInput = z.infer<typeof pdfExportInputSchema>;
export type PortalMessageInput = z.infer<typeof portalMessageInputSchema>;
export type PublicPortalMessageInput = z.infer<typeof publicPortalMessageSchema>;
export type OnboardingAutomationInput = z.infer<
  typeof onboardingAutomationInputSchema
>;
