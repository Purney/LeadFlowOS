import { describe, expect, it } from "vitest";
import { envSchema } from "@/lib/env";

describe("env validation", () => {
  it("parses development defaults", () => {
    const env = envSchema.parse({});

    expect(env.APP_ENV).toBe("development");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.ALLOW_ADDITIONAL_ORG_SIGNUPS).toBe(false);
  });

  it("requires core production secrets", () => {
    const result = envSchema.safeParse({
      NODE_ENV: "production",
      APP_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://leadflow.example",
    });

    expect(result.success).toBe(false);
  });
});
