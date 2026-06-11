import { describe, expect, it } from "vitest";
import {
  applyPersonalisation,
  extractPersonalisationVariables,
} from "@/utils/personalisation";

describe("personalisation", () => {
  it("replaces supported placeholders", () => {
    const result = applyPersonalisation(
      "Hi {{firstName}}, is {{company}} still using {{website}}?",
      {
        firstName: "Ada",
        company: "Analytical Engines Ltd",
        website: "https://example.com",
      },
    );

    expect(result).toBe(
      "Hi Ada, is Analytical Engines Ltd still using https://example.com?",
    );
  });

  it("extracts variables from templates", () => {
    expect(
      extractPersonalisationVariables("{{firstName}} at {{ company }}"),
    ).toEqual(["firstName", "company"]);
  });
});
