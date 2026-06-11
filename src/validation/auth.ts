import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  ownerName: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email().toLowerCase(),
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .regex(/[A-Z]/, "Use at least one uppercase letter.")
    .regex(/[a-z]/, "Use at least one lowercase letter.")
    .regex(/[0-9]/, "Use at least one number."),
  organisationName: z.string().trim().min(2, "Enter an organisation name."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
