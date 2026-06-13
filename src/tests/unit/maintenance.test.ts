import { describe, expect, it } from "vitest";
import {
  clientHealthStatuses,
  maintenanceCadences,
  supportTicketPriorities,
} from "@/types/maintenance";
import { maintenancePlanInputSchema } from "@/validation/maintenance";

describe("maintenance validation", () => {
  it("contains maintenance operating sets", () => {
    expect(maintenanceCadences).toContain("monthly");
    expect(supportTicketPriorities).toContain("urgent");
    expect(clientHealthStatuses).toEqual(["healthy", "watch", "at_risk"]);
  });

  it("validates plan input", () => {
    const parsed = maintenancePlanInputSchema.parse({
      clientId: "507f1f77bcf86cd799439011",
      name: "Monthly care",
      monthlyFeeCents: 250000,
      includedHours: 5,
      health: "watch",
    });

    expect(parsed.cadence).toBe("monthly");
    expect(parsed.health).toBe("watch");
  });
});
