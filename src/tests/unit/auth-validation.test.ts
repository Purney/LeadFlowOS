import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/validation/auth";

describe("auth validation", () => {
  it("normalises login email", () => {
    const result = loginSchema.parse({
      email: " Owner@Example.COM ",
      password: "password",
    });

    expect(result.email).toBe("owner@example.com");
  });

  it("rejects weak signup passwords", () => {
    const result = signupSchema.safeParse({
      ownerName: "Ada Lovelace",
      organisationName: "LeadFlow",
      email: "ada@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });
});
