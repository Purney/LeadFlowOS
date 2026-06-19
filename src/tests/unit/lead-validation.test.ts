import { describe, expect, it } from "vitest";
import { leadInputSchema } from "@/validation/lead";

describe("lead validation", () => {
  it("normalises email and defaults status", () => {
    const lead = leadInputSchema.parse({
      email: " Ada@Example.COM ",
      tags: ["ai"],
    });

    expect(lead.email).toBe("ada@example.com");
    expect(lead.status).toBe("discovery_booked");
  });

  it("rejects invalid emails", () => {
    const result = leadInputSchema.safeParse({
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("sanitises custom fields into a safe text map", () => {
    const lead = leadInputSchema.parse({
      email: "ada@example.com",
      customFields: {
        "Project Type": "Healthcare refurbishment",
        "__proto__": "blocked",
        empty: "",
        "1bad": "blocked",
      },
    });

    expect(lead.customFields).toEqual({
      "Project Type": "Healthcare refurbishment",
    });
  });
});
