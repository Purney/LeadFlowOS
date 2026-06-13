import { describe, expect, it } from "vitest";

import { commandAreas, commandSeverities } from "@/types/command";

describe("command center types", () => {
  it("defines the supported severity levels in priority order", () => {
    expect(commandSeverities).toEqual(["critical", "warning", "info"]);
  });

  it("covers the operating areas surfaced by the command center", () => {
    expect(commandAreas).toEqual([
      "research",
      "outreach",
      "sales",
      "onboarding",
      "execution",
      "maintenance",
      "revenue",
      "portal",
    ]);
  });
});
