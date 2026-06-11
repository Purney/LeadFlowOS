import { z } from "zod";
import { suppressionReasons } from "@/types/sending";

export const suppressionInputSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  reason: z.enum(suppressionReasons),
  note: z.string().trim().optional(),
});

export type SuppressionInput = z.infer<typeof suppressionInputSchema>;
