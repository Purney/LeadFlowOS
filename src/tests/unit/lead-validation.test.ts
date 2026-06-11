import { describe, expect, it } from "vitest";
import { leadInputSchema } from "@/validation/lead";

describe("lead validation", () => {
  it("normalises email and defaults status", () => {
    const lead = leadInputSchema.parse({
      email: " Ada@Example.COM ",
      tags: ["ai"],
    });

    expect(lead.email).toBe("ada@example.com");
    expect(lead.status).toBe("new");
  });

  it("rejects invalid emails", () => {
    const result = leadInputSchema.safeParse({
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });
});
