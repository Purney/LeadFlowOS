import { z } from "zod";
import {
  handoffStatuses,
  handoffTemplateTypes,
  paymentGateStatuses,
} from "@/types/handoff";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Expected a Mongo object id.");

export const onboardingHandoffInputSchema = z.object({
  dealId: objectId,
  projectName: z.string().trim().min(2).max(160).optional(),
  projectType: z.enum(handoffTemplateTypes).default("automation"),
  createProject: z.coerce.boolean().default(true),
  createPortalAccess: z.coerce.boolean().default(true),
  createSignatureRequest: z.coerce.boolean().default(false),
  runTaskAutomation: z.coerce.boolean().default(true),
  requirePaymentBeforeKickoff: z.coerce.boolean().default(true),
  paymentDueCents: z.coerce.number().int().min(0).default(0),
  paymentDescription: z.string().trim().max(240).optional().or(z.literal("")),
  signerName: z.string().trim().max(120).optional().or(z.literal("")),
  signerEmail: z.string().email().optional().or(z.literal("")),
  contractTerms: z.string().trim().max(20_000).optional().or(z.literal("")),
  kickoffNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const onboardingHandoffUpdateSchema = z.object({
  status: z.enum(handoffStatuses).optional(),
  paymentStatus: z.enum(paymentGateStatuses).optional(),
  kickoffNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type OnboardingHandoffInput = z.infer<
  typeof onboardingHandoffInputSchema
>;
export type OnboardingHandoffUpdateInput = z.infer<
  typeof onboardingHandoffUpdateSchema
>;
