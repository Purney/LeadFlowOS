import { describe, expect, it } from "vitest";
import {
  clientInputSchema,
  convertLeadSchema,
  projectInputSchema,
  timeEntryInputSchema,
} from "@/validation/client";

describe("client validation", () => {
  it("validates client contacts", () => {
    const result = clientInputSchema.parse({
      company: "Client Co",
      contacts: [{ name: "Grace Hopper", email: "grace@example.com" }],
      notes: "Onboarding next week",
    });

    expect(result.contacts[0].email).toBe("grace@example.com");
  });

  it("validates lead conversion input", () => {
    const result = convertLeadSchema.parse({
      leadId: "665f2d3fc7953f6e91c80a10",
      stripeCustomerId: "cus_123",
    });

    expect(result.leadId).toBe("665f2d3fc7953f6e91c80a10");
  });

  it("coerces project and time entry numeric fields", () => {
    const project = projectInputSchema.parse({
      clientId: "665f2d3fc7953f6e91c80a11",
      name: "AI workflow build",
      type: "automation",
      status: "active",
      estimatedValue: "12000",
      actualRevenue: "9000",
    });
    const timeEntry = timeEntryInputSchema.parse({
      clientId: "665f2d3fc7953f6e91c80a11",
      projectId: "665f2d3fc7953f6e91c80a12",
      date: "2026-06-11",
      minutes: "90",
      description: "Discovery mapping",
    });

    expect(project.estimatedValue).toBe(12000);
    expect(project.actualRevenue).toBe(9000);
    expect(timeEntry.minutes).toBe(90);
  });
});
