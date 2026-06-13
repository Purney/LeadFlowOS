import { z } from "zod";

const optionalSecret = z.string().trim().optional().or(z.literal(""));

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    APP_ENV: z.enum(["development", "production", "test"]).default("development"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    MONGODB_URI: z.string().trim().min(1).optional(),
    AUTH_SECRET: optionalSecret,
    AUTH_URL: z.string().url().optional().or(z.literal("")),
    MAILGUN_API_KEY: optionalSecret,
    MAILGUN_DOMAIN: optionalSecret,
    MAILGUN_WEBHOOK_SIGNING_KEY: optionalSecret,
    MAILGUN_API_BASE_URL: z.string().url().optional().or(z.literal("")),
    STRIPE_SECRET_KEY: optionalSecret,
    STRIPE_WEBHOOK_SECRET: optionalSecret,
    OPENAI_API_KEY: optionalSecret,
    OPENAI_MODEL: z.string().trim().default("gpt-4.1-mini"),
    SIGNATURE_PROVIDER_API_KEY: optionalSecret,
    SIGNATURE_PROVIDER_WEBHOOK_SECRET: optionalSecret,
    CRON_SECRET: optionalSecret,
    ALLOW_ADDITIONAL_ORG_SIGNUPS: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production") {
      for (const key of ["MONGODB_URI", "AUTH_SECRET", "AUTH_URL", "CRON_SECRET"] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required in production.`,
          });
        }
      }
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}

export function requireEnv(name: keyof AppEnv): string {
  const value = getEnv()[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}
